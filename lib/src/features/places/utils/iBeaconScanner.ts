import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

export interface IBeaconObservation {
  uuid: string;
  major: number;
  minor: number;
  rssi: number;
  proximity: number;
  timestamp: number;
}

interface NativeIBeaconScannerType {
  start(uuid: string): void;
  stop(uuid: string): void;
  stopAll(): void;
}

const NativeIBeaconScanner =
  NativeModules.NativeIBeaconScanner as NativeIBeaconScannerType;

const emitter =
  Platform.OS === 'ios'
    ? new NativeEventEmitter(NativeIBeaconScanner as any)
    : null;

export const startIBeaconScanner = (
  uuid: string,
  onBeacon: (beacon: IBeaconObservation) => void,
  onError?: (error: string) => void,
) => {
  if (Platform.OS !== 'ios') {
    console.warn('startIBeaconScanner is only available on iOS');

    return () => {};
  }

  const beaconSubscription = emitter!.addListener(
    'iBeaconDetected',
    (beacon: IBeaconObservation) => {
      onBeacon(beacon);
    },
  );

  const errorSubscription = emitter!.addListener(
    'iBeaconError',
    (event: { message: string }) => {
      console.warn('[iBeacon]', event.message);

      onError?.(event.message);
    },
  );

  NativeIBeaconScanner.start(uuid);

  return () => {
    beaconSubscription.remove();
    errorSubscription.remove();

    NativeIBeaconScanner.stop(uuid);
  };
};
