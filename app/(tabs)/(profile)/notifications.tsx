import React from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING } from '@/constants/theme';
import { ScreenContainer } from '@/components/ScreenContainer';
import { InfoCard } from '@/components/InfoCard';

export default function NotificationsScreen() {
  const { colors } = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Notifications', headerShown: true, headerBackTitle: 'Profile' }} />
      <ScreenContainer>
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.md }}>
          <InfoCard>
            <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
              Notification preferences will be available after the notification system is connected. No notification permissions have been requested.
            </Text>
          </InfoCard>
        </View>
      </ScreenContainer>
    </>
  );
}
