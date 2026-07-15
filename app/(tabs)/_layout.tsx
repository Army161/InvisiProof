import React from 'react';
import { View } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import FloatingTabBar from '@/components/FloatingTabBar';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { TabBarItem } from '@/components/FloatingTabBar';

const TABS: TabBarItem[] = [
  {
    name: '(scan)',
    route: '/(tabs)/(scan)',
    icon: 'document-scanner',
    label: 'Scan',
  },
  {
    name: '(requests)',
    route: '/(tabs)/(requests)',
    icon: 'shield',
    label: 'Requests',
  },
  {
    name: '(history)',
    route: '/(tabs)/(history)',
    icon: 'history',
    label: 'History',
  },
  {
    name: '(profile)',
    route: '/(tabs)/(profile)',
    icon: 'person',
    label: 'Profile',
  },
];

export default function TabLayout() {
  const { colors } = useAppTheme();
  const pathname = usePathname();

  // Hide tab bar on sub-screens (anything deeper than the tab root)
  const tabRoots = ['/(tabs)/(scan)', '/(tabs)/(requests)', '/(tabs)/(history)', '/(tabs)/(profile)'];
  const isTabRoot = tabRoots.some(root => pathname === root || pathname === root + '/index');
  const showTabBar = !pathname.includes('/scan-screenshot') &&
    !pathname.includes('/paste-text') &&
    !pathname.includes('/enter-proof-code') &&
    !pathname.includes('/notifications') &&
    !pathname.includes('/privacy') &&
    !pathname.includes('/safety-disclaimer') &&
    !pathname.includes('/help-support') &&
    !pathname.includes('/privacy-policy') &&
    !pathname.includes('/terms-of-use');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="(scan)" />
        <Stack.Screen name="(requests)" />
        <Stack.Screen name="(history)" />
        <Stack.Screen name="(profile)" />
      </Stack>
      {showTabBar && (
        <FloatingTabBar
          tabs={TABS}
          containerWidth={320}
          borderRadius={35}
          bottomMargin={20}
        />
      )}
    </View>
  );
}
