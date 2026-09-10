import { useCallback, useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
//import Beacon, { useBeaconRanging } from 'react-native-beacon-kit';
import { Device, ScanMode } from 'react-native-ble-plx';

import { bleManager } from '../utils/bleManager';
import { parseIBeacon } from '../utils/parseIBeaconData';

/*
const BEACON_UUID_MACOS = '00A82381-B393-4AA3-893F-8ED7F01E8966';
const BEACON_UUID_ANDROID = '07DA29F7-3A6C-46CB-920C-8386273FC84E';

const region = {
  identifier: 'Mac beacons',
  uuid: BEACON_UUID_MACOS,
};*/

export type ScannedBeacon = {
  deviceId: string;
  name: string | null;
  rssi: number | null;
  uuid: string;
  major: number;
  minor: number;
  manufacturerData: string | null;
};

/*
export const useScannerBluetooth = () => {
  const { beacons, error, isActive, start, stop } = useBeaconRanging({
    region,
    autoStart: false,
    stopOnUnmount: true,
  });

  useEffect(() => {
    console.log('==============================');
    console.log('BEACONS UPDATE');
    console.log('Numero beacon:', beacons.length);

    beacons.forEach((beacon, index) => {
      console.log(
        `[${index}] ` +
          `UUID=${beacon.uuid} ` +
          `Major=${beacon.major} ` +
          `Minor=${beacon.minor} ` +
          `RSSI=${beacon.rssi} ` +
          `Distance=${beacon.distance} ` +
          `MAC=${beacon.macAddress}`,
      );
    });

    console.log('==============================');
  }, [beacons]);

  const startScanning = useCallback(async () => {
    try {
      console.log('Starting Bluetooth scan...');

      Beacon.configure({
        scanPeriod: 10000,
        backgroundScanPeriod: 10000,
        betweenScanPeriod: 0,
      });

      await start();
    } catch {
      console.error('Error starting Bluetooth scan:', error);
    }
  }, [start]);

  const stopScanning = useCallback(async () => {
    try {
      await stop();
      console.log('Bluetooth scan stopped.');
    } catch {
      console.error('Error stopping Bluetooth scan:', error);
    }
  }, [stop]);

  return {
    beacons,
    error,
    isScanning: isActive,
    startScanning,
    stopScanning,
  };
};*/

export const useScannerBluetooth = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [_devices, setDevices] = useState<(Device | null)[]>([]);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestBluetoothPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    // Android 12+
    if (Platform.Version >= 31) {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);

      const scanGranted =
        result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
        PermissionsAndroid.RESULTS.GRANTED;

      const connectGranted =
        result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
        PermissionsAndroid.RESULTS.GRANTED;

      return scanGranted && connectGranted;
    }

    // Android < 12
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  const startScanning = useCallback(async () => {
    const permissionGranted = await requestBluetoothPermissions();

    if (permissionGranted) {
      setIsScanning(true);
      setDevices([]);
    } else {
      console.error('Bluetooth permissions not granted.');
      return;
    }

    // SCAN ALL DEVICES (No beacon filter)
    bleManager.startDeviceScan(
      null,
      { scanMode: ScanMode.LowLatency, allowDuplicates: true },
      (error, device) => {
        if (error) {
          bleManager.stopDeviceScan();
          console.error('Error during Bluetooth scan:', error);
          return;
        }

        // PARSE IBEACON
        const beacon = parseIBeacon(device?.manufacturerData, device?.rssi);

        if (!beacon) {
          return;
        }

        // ADD TO BUFFER
        setDevices((prevDevices: any[]) => {
          const alreadyExists = prevDevices.some(
            existingDevice => existingDevice.deviceId === device?.id,
          );

          if (alreadyExists) {
            return prevDevices;
          }

          const newBeacon: ScannedBeacon = {
            deviceId: device?.id ?? '',
            name: device?.name ?? null,
            rssi: device?.rssi ?? null,

            uuid: beacon.uuid,
            major: beacon.major,
            minor: beacon.minor,

            manufacturerData: device?.manufacturerData ?? null,
          };

          return [...prevDevices, newBeacon];
        });

        scanTimeoutRef.current = setTimeout(() => {
          bleManager.stopDeviceScan();
          setIsScanning(false);
        }, 5000);
      },
    );
  }, [requestBluetoothPermissions]);

  const stopScanning = useCallback(() => {
    bleManager.stopDeviceScan();

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }

    setIsScanning(false);
  }, []);

  return {
    isScanning,
    startScanning,
    stopScanning,
  };
};
