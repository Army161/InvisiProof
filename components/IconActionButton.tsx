import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { TOUCH_TARGET } from '@/constants/theme';

interface IconActionButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

export function IconActionButton({ icon, onPress, accessibilityLabel, style }: IconActionButtonProps) {
  const handlePress = () => {
    console.log('[IconActionButton] pressed:', accessibilityLabel);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={[
        {
          minWidth: TOUCH_TARGET.min,
          minHeight: TOUCH_TARGET.min,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {icon}
    </AnimatedPressable>
  );
}
