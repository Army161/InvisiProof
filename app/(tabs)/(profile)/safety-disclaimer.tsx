import React from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING } from '@/constants/theme';
import { ScreenContainer } from '@/components/ScreenContainer';
import { InfoCard } from '@/components/InfoCard';
import { LegalDisclaimerCard } from '@/components/LegalDisclaimerCard';

export default function SafetyDisclaimerScreen() {
  const { colors } = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Safety Disclaimer', headerShown: true, headerBackTitle: 'Profile' }} />
      <ScreenContainer>
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.md, gap: SPACING.md }}>
          <InfoCard>
            <Text style={[TYPOGRAPHY.h3, { color: colors.text, marginBottom: SPACING.md }]}>
              About InvisiProof's analysis
            </Text>
            <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, marginBottom: SPACING.md }]}>
              InvisiProof evaluates observable signals and available evidence in the content you submit. It identifies patterns commonly associated with fraud, scams, impersonation, and deceptive practices.
            </Text>
            <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, marginBottom: SPACING.md }]}>
              InvisiProof does not guarantee the identity of any person or organization. It does not guarantee the safety of any transaction, meeting, or interaction. It does not guarantee payment, delivery, legality, or the recovery of funds.
            </Text>
            <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
              InvisiProof is a decision-support tool. You are responsible for your own decisions. Always exercise independent judgment before trusting, meeting, or paying anyone.
            </Text>
          </InfoCard>

          <LegalDisclaimerCard />
        </View>
      </ScreenContainer>
    </>
  );
}
