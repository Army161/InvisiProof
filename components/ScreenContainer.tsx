import React from 'react';
import { ScrollView, ViewStyle, StyleProp } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function ScreenContainer({ children, style, contentContainerStyle }: ScreenContainerProps) {
  const { colors } = useAppTheme();

  return (
    <ScrollView
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
      contentContainerStyle={[{ paddingBottom: 100 }, contentContainerStyle]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}
