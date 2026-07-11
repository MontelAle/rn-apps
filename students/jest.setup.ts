import 'react-native-gesture-handler/jestSetup';

import { server } from './src/test/server';

// --- imported mocks
// some libraries require instead their mocks be
// imported in jest.config

jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);

jest.mock('react-native-localize', () => require('react-native-localize/mock'));

jest.mock('react-native-permissions', () =>
  require('react-native-permissions/mock'),
);

jest.mock('react-native-device-info', () =>
  require('react-native-device-info/jest/react-native-device-info-mock'),
);

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// -- manual mocks
// sadly most libraries don't provide mocks.
// mocks provided here are taken from a mix of online sources and llm.
// mocks here are incomplete (by nature) and could require expanding when
// visiting not previously covered code paths

jest.mock('expo-sqlite/kv-store', () => ({
  SQLiteStorage: jest.fn(() => ({
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => {}),
    removeItem: jest.fn(async () => {}),
  })),
}));

jest.mock('expo-image', () => ({
  Image: require('react-native').Image,
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => ({
    execAsync: jest.fn(async () => {}),
    runAsync: jest.fn(async () => ({ lastInsertRowId: 0, changes: 0 })),
    getAllAsync: jest.fn(async () => []),
    getFirstAsync: jest.fn(async () => null),
    closeAsync: jest.fn(async () => {}),
  })),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(async () => {}),
  isAvailableAsync: jest.fn(async () => false),
}));

jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn(() => ({
      downloadAsync: jest.fn(async () => {}),
      uri: '',
    })),
    loadAsync: jest.fn(async () => {}),
  },
}));

jest.mock('expo-constants', () => ({
  expoConfig: null,
  executionEnvironment: 'bare',
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(async () => ({ type: 'opened' })),
  openAuthSessionAsync: jest.fn(async () => ({ type: 'cancel' })),
  dismissBrowser: jest.fn(async () => {}),
  dismissAuthSession: jest.fn(() => {}),
  warmUpAsync: jest.fn(async () => {}),
  coolDownAsync: jest.fn(async () => {}),
  WebBrowserPresentationStyle: {},
}));

jest.mock('@sentry/react-native', () => ({
  setUser: jest.fn(),
  reactNavigationIntegration: jest.fn(() => ({
    registerNavigationContainer: jest.fn(),
  })),
  reactNativeTracingIntegration: jest.fn(() => ({})),
  init: jest.fn(),
  wrap: (c: any) => c,
  ReactNavigationInstrumentation: jest.fn(),
}));

jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn(async () => {}),
  show: jest.fn(async () => {}),
  isVisible: jest.fn(async () => false),
  useHideAnimation: jest.fn(() => ({ container: {}, logo: {} })),
}));

jest.mock('react-native-file-viewer', () => ({
  open: jest.fn(async () => {}),
}));

jest.mock('react-native-html-to-pdf', () => ({
  convert: jest.fn(async () => ({ filePath: '/tmp/out.pdf' })),
}));

jest.mock('react-native-image-crop-picker', () => ({
  openPicker: jest.fn(async () => ({ path: '', mime: '', data: '' })),
  openCamera: jest.fn(async () => ({ path: '', mime: '', data: '' })),
  clean: jest.fn(async () => {}),
}));

jest.mock('@react-native-clipboard/clipboard', () => ({
  getString: jest.fn(async () => ''),
  setString: jest.fn(() => {}),
  hasString: jest.fn(async () => false),
}));

jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(() => 0),
  clearWatch: jest.fn(),
  requestAuthorization: jest.fn(),
  setRNConfiguration: jest.fn(),
}));

jest.mock('react-native-blob-util', () => ({
  config: jest.fn(() => ({
    fetch: jest.fn(async () => ({ path: () => '' })),
  })),
  fs: {
    dirs: { DocumentDir: '/tmp/documents', CacheDir: '/tmp/caches' },
    exists: jest.fn(async () => false),
    unlink: jest.fn(async () => {}),
  },
}));

jest.mock('react-native-saf-x', () => ({
  openDocumentTree: jest.fn(async () => null),
  hasPermission: jest.fn(async () => false),
}));

jest.mock('react-native-override-color-scheme', () => ({
  setScheme: jest.fn(),
  getScheme: jest.fn(() => null),
}));

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(async () => true),
  getGenericPassword: jest.fn(async () => false),
  resetGenericPassword: jest.fn(async () => true),
  ACCESSIBLE: {},
  ACCESS_CONTROL: {},
}));

jest.mock('react-native-check-version', () => ({
  checkVersion: jest.fn(async () => ({ needsUpdate: false })),
}));

// https://github.com/invertase/react-native-firebase/issues/1902
jest.mock('@react-native-firebase/app', () => ({
  delete: jest.fn(),
}));

// https://github.com/invertase/react-native-firebase/issues/1902
jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(async () => 'fake-fcm-token'),
  onMessage: jest.fn(() => jest.fn()),
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/tmp/documents',
  ExternalDirectoryPath: '/tmp/external',
  CachesDirectoryPath: '/tmp/caches',
  exists: jest.fn(async () => false),
  mkdir: jest.fn(async () => {}),
  unlink: jest.fn(async () => {}),
  readFile: jest.fn(async () => ''),
  writeFile: jest.fn(async () => {}),
  downloadFile: jest.fn(() => ({
    promise: Promise.resolve({ statusCode: 200 }),
  })),
}));

// mocking out from App.tsx, this allows us to run App.tsx without sentry interfering
jest.mock('@polito/lib/core', () => ({
  ...jest.requireActual('@polito/lib/core'),
  initSentry: jest.fn(),
  Sentry: {
    ...jest.requireActual('@polito/lib/core').Sentry,
    withTouchEventBoundary: (c: any) => c,
  },
}));

// Auth mock
// allows us to set easily set user
jest.mock('~/utils/keychain', () => require('./__mocks__/keychain'));

beforeEach(() => require('./__mocks__/keychain').__resetKeychain());
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
