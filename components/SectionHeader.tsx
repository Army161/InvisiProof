import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING } from '@/constants/theme';
import { AnimatedPressable } from '@/components/AnimatedPressable';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? (
        <AnimatedPressable
          onPress={() => {
            console.log('[SectionHeader] action pressed:', action.label);
            action.onPress();
          }}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={{ paddingLeft: SPACING.sm, paddingVertical: 2 }}
        >
          <Text style={[TYPOGRAPHY.caption, { color: colors.primary, fontWeight: '600' }]}>
            {action.label}
          </Text>
        </AnimatedPressable>
      ) : null}
    </View>
  );
}
