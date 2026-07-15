import React from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { ImageIcon } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING } from '@/constants/theme';
import { ScreenContainer } from '@/components/ScreenContainer';
import { EmptyStateCard } from '@/components/EmptyStateCard';
import { InfoCard } from '@/components/InfoCard';

export default function ScanScreenshotScreen() {
  const { colors } = useAppTheme();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Scan Screenshot or Photo',
          headerShown: true,
          headerBackTitle: 'Scan',
        }}
      />
      <ScreenContainer>
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.md, gap: SPACING.md }}>
          <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
            Submit a screenshot, photo, or image of suspicious content for analysis.
          </Text>

          <EmptyStateCard
            icon={ImageIcon}
            title="No image selected"
            subtitle="Image analysis will be available in the next phase. You will be able to submit screenshots, photos, and marketplace listings for review."
          />

          <InfoCard>
            <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
              Secure image analysis will be connected during the analysis phase. This screen establishes the navigation and design foundation.
            </Text>
          </InfoCard>
        </View>
      </ScreenContainer>
    </>
  );
}
