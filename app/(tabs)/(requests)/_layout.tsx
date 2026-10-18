import { Stack } from 'expo-router';

export default function RequestsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="create-request" options={{ title: 'Request Proof', headerBackTitle: 'Back' }} />
      <Stack.Screen name="receipt" options={{ title: 'Proof Receipt', headerBackTitle: 'Requests' }} />
      <Stack.Screen name="verdict" options={{ title: 'Proof Verdict', headerBackTitle: 'Requests' }} />
    </Stack>
  );
}
