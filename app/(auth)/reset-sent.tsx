import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { AnimatedPressable } from '@/components/AnimatedPressable';

export default function ResetSentScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: insets.top + SPACING.xxl,
        paddingBottom: insets.bottom + SPACING.xl,
        paddingHorizontal: SPACING.lg,
        justifyContent: 'space-between',
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Content */}
      <View style={{ alignItems: 'center', gap: SPACING.lg }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Mail size={40} color={colors.primary} />
        </View>

        <View style={{ alignItems: 'center', gap: SPACING.sm }}>
          <Text style={[TYPOGRAPHY.h1, { color: colors.text, textAlign: 'center' }]}>
            Check your email
          </Text>
          <Text
            style={[
              TYPOGRAPHY.body,
              {
                color: colors.textSecondary,
                textAlign: 'center',
                maxWidth: 320,
                lineHeight: 24,
              },
            ]}
          >
            If an account exists for that email address, password reset instructions have been sent. Check your inbox and follow the link to reset your password.
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={{ gap: SPACING.md, marginTop: SPACING.xxl }}>
        <AnimatedPressable
          onPress={() => {
            console.log('[ResetSentScreen] back to sign in pressed');
            router.replace('/(auth)/sign-in');
          }}
          accessibilityRole="button"
          accessibilityLabel="Back to Sign In"
          style={{
            backgroundColor: colors.primary,
            height: 52,
            borderRadius: RADIUS.md,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={[TYPOGRAPHY.bodyMedium, { color: '#FFFFFF', fontWeight: '600' }]}>
            Back to Sign In
          </Text>
        </AnimatedPressable>

        <TouchableOpacity
          onPress={() => {
            console.log('[ResetSentScreen] try again pressed');
            router.replace('/(auth)/forgot-password');
          }}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          style={{
            alignItems: 'center',
            paddingVertical: SPACING.sm,
            minHeight: 44,
            justifyContent: 'center',
          }}
        >
          <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, textAlign: 'center' }]}>
            {"Didn't receive it? Check your spam folder or "}
            <Text style={{ color: colors.primary }}>try again.</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
