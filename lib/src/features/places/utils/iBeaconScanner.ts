import { NativeEventEmitter, NativeModules } from 'react-native';

import { requestBluetoothPermissions } from '../../../core/permissions/permissions';

export interface IBeaconObservation {
  uuid: string;
  major: number;
  minor: number;
  rssi: number;
  proximity: number;
  timestamp: number;
}

const { Beacon } = NativeModules;
const emitter = new NativeEventEmitter(Beacon);

export const startIBeaconScanner = (
  uuid: string,
  onBeacon: (beacon: IBeaconObservation) => void,
  onError?: (error: string) => void,
) => {
  const beaconSubscription = emitter.addListener(
    'onBeaconsRanged', //'iBeaconDetected'
    (data: { region: any; beacons: any[] }) => {
      if (data && data.beacons) {
        data.beacons.forEach(b => {
          onBeacon({
            uuid: b.uuid,
            major: b.major,
            minor: b.minor,
            rssi: b.rrsi,
            proximity: b.distance !== undefined ? b.distance : -1,
            timestamp: b.timestamp,
          });
        });
      }
    },
  );

  const errorSubscription = emitter!.addListener(
    'onRangingFailed',
    (event: { message: string }) => {
      console.warn('[iBeacon]', event.message);

      onError?.(event.message);
    },
  );

  requestBluetoothPermissions()
    .then((granted: boolean) => {
      if (!granted) {
        const errMsg =
          "Permessi Bluetooth/Localizzazione non concessi dall'utente.";
        console.warn('[iBeacon]', errMsg);
        onError?.(errMsg);
        return;
      }

      Beacon.startRanging({
        identifier: uuid,
        uuid: uuid,
      }).catch((err: any) => {
        console.warn('[iBeacon] Start Error', err);
        onError?.(err?.message || 'Failed to start ranging');
      });
    })
    .catch((err: any) => {
      console.error('[iBeacon] Errore durante il check dei permessi:', err);
      onError?.('Errore verifica permessi');
    });

  return () => {
    beaconSubscription.remove();
    errorSubscription.remove();

    Beacon.stopRanging({ identifier: uuid }).catch(() => {});
  };
};
