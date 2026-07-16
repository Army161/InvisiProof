import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Edit Profile', headerBackTitle: 'Profile' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications', headerBackTitle: 'Profile' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy', headerBackTitle: 'Profile' }} />
      <Stack.Screen name="safety-disclaimer" options={{ title: 'Safety Disclaimer', headerBackTitle: 'Profile' }} />
      <Stack.Screen name="help-support" options={{ title: 'Help & Support', headerBackTitle: 'Profile' }} />
      <Stack.Screen name="privacy-policy" options={{ title: 'Privacy Policy', headerBackTitle: 'Profile' }} />
      <Stack.Screen name="terms-of-use" options={{ title: 'Terms of Use', headerBackTitle: 'Profile' }} />
    </Stack>
  );
}
