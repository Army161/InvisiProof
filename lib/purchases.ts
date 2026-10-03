import { Platform } from 'react-native';
import Constants from 'expo-constants';

// RevenueCat is Android-only for now (react-native-purchases does not support web).
// The Supabase revenuecat-webhook treats RevenueCat's app_user_id as the Supabase
// user id, so the signed-in user must be passed to RevenueCat with logIn().

let configured = false;

function getPurchases(): any | null {
  if (Platform.OS !== 'android') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-native-purchases').default;
  } catch {
    return null;
  }
}

export function configurePurchases(): boolean {
  if (configured) return true;
  const Purchases = getPurchases();
  const key = (Constants.expoConfig?.extra?.RC_ANDROID_KEY ?? '') as string;
  if (!Purchases || !key) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { LOG_LEVEL } = require('react-native-purchases');
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey: key });
    configured = true;
  } catch (e) {
    console.log('[purchases] configure failed:', e);
  }
  return configured;
}

export async function syncPurchasesUser(userId: string | null): Promise<void> {
  if (!configurePurchases()) return;
  const Purchases = getPurchases();
  try {
    if (userId) {
      console.log('[purchases] logIn', userId);
      await Purchases.logIn(userId);
    } else if (!(await Purchases.isAnonymous())) {
      console.log('[purchases] logOut');
      await Purchases.logOut();
    }
  } catch (e) {
    console.log('[purchases] user sync failed:', e);
  }
}
