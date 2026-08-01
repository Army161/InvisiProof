import { Stack } from 'expo-router';

export default function RequestsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="create-request" options={{ title: 'New Proof Request', headerBackTitle: 'Requests' }} />
    </Stack>
  );
}
