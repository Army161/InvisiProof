import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { AnimatedPressable } from '@/components/AnimatedPressable';

export default function VerifyEmailScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top + SPACING.xl,
        paddingBottom: insets.bottom + SPACING.xl,
        paddingHorizontal: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Mail size={48} color={colors.primary} />

      <Text
        style={[
          TYPOGRAPHY.h1,
          { color: colors.text, marginTop: SPACING.lg, marginBottom: SPACING.sm, textAlign: 'center' },
        ]}
      >
        Check your email
      </Text>

      <Text
        style={[
          TYPOGRAPHY.body,
          { color: colors.textSecondary, textAlign: 'center', marginBottom: SPACING.lg },
        ]}
      >
        We sent a confirmation link to your email address. Open it to activate your account, then sign in.
      </Text>

      <Text
        style={[
          TYPOGRAPHY.caption,
          {
            color: colors.textTertiary,
            textAlign: 'center',
            marginBottom: SPACING.xl,
          },
        ]}
      >
        Didn't receive it? Check your spam folder or try signing up again.
      </Text>

      <AnimatedPressable
        onPress={() => {
          console.log('[VerifyEmailScreen] go to sign in pressed');
          router.replace('/(auth)/sign-in');
        }}
        accessibilityRole="button"
        accessibilityLabel="Go to Sign In"
        style={{
          backgroundColor: colors.primary,
          height: 52,
          borderRadius: RADIUS.md,
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <Text style={[TYPOGRAPHY.bodyMedium, { color: '#FFFFFF', fontWeight: '600' }]}>
          Go to Sign In
        </Text>
      </AnimatedPressable>
    </View>
  );
}
