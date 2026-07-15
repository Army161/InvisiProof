import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { SHADOWS, RADIUS, SPACING } from '@/constants/theme';

interface InfoCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function InfoCard({ children, style }: InfoCardProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: RADIUS.lg,
          padding: SPACING.md,
          borderWidth: 1,
          borderColor: colors.border,
          boxShadow: SHADOWS.md,
        } as ViewStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}
