import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { PrimaryButton } from '@/components/PrimaryButton';

interface EmptyStateCardProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

export function EmptyStateCard({ icon: Icon, title, subtitle, ctaLabel, onCtaPress }: EmptyStateCardProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.xl,
        paddingHorizontal: SPACING.md,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: RADIUS.xl,
          backgroundColor: colors.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: SPACING.md,
        }}
      >
        <Icon size={28} color={colors.primary} />
      </View>
      <Text
        style={[
          TYPOGRAPHY.h3,
          { color: colors.text, textAlign: 'center', marginBottom: SPACING.sm },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          TYPOGRAPHY.body,
          {
            color: colors.textSecondary,
            textAlign: 'center',
            maxWidth: 280,
            marginBottom: ctaLabel ? SPACING.lg : 0,
          },
        ]}
      >
        {subtitle}
      </Text>
      {ctaLabel && onCtaPress ? (
        <PrimaryButton
          title={ctaLabel}
          onPress={onCtaPress}
          style={{ paddingHorizontal: SPACING.xl, minWidth: 180 }}
        />
      ) : null}
    </View>
  );
}
