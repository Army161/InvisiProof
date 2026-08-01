import React from 'react';
import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="(scan)" />
      <Stack.Screen name="(requests)" />
      <Stack.Screen name="(history)" />
      <Stack.Screen name="(profile)" />
    </Stack>
  );
}
