import React from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING } from '@/constants/theme';
import { ScreenContainer } from '@/components/ScreenContainer';
import { InfoCard } from '@/components/InfoCard';
import { APP_CONFIG } from '@/config/app';

function PolicySection({ title, body }: { title: string; body: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ marginBottom: SPACING.md }}>
      <Text style={[TYPOGRAPHY.h3, { color: colors.text, marginBottom: SPACING.xs }]}>{title}</Text>
      <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>{body}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const { colors } = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Privacy Policy', headerShown: true, headerBackTitle: 'Profile' }} />
      <ScreenContainer>
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.md, gap: SPACING.md }}>
          {/* Draft warning banner */}
          <InfoCard
            style={{
              borderColor: colors.warning,
              borderWidth: 1.5,
              backgroundColor: colors.warningMuted,
            }}
          >
            <Text style={[TYPOGRAPHY.body, { color: colors.warning }]}>
              This is a development draft. This document is not the final Privacy Policy and does not constitute a legal agreement. The final Privacy Policy will be published before the public release of ProofLoop.
            </Text>
          </InfoCard>

          <InfoCard>
            <PolicySection
              title="Information we collect"
              body="This section will describe the types of information ProofLoop collects from users, including information provided directly, information collected automatically, and information from third parties."
            />
            <PolicySection
              title="How we use information"
              body="This section will explain how ProofLoop uses the information it collects, including to provide and improve the service, communicate with users, and comply with legal obligations."
            />
            <PolicySection
              title="Data storage and security"
              body="This section will describe how ProofLoop stores and protects user data, including the security measures in place and the retention periods for different types of data."
            />
            <PolicySection
              title="Your rights"
              body="This section will outline the rights users have regarding their personal data, including the right to access, correct, delete, and export their data."
            />
            <View>
              <Text style={[TYPOGRAPHY.h3, { color: colors.text, marginBottom: SPACING.xs }]}>
                Contact
              </Text>
              <Text selectable style={[TYPOGRAPHY.body, { color: colors.primary }]}>
                {APP_CONFIG.supportEmail}
              </Text>
            </View>
          </InfoCard>
        </View>
      </ScreenContainer>
    </>
  );
}
