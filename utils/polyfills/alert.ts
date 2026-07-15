import { Alert } from 'react-native';
import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';

// Add global alert() on iOS/Android — it doesn't exist by default in React Native.
// On web, alert.web.ts is used instead (Metro picks .web.ts automatically).
polyfillGlobal('alert', () => (message?: unknown) => {
  Alert.alert('', String(message ?? ''));
});

declare global {
  function alert(message?: unknown): void;
}

export {};
