import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';

interface ConsentCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function ConsentCheckbox({ checked, onToggle, disabled = false }: ConsentCheckboxProps) {
  const { colors } = useAppTheme();

  const handlePress = () => {
    console.log('[ConsentCheckbox] toggled, checked:', !checked);
    onToggle();
  };

  return (
    <Pressable
      onPress={disabled ? undefined : handlePress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel="I reviewed this content and understand it will be privately stored for analysis."
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACING.sm,
        opacity: disabled ? 0.5 : 1,
        paddingVertical: SPACING.xs,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: RADIUS.sm,
          borderWidth: 2,
          borderColor: checked ? colors.primary : colors.border,
          backgroundColor: checked ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
          flexShrink: 0,
        }}
      >
        {checked && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
      </View>
      <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, flex: 1 }]}>
        I reviewed this content and understand it will be privately stored for analysis.
      </Text>
    </Pressable>
  );
}
