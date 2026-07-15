import React from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { KeyRound } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING } from '@/constants/theme';
import { ScreenContainer } from '@/components/ScreenContainer';
import { EmptyStateCard } from '@/components/EmptyStateCard';
import { InfoCard } from '@/components/InfoCard';

export default function EnterProofCodeScreen() {
  const { colors } = useAppTheme();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Enter Proof Code',
          headerShown: true,
          headerBackTitle: 'Scan',
        }}
      />
      <ScreenContainer>
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.md, gap: SPACING.md }}>
          <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
            Enter a proof code to respond to a verification request from another ProofLoop user.
          </Text>

          <EmptyStateCard
            icon={KeyRound}
            title="No proof code entered"
            subtitle="Proof code verification will be available in the next phase. You will be able to respond to verification requests from other ProofLoop users."
          />

          <InfoCard>
            <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
              Proof code processing will be connected during the verification phase. This screen establishes the navigation and design foundation.
            </Text>
          </InfoCard>
        </View>
      </ScreenContainer>
    </>
  );
}
