import { Stack } from 'expo-router';

export default function ScanLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="scan-screenshot"
        options={{
          headerShown: true,
          title: 'Scan Screenshot or Photo',
          headerBackTitle: 'Scan',
        }}
      />
      <Stack.Screen
        name="paste-text"
        options={{
          headerShown: true,
          title: 'Paste Text or Link',
          headerBackTitle: 'Scan',
        }}
      />
      <Stack.Screen
        name="enter-proof-code"
        options={{
          headerShown: true,
          title: 'Enter Proof Code',
          headerBackTitle: 'Scan',
        }}
      />
      <Stack.Screen
        name="submission-ready"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
