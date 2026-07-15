import React from 'react';
import { ActivityIndicator, Text, ViewStyle, StyleProp } from 'react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({ title, onPress, disabled, loading, style }: ButtonProps) {
  const { colors } = useAppTheme();

  const handlePress = () => {
    console.log('[PrimaryButton] pressed:', title);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[
        {
          backgroundColor: colors.primary,
          height: 52,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text style={[TYPOGRAPHY.bodyMedium, { color: '#FFFFFF', fontWeight: '600' }]}>
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
}

export function SecondaryButton({ title, onPress, disabled, loading, style }: ButtonProps) {
  const { colors } = useAppTheme();

  const handlePress = () => {
    console.log('[SecondaryButton] pressed:', title);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[
        {
          backgroundColor: colors.primaryMuted,
          height: 52,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.primary, fontWeight: '600' }]}>
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
}
