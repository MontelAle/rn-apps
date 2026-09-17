package it.polito.students; // Sostituisci con il tuo package name

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.altbeacon.beacon.Beacon;
import org.altbeacon.beacon.BeaconManager;
import org.altbeacon.beacon.BeaconParser;
import org.altbeacon.beacon.MonitorNotifier;
import org.altbeacon.beacon.RangeNotifier;
import org.altbeacon.beacon.Region;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

public class BeaconModule extends ReactContextBaseJavaModule implements RangeNotifier, MonitorNotifier {

    public static final String REACT_CLASS = "Beacon";
    private BeaconManager beaconManager;
    private ReactApplicationContext reactContext;

    // Kalman Filter State
    private static class KalmanState {
        double estimate;
        double errorCovariance;
        KalmanState(double measurement) {
            this.estimate = measurement;
            this.errorCovariance = 1.0;
        }
    }

    private boolean kalmanEnabled = false;
    private double kalmanQ = 0.008;
    private double kalmanR = 0.1;
    private HashMap<String, KalmanState> kalmanStates = new HashMap<>();

    private HashMap<String, Region> rangingRegions = new HashMap<>();
    private HashMap<String, Region> monitoringRegions = new HashMap<>();

    public BeaconModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
        this.beaconManager = BeaconManager.getInstanceForApplication(context);
        
        // IMPORTANTISSIMO: Aggiunge il layout per riconoscere gli iBeacon di Apple (che di default AltBeacon non legge per motivi di copyright)
        this.beaconManager.getBeaconParsers().add(
                new BeaconParser().setBeaconLayout("m:2-3=0215,i:4-19,i:20-21,i:22-23,p:24-24")
        );

        this.beaconManager.addRangeNotifier(this);
        this.beaconManager.addMonitorNotifier(this);
    }

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    private void sendEvent(String eventName, WritableMap params) {
        if (reactContext.hasActiveCatalystInstance()) {
            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(eventName, params);
        }
    }

    @ReactMethod
    public void configure(ReadableMap config) {
        if (config == null) return;
        
        if (config.hasKey("kalmanFilter")) {
            ReadableMap kalman = config.getMap("kalmanFilter");
            if (kalman != null) {
                if (kalman.hasKey("enabled")) kalmanEnabled = kalman.getBoolean("enabled");
                if (kalman.hasKey("q")) kalmanQ = kalman.getDouble("q");
                if (kalman.hasKey("r")) kalmanR = kalman.getDouble("r");
                kalmanStates.clear();
            }
        }
        
        // Qui su Android puoi implementare i setting aggiuntivi di scan background ignorati in iOS
        if (config.hasKey("scanPeriod")) {
            beaconManager.setForegroundScanPeriod((long) config.getDouble("scanPeriod"));
        }
    }

    @ReactMethod
    public void startRanging(ReadableMap regionMap, Promise promise) {
        try {
            Region region = createRegion(regionMap);
            rangingRegions.put(region.getUniqueId(), region);
            beaconManager.startRangingBeacons(region);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("RANGING_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopRanging(ReadableMap regionMap, Promise promise) {
        try {
            String identifier = regionMap.getString("identifier");
            Region region = rangingRegions.get(identifier);
            if (region != null) {
                beaconManager.stopRangingBeacons(region);
                rangingRegions.remove(identifier);
            }
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("RANGING_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void startMonitoring(ReadableMap regionMap, Promise promise) {
        try {
            Region region = createRegion(regionMap);
            monitoringRegions.put(region.getUniqueId(), region);
            beaconManager.startMonitoring(region);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("MONITORING_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopMonitoring(ReadableMap regionMap, Promise promise) {
        try {
            String identifier = regionMap.getString("identifier");
            Region region = monitoringRegions.get(identifier);
            if (region != null) {
                beaconManager.stopMonitoring(region);
                monitoringRegions.remove(identifier);
            }
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("MONITORING_ERROR", e.getMessage());
        }
    }

    private Region createRegion(ReadableMap map) {
        String identifier = map.getString("identifier");
        String uuid = map.getString("uuid");
        
        org.altbeacon.beacon.Identifier id1 = uuid != null ? org.altbeacon.beacon.Identifier.parse(uuid) : null;
        org.altbeacon.beacon.Identifier id2 = map.hasKey("major") ? org.altbeacon.beacon.Identifier.fromInt(map.getInt("major")) : null;
        org.altbeacon.beacon.Identifier id3 = map.hasKey("minor") ? org.altbeacon.beacon.Identifier.fromInt(map.getInt("minor")) : null;

        ArrayList<org.altbeacon.beacon.Identifier> identifiers = new ArrayList<>();
        if (id1 != null) identifiers.add(id1);
        if (id2 != null) identifiers.add(id2);
        if (id3 != null) identifiers.add(id3);

        return new Region(identifier, identifiers);
    }

    // --- Kalman Filter ---
    private double applyKalman(String key, double measurement) {
        KalmanState state = kalmanStates.get(key);
        if (state == null) {
            state = new KalmanState(measurement);
            kalmanStates.put(key, state);
        }
        double predictedError = state.errorCovariance + kalmanQ;
        double gain = predictedError / (predictedError + kalmanR);
        state.estimate = state.estimate + gain * (measurement - state.estimate);
        state.errorCovariance = (1.0 - gain) * predictedError;
        return state.estimate;
    }

    // --- Callbacks AltBeacon ---
    @Override
    public void didRangeBeaconsInRegion(Collection<Beacon> beacons, Region region) {
        WritableArray beaconArray = Arguments.createArray();

        for (Beacon b : beacons) {
            String uuidStr = b.getId1().toString().toLowerCase();
            int major = b.getId2().toInt();
            int minor = b.getId3().toInt();
            double rawDistance = b.getDistance();
            
            String key = uuidStr + ":" + major + ":" + minor;
            double distance = (kalmanEnabled && rawDistance >= 0) ? applyKalman(key, rawDistance) : rawDistance;

            WritableMap beaconMap = Arguments.createMap();
            beaconMap.putString("uuid", uuidStr);
            beaconMap.putInt("major", major);
            beaconMap.putInt("minor", minor);
            beaconMap.putInt("rssi", b.getRssi());
            beaconMap.putDouble("distance", distance);
            beaconMap.putDouble("rawDistance", rawDistance);
            beaconMap.putInt("txPower", b.getTxPower());
            beaconMap.putString("macAddress", b.getBluetoothAddress());
            beaconMap.putDouble("timestamp", System.currentTimeMillis());

            beaconArray.pushMap(beaconMap);
        }

        WritableMap regionMap = Arguments.createMap();
        regionMap.putString("identifier", region.getUniqueId());
        if (region.getId1() != null) regionMap.putString("uuid", region.getId1().toString());

        WritableMap payload = Arguments.createMap();
        payload.putMap("region", regionMap);
        payload.putArray("beacons", beaconArray);

        sendEvent("onBeaconsRanged", payload);
    }

    @Override
    public void didEnterRegion(Region region) {
        emitRegionStateChange(region, "inside");
    }

    @Override
    public void didExitRegion(Region region) {
        emitRegionStateChange(region, "outside");
    }

    @Override
    public void didDetermineStateForRegion(int state, Region region) {
        if (state == MonitorNotifier.INSIDE) {
            emitRegionStateChange(region, "inside");
        } else if (state == MonitorNotifier.OUTSIDE) {
            emitRegionStateChange(region, "outside");
        }
    }

    private void emitRegionStateChange(Region region, String state) {
        WritableMap regionMap = Arguments.createMap();
        regionMap.putString("identifier", region.getUniqueId());
        
        WritableMap payload = Arguments.createMap();
        payload.putMap("region", regionMap);
        payload.putString("state", state);
        sendEvent("onRegionStateChanged", payload);
    }

    // --- Metodi Utilità e Android Specifics (Richiesti dal JS) ---
    @ReactMethod
    public void checkPermissions(Promise promise) {
        boolean granted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) { // Android 12+
            granted = ContextCompat.checkSelfPermission(reactContext, Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED;
        } else {
            granted = ContextCompat.checkSelfPermission(reactContext, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        }
        promise.resolve(granted);
    }

    @ReactMethod
    public void getEnvironmentState(Promise promise) {
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        boolean btEnabled = (adapter != null && adapter.isEnabled());
        
        WritableMap map = Arguments.createMap();
        map.putBoolean("bluetoothEnabled", btEnabled);
        promise.resolve(map);
    }

    @ReactMethod
    public void isIgnoringBatteryOptimizations(Promise promise) {
        // Implementazione dummy o controlli reali tramite PowerManager
        promise.resolve(true); 
    }

    @ReactMethod
    public void requestIgnoreBatteryOptimizations() { }

    @ReactMethod
    public void openAutostartSettings(String packageName, String className) { }

    @ReactMethod
    public void updateNotification(ReadableMap config) { }
    
    // Obbligatorio per React Native (EventEmitter listener placeholder)
    @ReactMethod
    public void addListener(String eventName) {}
    
    @ReactMethod
    public void removeListeners(Integer count) {}
}