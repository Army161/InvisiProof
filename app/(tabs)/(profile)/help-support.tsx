import React from 'react';
import { View, Text, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING } from '@/constants/theme';
import { ScreenContainer } from '@/components/ScreenContainer';
import { InfoCard } from '@/components/InfoCard';
import { SecondaryButton } from '@/components/PrimaryButton';
import { APP_CONFIG } from '@/config/app';

export default function HelpSupportScreen() {
  const { colors } = useAppTheme();

  const handleSendEmail = () => {
    console.log('[HelpSupportScreen] send email pressed');
    Linking.openURL(`mailto:${APP_CONFIG.supportEmail}`);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Help & Support', headerShown: true, headerBackTitle: 'Profile' }} />
      <ScreenContainer>
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.md }}>
          <InfoCard>
            <Text style={[TYPOGRAPHY.h3, { color: colors.text, marginBottom: SPACING.sm }]}>
              Contact support
            </Text>
            <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, marginBottom: SPACING.md }]}>
              For questions, feedback, or assistance, contact the InvisiProof support team.
            </Text>
            <Text
              selectable
              style={[TYPOGRAPHY.bodyMedium, { color: colors.primary, marginBottom: SPACING.lg }]}
            >
              {APP_CONFIG.supportEmail}
            </Text>
            <SecondaryButton title="Send email" onPress={handleSendEmail} />
          </InfoCard>
        </View>
      </ScreenContainer>
    </>
  );
}
