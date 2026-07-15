import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { AnimatedPressable } from '@/components/AnimatedPressable';

export default function ForgotPasswordScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sendPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async () => {
    console.log('[ForgotPasswordScreen] send reset pressed');
    if (!validate()) return;
    setLoading(true);
    try {
      await sendPasswordReset(email.trim().toLowerCase());
      console.log('[ForgotPasswordScreen] reset email sent (or silently skipped), navigating to reset-sent');
    } catch (err) {
      // Privacy-safe: always navigate to reset-sent regardless of error
      console.log('[ForgotPasswordScreen] sendPasswordReset error (navigating anyway)');
    } finally {
      setLoading(false);
      router.replace('/(auth)/reset-sent');
    }
  };

  const inputStyle = {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: emailError ? colors.danger : colors.border,
    height: 52,
    paddingHorizontal: SPACING.md,
    color: colors.text,
    fontSize: 15,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + SPACING.md,
          paddingBottom: insets.bottom + SPACING.xl,
          paddingHorizontal: SPACING.md,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => {
            console.log('[ForgotPasswordScreen] back pressed');
            router.back();
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: 44,
            marginBottom: SPACING.md,
            alignSelf: 'flex-start',
          }}
        >
          <ChevronLeft size={20} color={colors.primary} />
          <Text style={[TYPOGRAPHY.body, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={[TYPOGRAPHY.h1, { color: colors.text, marginBottom: SPACING.xs }]}>
          Reset Password
        </Text>
        <Text
          style={[
            TYPOGRAPHY.body,
            { color: colors.textSecondary, marginBottom: SPACING.xl },
          ]}
        >
          Enter your email address and we'll send you instructions to reset your password.
        </Text>

        {/* Email */}
        <View style={{ marginBottom: SPACING.xl }}>
          <Text
            style={[
              TYPOGRAPHY.label,
              { color: colors.textSecondary, marginBottom: SPACING.xs },
            ]}
          >
            Email
          </Text>
          <TextInput
            style={inputStyle}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            accessibilityLabel="Email address"
          />
          {emailError ? (
            <Text
              style={[TYPOGRAPHY.caption, { color: colors.danger, marginTop: 4 }]}
              accessibilityLiveRegion="polite"
            >
              {emailError}
            </Text>
          ) : null}
        </View>

        {/* Submit */}
        <AnimatedPressable
          onPress={handleSubmit}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Send Reset Instructions"
          style={{
            backgroundColor: colors.primary,
            height: 52,
            borderRadius: RADIUS.md,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={[TYPOGRAPHY.bodyMedium, { color: '#FFFFFF', fontWeight: '600' }]}>
              Send Reset Instructions
            </Text>
          )}
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
