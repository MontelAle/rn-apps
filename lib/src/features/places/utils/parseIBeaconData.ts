import { Buffer } from 'buffer';

export type IBeacon = {
  uuid: string;
  major: number;
  minor: number;
  rssi: number | null;
};

/**
 * Converte un UUID iBeacon da 16 byte nel formato standard esadecimale:
 * xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
function formatUuid(bytes: Uint8Array | Buffer): string {
  // Convertiamo esplicitamente ogni singolo byte in un esadecimale di 2 caratteri (es. 168 -> 'a8')
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase(); // Usa toLowerCase() se preferisci i caratteri minuscoli

  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join('-');
}
export function parseIBeacon(
  manufacturerData: string | null | undefined,
  rssi: number | null | undefined,
): IBeacon | null {
  if (!manufacturerData) {
    return null;
  }

  try {
    const data = Buffer.from(manufacturerData, 'base64');

    /*
     * iBeacon:
     *
     * 0-1   Apple Company ID: 4C 00
     * 2     Type: 02
     * 3     Length: 15
     * 4-19  UUID
     * 20-21 Major
     * 22-23 Minor
     * 24    Measured Power
     */

    if (data.length < 25) {
      return null;
    }

    // Apple Company ID
    const isApple = data[0] === 0x4c && data[1] === 0x00;

    // iBeacon type + length
    const isIBeacon = data[2] === 0x02 && data[3] === 0x15;

    if (!isApple || !isIBeacon) {
      return null;
    }

    // UUID: byte 4 -> byte 19
    const uuidBytes = data.subarray(4, 20);
    const uuid = formatUuid(uuidBytes);

    // Major: byte 20-21, big endian
    const major = data.readUInt16BE(20);

    // Minor: byte 22-23, big endian
    const minor = data.readUInt16BE(22);

    return {
      uuid,
      major,
      minor,
      rssi: rssi ?? null,
    };
  } catch (error) {
    console.error('Error parsing iBeacon:', error);
    return null;
  }
}
