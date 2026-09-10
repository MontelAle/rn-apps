import { Button, StyleSheet, Text, View } from 'react-native';

import { useScannerBluetooth } from '../hooks/useBleFingerPrinting';

export const BleScreenTest = () => {
  const { isScanning, startScanning, stopScanning } = useScannerBluetooth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ambient Room Mapping</Text>

      {/* PHASE 2: LOCATING */}
      <View style={styles.card}>
        <Text style={styles.subtitle}> Scan Bluetooth devices</Text>
        <Button
          title={isScanning ? 'Stop Scan' : 'Start Scan'}
          color="blue"
          onPress={isScanning ? stopScanning : startScanning}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  warning: { color: 'red', textAlign: 'center', marginBottom: 10 },
  scanBox: { alignItems: 'center', marginBottom: 20 },
  scanText: { marginTop: 10, fontSize: 16, fontWeight: 'bold' },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  subtitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
});
