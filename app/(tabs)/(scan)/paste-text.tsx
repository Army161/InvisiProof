import React from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING } from '@/constants/theme';
import { ScreenContainer } from '@/components/ScreenContainer';
import { EmptyStateCard } from '@/components/EmptyStateCard';
import { InfoCard } from '@/components/InfoCard';

export default function PasteTextScreen() {
  const { colors } = useAppTheme();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Paste Text or Link',
          headerShown: true,
          headerBackTitle: 'Scan',
        }}
      />
      <ScreenContainer>
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.md, gap: SPACING.md }}>
          <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
            Paste a message, email, URL, or written conversation for review.
          </Text>

          <EmptyStateCard
            icon={FileText}
            title="No text entered"
            subtitle="Text and link analysis will be available in the next phase. You will be able to submit messages, emails, URLs, and written conversations for review."
          />

          <InfoCard>
            <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
              Secure text analysis will be connected during the analysis phase. This screen establishes the navigation and design foundation.
            </Text>
          </InfoCard>
        </View>
      </ScreenContainer>
    </>
  );
}
