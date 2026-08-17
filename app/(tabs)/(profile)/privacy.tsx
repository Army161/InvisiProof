import React from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING } from '@/constants/theme';
import { ScreenContainer } from '@/components/ScreenContainer';
import { InfoCard } from '@/components/InfoCard';

export default function PrivacyScreen() {
  const { colors } = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Privacy', headerShown: true, headerBackTitle: 'Profile' }} />
      <ScreenContainer>
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.md }}>
          <InfoCard>
            <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
              Privacy controls will be available in a future phase. InvisiProof does not currently collect or store personal data.
            </Text>
          </InfoCard>
        </View>
      </ScreenContainer>
    </>
  );
}
