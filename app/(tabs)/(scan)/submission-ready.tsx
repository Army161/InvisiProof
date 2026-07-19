import React from 'react';
import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { InfoCard } from '@/components/InfoCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import type { InputType, SourceType } from '@/types/scan';

function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

function mapInputType(inputType: string): string {
  const map: Record<InputType, string> = {
    image: 'Image',
    text: 'Text',
    url: 'URL',
  };
  return map[inputType as InputType] ?? inputType;
}

function mapSourceType(sourceType: string): string {
  const map: Record<SourceType, string> = {
    camera: 'Camera',
    library: 'Library',
    paste: 'Pasted',
  };
  return map[sourceType as SourceType] ?? sourceType;
}

export default function SubmissionReadyScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    inputType: string;
    sourceType: string;
    createdAt: string;
  }>();

  const inputTypeLabel = mapInputType(params.inputType ?? '');
  const sourceTypeLabel = mapSourceType(params.sourceType ?? '');
  const dateLabel = formatDateTime(params.createdAt ?? '');

  const handleDone = () => {
    console.log('[SubmissionReady] Done pressed, navigating back to scan root');
    router.replace('/(tabs)/(scan)');
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + SPACING.lg,
        paddingHorizontal: SPACING.md,
        justifyContent: 'center',
      }}
    >
      {/* Icon */}
      <View style={{ alignItems: 'center', marginBottom: SPACING.lg }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldCheck size={48} color={colors.primary} />
        </View>
      </View>

      {/* Heading */}
      <Text
        style={[
          TYPOGRAPHY.h1,
          { color: colors.text, textAlign: 'center', marginBottom: SPACING.sm },
        ]}
      >
        Submission Ready
      </Text>

      {/* Explanation */}
      <Text
        style={[
          TYPOGRAPHY.body,
          {
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: SPACING.xl,
            paddingHorizontal: SPACING.md,
          },
        ]}
      >
        Your content was privately saved and will be analyzed in the next phase. No results are available yet.
      </Text>

      {/* Summary card */}
      <InfoCard style={{ marginBottom: SPACING.xl }}>
        <View style={{ gap: SPACING.sm }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
              Type
            </Text>
            <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.text }]}>
              {inputTypeLabel}
            </Text>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: colors.divider,
            }}
          />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
              Source
            </Text>
            <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.text }]}>
              {sourceTypeLabel}
            </Text>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: colors.divider,
            }}
          />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
              Submitted
            </Text>
            <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.text }]}>
              {dateLabel}
            </Text>
          </View>
        </View>
      </InfoCard>

      {/* Done button */}
      <PrimaryButton title="Done" onPress={handleDone} />
    </View>
  );
}
