import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="notifications"
        options={{ headerShown: true, title: 'Notifications', headerBackTitle: 'Profile' }}
      />
      <Stack.Screen
        name="privacy"
        options={{ headerShown: true, title: 'Privacy', headerBackTitle: 'Profile' }}
      />
      <Stack.Screen
        name="safety-disclaimer"
        options={{ headerShown: true, title: 'Safety Disclaimer', headerBackTitle: 'Profile' }}
      />
      <Stack.Screen
        name="help-support"
        options={{ headerShown: true, title: 'Help & Support', headerBackTitle: 'Profile' }}
      />
      <Stack.Screen
        name="privacy-policy"
        options={{ headerShown: true, title: 'Privacy Policy', headerBackTitle: 'Profile' }}
      />
      <Stack.Screen
        name="terms-of-use"
        options={{ headerShown: true, title: 'Terms of Use', headerBackTitle: 'Profile' }}
      />
    </Stack>
  );
}
