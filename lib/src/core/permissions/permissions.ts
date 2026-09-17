// At runtime React Native will use .android.ts or .ios.ts file

export const requestBluetoothPermissions: () => Promise<boolean> = () => {
  return Promise.resolve(false);
};
