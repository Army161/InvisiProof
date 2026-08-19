import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SystemBars } from 'react-native-edge-to-edge';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  ThemeProvider as NavThemeProvider,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { ThemeProvider, useAppTheme } from '@/contexts/ThemeContext';
import { WidgetProvider } from '@/contexts/WidgetContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { PaywallProvider } from '@/contexts/PaywallContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initAnalytics } from '@/services/analytics';
import Constants from 'expo-constants';

const DevErrorBoundary = __DEV__
  ? ErrorBoundary
  : ({ children }: { children: React.ReactNode }) => <>{children}</>;

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: 'index',
};

function RootLayoutInner() {
  const { isDark } = useAppTheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    initAnalytics();
    // Android-only RC init (react-native-purchases does not support web)
    if (Platform.OS === 'android') {
      const key = (Constants.expoConfig?.extra?.RC_ANDROID_KEY ?? '') as string;
      if (key) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { default: Purchases, LOG_LEVEL } = require('react-native-purchases') as typeof import('react-native-purchases');
          Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.ERROR);
          Purchases.configure({ apiKey: key });
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <NavThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(marketing)" options={{ headerShown: false }} />
      </Stack>
      <SystemBars style="auto" />
      <StatusBar style="auto" animated />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <DevErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <WidgetProvider>
              <PaywallProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <RootLayoutInner />
                </GestureHandlerRootView>
              </PaywallProvider>
            </WidgetProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </DevErrorBoundary>
  );
}
