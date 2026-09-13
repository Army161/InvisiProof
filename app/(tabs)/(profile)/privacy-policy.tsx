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
          <InfoCard>
            <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginBottom: SPACING.sm }]}>
              Effective Date: June 1, 2025
            </Text>

            <PolicySection
              title="Information We Collect"
              body="InvisiProof collects information you provide directly, including your email address when you create an account. When you use the scan feature, we process images, text, or URLs you submit solely to perform the requested analysis. We do not store the raw content of your scans beyond the period needed to complete analysis. We also collect usage data such as feature interactions, error logs, and subscription status to operate and improve the service."
            />
            <PolicySection
              title="How We Use Your Information"
              body="We use your information to provide, maintain, and improve InvisiProof; to process your subscription and manage your account; to send you service-related communications such as receipts and security alerts; and to comply with applicable legal obligations. We do not sell your personal information to third parties. We do not use your submitted scan content to train AI models."
            />
            <PolicySection
              title="Data Storage and Security"
              body="Your account data is stored securely using Supabase, a SOC 2 compliant infrastructure provider. Scan uploads are stored in private, access-controlled storage buckets and are not publicly accessible. We use industry-standard encryption in transit (TLS) and at rest. Scan history is retained according to your subscription tier and deleted automatically when your retention period expires or your account is deleted."
            />
            <PolicySection
              title="Third-Party Services"
              body="InvisiProof uses the following third-party services to operate: Supabase (database and authentication), RevenueCat (subscription management), and PostHog (anonymous usage analytics). Each provider processes data only as necessary to deliver their service and is bound by their own privacy policies. We do not share personally identifiable information with advertisers."
            />
            <PolicySection
              title="Your Rights"
              body="You have the right to access, correct, or delete your personal data at any time. You may delete your account and all associated data directly from the app via Settings > Delete Account. You may also request a copy of your data or ask questions about how it is used by contacting us at the email address below. If you are located in the European Economic Area, you have additional rights under the GDPR including the right to data portability and the right to lodge a complaint with a supervisory authority."
            />
            <PolicySection
              title="Children's Privacy"
              body="InvisiProof is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will delete it promptly."
            />
            <PolicySection
              title="Changes to This Policy"
              body="We may update this Privacy Policy from time to time. When we do, we will revise the effective date at the top of this page and, where required by law, notify you via email or an in-app notice. Your continued use of InvisiProof after any changes constitutes your acceptance of the updated policy."
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
