import { Stack } from 'expo-router';

export default function ScanLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="scan-screenshot"
        options={{
          headerShown: true,
          title: 'Scan a Listing',
          headerBackTitle: 'Scan',
        }}
      />
      <Stack.Screen
        name="paste-text"
        options={{
          headerShown: true,
          title: 'Paste a Link or Message',
          headerBackTitle: 'Scan',
        }}
      />
      <Stack.Screen
        name="enter-proof-code"
        options={{
          headerShown: true,
          title: 'Answer a Buyer',
          headerBackTitle: 'Scan',
        }}
      />
      <Stack.Screen
        name="challenge"
        options={{
          headerShown: true,
          title: 'Live Challenge',
          gestureEnabled: false,
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
