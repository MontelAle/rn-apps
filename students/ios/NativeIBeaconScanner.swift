import Foundation
import CoreLocation

@objc(NativeIBeaconScanner)
class NativeIBeaconScanner: RCTEventEmitter, CLLocationManagerDelegate {

    private var locationManager: CLLocationManager?
    private var beaconConstraints: [String: CLBeaconIdentityCondition] = [:]

    override init() {
        super.init()

        locationManager = CLLocationManager()
        locationManager?.delegate = self
    }

    // MARK: - React Native

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func supportedEvents() -> [String]! {
        return [
            "iBeaconDetected",
            "iBeaconError",
            "iBeaconAuthorization"
        ]
    }

    // MARK: - Start

    @objc(start:)
    func start(uuidString: String) {

        guard let uuid = UUID(uuidString: uuidString) else {
            sendEvent(
                withName: "iBeaconError",
                body: [
                    "message": "Invalid UUID: \(uuidString)"
                ]
            )
            return
        }

        DispatchQueue.main.async { [weak self] in

            guard let self = self else {
                return
            }

            guard let locationManager = self.locationManager else {
                return
            }

            // Ask for location permission if necessary
            if locationManager.authorizationStatus == .notDetermined {
                locationManager.requestWhenInUseAuthorization()
            }

            let constraint = CLBeaconIdentityCondition(uuid: uuid)

            self.beaconConstraints[uuidString] = constraint

            locationManager.startRangingBeacons(satisfying: constraint)
        }
    }

    // MARK: - Stop

    @objc(stop:)
    func stop(uuidString: String) {

        guard let constraint = beaconConstraints[uuidString] else {
            return
        }

        DispatchQueue.main.async { [weak self] in

            guard let self = self else {
                return
            }

            self.locationManager?.stopRangingBeacons(
                satisfying: constraint
            )

            self.beaconConstraints.removeValue(
                forKey: uuidString
            )
        }
    }

    // MARK: - Stop all

    @objc(stopAll)
    func stopAll() {

        DispatchQueue.main.async { [weak self] in

            guard let self = self else {
                return
            }

            for constraint in self.beaconConstraints.values {
                self.locationManager?.stopRangingBeacons(
                    satisfying: constraint
                )
            }

            self.beaconConstraints.removeAll()
        }
    }

    // MARK: - Authorization

    func locationManagerDidChangeAuthorization(
        _ manager: CLLocationManager
    ) {

        let status = manager.authorizationStatus

        let statusString: String

        switch status {

        case .authorizedWhenInUse:
            statusString = "authorizedWhenInUse"

        case .authorizedAlways:
            statusString = "authorizedAlways"

        case .denied:
            statusString = "denied"

        case .restricted:
            statusString = "restricted"

        case .notDetermined:
            statusString = "notDetermined"

        @unknown default:
            statusString = "unknown"
        }

        sendEvent(
            withName: "iBeaconAuthorization",
            body: [
                "status": statusString
            ]
        )

        // If permission has just been granted,
        // restart all requested beacon ranges.
        if status == .authorizedWhenInUse ||
           status == .authorizedAlways {

            for constraint in beaconConstraints.values {

                manager.startRangingBeacons(
                    satisfying: constraint
                )
            }
        }
    }

    // MARK: - Beacon ranging

    func locationManager(
        _ manager: CLLocationManager,
        didRange beacons: [CLBeacon],
        satisfying beaconConstraint: CLBeaconIdentityCondition
    ) {

        for beacon in beacons {

            let uuid = beacon.uuid.uuidString.lowercased()

            let major = beacon.major.intValue
            let minor = beacon.minor.intValue
            let rssi = beacon.rssi
            let proximity = beacon.proximity.rawValue

            sendEvent(
                withName: "iBeaconDetected",
                body: [
                    "uuid": uuid,
                    "major": major,
                    "minor": minor,
                    "rssi": rssi,
                    "proximity": proximity,
                    "timestamp": Int(Date().timeIntervalSince1970 * 1000)
                ]
            )
        }
    }

    // MARK: - Errors

    func locationManager(
        _ manager: CLLocationManager,
        didFailRangingFor beaconConstraint: CLBeaconIdentityCondition,
        error: Error
    ) {

        sendEvent(
            withName: "iBeaconError",
            body: [
                "message": error.localizedDescription
            ]
        )
    }
}