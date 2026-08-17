import React from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING } from '@/constants/theme';
import { ScreenContainer } from '@/components/ScreenContainer';
import { InfoCard } from '@/components/InfoCard';
import { APP_CONFIG } from '@/config/app';

function TermsSection({ title, body }: { title: string; body: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ marginBottom: SPACING.md }}>
      <Text style={[TYPOGRAPHY.h3, { color: colors.text, marginBottom: SPACING.xs }]}>{title}</Text>
      <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>{body}</Text>
    </View>
  );
}

export default function TermsOfUseScreen() {
  const { colors } = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Terms of Use', headerShown: true, headerBackTitle: 'Profile' }} />
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
              This is a development draft. This document is not the final Terms of Use and does not constitute a legal agreement. The final Terms of Use will be published before the public release of InvisiProof.
            </Text>
          </InfoCard>

          <InfoCard>
            <TermsSection
              title="Acceptance of terms"
              body="This section will describe the conditions under which users may access and use the InvisiProof service, and what constitutes acceptance of these terms."
            />
            <TermsSection
              title="Use of the service"
              body="This section will outline the permitted and prohibited uses of the InvisiProof service, including restrictions on misuse, abuse, and unauthorized access."
            />
            <TermsSection
              title="Limitations of liability"
              body="This section will describe the limitations on InvisiProof's liability to users, including disclaimers regarding the accuracy of analysis results and the outcomes of user decisions."
            />
            <TermsSection
              title="Governing law"
              body="This section will specify the jurisdiction and governing law that applies to these terms and any disputes arising from the use of the InvisiProof service."
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
