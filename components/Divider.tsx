import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

interface DividerProps {
  style?: StyleProp<ViewStyle>;
  inset?: number;
}

export function Divider({ style, inset }: DividerProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: colors.divider,
          marginLeft: inset ?? 0,
        },
        style,
      ]}
    />
  );
}
