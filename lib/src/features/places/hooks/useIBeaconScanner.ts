import { useCallback, useRef, useState } from 'react';

import {
  IBeaconObservation,
  startIBeaconScanner,
} from '../utils/iBeaconScanner';

export const useIBeaconScanner = () => {
  const [isScanning, setIsScanning] = useState(false);

  const [beacons, setBeacons] = useState<IBeaconObservation[]>([]);

  const stopScannerRef = useRef<(() => void) | null>(null);

  const startScanner = useCallback(
    (uuid: string) => {
      if (isScanning) {
        return;
      }

      setBeacons([]);
      setIsScanning(true);

      stopScannerRef.current = startIBeaconScanner(
        uuid,

        beacon => {
          setBeacons(prev => {
            const key = `${beacon.uuid}-${beacon.major}-${beacon.minor}`;

            const existingIndex = prev.findIndex(
              b => `${b.uuid}-${b.major}-${b.minor}` === key,
            );

            if (existingIndex === -1) {
              return [...prev, beacon];
            }

            const updated = [...prev];

            updated[existingIndex] = beacon;

            return updated;
          });
        },

        error => {
          console.error('iBeacon error:', error);
        },
      );
    },
    [isScanning],
  );

  const stopScanner = useCallback(() => {
    stopScannerRef.current?.();

    stopScannerRef.current = null;

    setIsScanning(false);
  }, []);

  return {
    startScanner,
    stopScanner,
    isScanning,
    beacons,
  };
};
