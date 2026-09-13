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
          <InfoCard>
            <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginBottom: SPACING.sm }]}>
              Effective Date: June 1, 2025
            </Text>

            <TermsSection
              title="Acceptance of Terms"
              body="By downloading, installing, or using InvisiProof, you agree to be bound by these Terms of Use. If you do not agree to these terms, do not use the app. These terms apply to all users of InvisiProof, including free and paid subscribers."
            />
            <TermsSection
              title="Description of Service"
              body="InvisiProof is a mobile application that helps users assess the authenticity and risk level of digital content including images, text, and URLs. Analysis results are provided for informational purposes only and do not constitute legal, financial, or professional advice. You are solely responsible for any decisions you make based on the results provided by InvisiProof."
            />
            <TermsSection
              title="Use of the Service"
              body="You agree to use InvisiProof only for lawful purposes and in accordance with these terms. You may not use the service to submit content that is illegal, harmful, or violates the rights of others. You may not attempt to reverse engineer, decompile, or otherwise extract the source code of the app. You may not use automated tools to access the service in a manner that exceeds normal usage. We reserve the right to suspend or terminate accounts that violate these terms."
            />
            <TermsSection
              title="Subscriptions and Billing"
              body="InvisiProof offers free and paid subscription tiers. Paid subscriptions are billed through the Apple App Store or Google Play Store on a monthly or annual basis as selected at the time of purchase. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current billing period. You may manage or cancel your subscription at any time through your device's app store account settings. Refunds are subject to the policies of the applicable app store."
            />
            <TermsSection
              title="Disclaimer of Warranties"
              body="InvisiProof is provided on an 'as is' and 'as available' basis without warranties of any kind, either express or implied. We do not warrant that the service will be uninterrupted, error-free, or that analysis results will be accurate, complete, or reliable. The risk assessment features are designed to assist your judgment, not replace it. We expressly disclaim all warranties including implied warranties of merchantability, fitness for a particular purpose, and non-infringement."
            />
            <TermsSection
              title="Limitation of Liability"
              body="To the fullest extent permitted by applicable law, NorthStar Revenue and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of InvisiProof, including but not limited to damages resulting from reliance on analysis results, loss of data, or unauthorized access to your account. Our total liability to you for any claim arising from these terms or your use of the service shall not exceed the amount you paid us in the twelve months preceding the claim."
            />
            <TermsSection
              title="Governing Law"
              body="These Terms of Use are governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any disputes arising from these terms or your use of InvisiProof shall be resolved exclusively in the courts located in the United States. If any provision of these terms is found to be unenforceable, the remaining provisions will continue in full force and effect."
            />
            <TermsSection
              title="Changes to These Terms"
              body="We reserve the right to modify these Terms of Use at any time. When we make material changes, we will update the effective date at the top of this page and notify you via email or an in-app notice where required by law. Your continued use of InvisiProof after changes are posted constitutes your acceptance of the revised terms."
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
