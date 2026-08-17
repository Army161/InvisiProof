import React, { useEffect, useRef, useState } from 'react';
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
import { useURL } from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { supabase } from '@/lib/supabase';

function mapResetPasswordError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('password should be at least') || msg.includes('password must be')) {
    return 'Password must be at least 8 characters.';
  }
  if (msg.includes('same password') || msg.includes('different from')) {
    return 'New password must be different from your current password.';
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) {
    return 'Check your connection and try again.';
  }
  return 'Could not update your password. Please try again.';
}

interface FieldError {
  password?: string;
  confirmPassword?: string;
}

export default function ResetPasswordScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updatePassword } = useAuth();
  const url = useURL();
  const processedRef = useRef(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const confirmPasswordRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!url || processedRef.current) return;
    // Parse hash fragment: invisiproof://reset-password#access_token=X&refresh_token=Y&type=recovery
    const hash = url.includes('#') ? url.split('#')[1] : '';
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');
    if (accessToken && refreshToken && type === 'recovery') {
      console.log('[ResetPasswordScreen] processing recovery token from deep link');
      processedRef.current = true;
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .catch(() => {
          console.log('[ResetPasswordScreen] session exchange failed — link expired');
          setGlobalError('This password reset link has expired. Please request a new one.');
        });
    }
  }, [url]);

  const validate = (): boolean => {
    const newErrors: FieldError = {};
    if (!password || password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }
    if (!confirmPassword || confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('[ResetPasswordScreen] submit pressed');
    setGlobalError('');
    if (!validate()) {
      console.log('[ResetPasswordScreen] validation failed');
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      console.log('[ResetPasswordScreen] password updated successfully');
      setSuccess(true);
      setTimeout(() => {
        router.replace('/(auth)/sign-in');
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.log('[ResetPasswordScreen] update password error:', message);
      setGlobalError(mapResetPasswordError(message));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: 52,
    paddingHorizontal: SPACING.md,
    color: colors.text,
    fontSize: 15,
  };

  const labelStyle = [TYPOGRAPHY.label, { color: colors.textSecondary, marginBottom: SPACING.xs }];
  const errorStyle = [TYPOGRAPHY.caption, { color: colors.danger, marginTop: 4 }];

  if (success) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: SPACING.xl,
        }}
      >
        <CheckCircle size={56} color={colors.primary} />
        <Text
          style={[
            TYPOGRAPHY.h2,
            { color: colors.text, marginTop: SPACING.lg, marginBottom: SPACING.sm, textAlign: 'center' },
          ]}
        >
          Password Updated
        </Text>
        <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, textAlign: 'center' }]}>
          Password updated. You can now sign in.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + SPACING.xl,
          paddingBottom: insets.bottom + SPACING.xl,
          paddingHorizontal: SPACING.md,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={[TYPOGRAPHY.h1, { color: colors.text, marginBottom: SPACING.xs }]}>
          Set New Password
        </Text>
        <Text
          style={[
            TYPOGRAPHY.body,
            { color: colors.textSecondary, marginBottom: SPACING.xl },
          ]}
        >
          Enter and confirm your new password below.
        </Text>

        {/* Global error */}
        {globalError ? (
          <View
            style={{
              backgroundColor: colors.dangerMuted,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              marginBottom: SPACING.md,
            }}
            accessibilityLiveRegion="polite"
          >
            <Text style={[TYPOGRAPHY.body, { color: colors.danger }]}>{globalError}</Text>
          </View>
        ) : null}

        {/* New Password */}
        <View style={{ marginBottom: SPACING.md }}>
          <Text style={labelStyle}>New Password</Text>
          <View style={{ position: 'relative' }}>
            <TextInput
              style={[
                inputStyle,
                { paddingRight: 52 },
                errors.password ? { borderColor: colors.danger } : {},
              ]}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry={!showPassword}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              accessibilityLabel="New password"
            />
            <TouchableOpacity
              onPress={() => {
                console.log('[ResetPasswordScreen] toggle password visibility');
                setShowPassword(v => !v);
              }}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 52,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {showPassword ? (
                <EyeOff size={20} color={colors.textTertiary} />
              ) : (
                <Eye size={20} color={colors.textTertiary} />
              )}
            </TouchableOpacity>
          </View>
          {errors.password ? (
            <Text style={errorStyle} accessibilityLiveRegion="polite">
              {errors.password}
            </Text>
          ) : null}
        </View>

        {/* Confirm New Password */}
        <View style={{ marginBottom: SPACING.xl }}>
          <Text style={labelStyle}>Confirm New Password</Text>
          <View style={{ position: 'relative' }}>
            <TextInput
              ref={confirmPasswordRef}
              style={[
                inputStyle,
                { paddingRight: 52 },
                errors.confirmPassword ? { borderColor: colors.danger } : {},
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your new password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry={!showConfirmPassword}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              accessibilityLabel="Confirm new password"
            />
            <TouchableOpacity
              onPress={() => {
                console.log('[ResetPasswordScreen] toggle confirm password visibility');
                setShowConfirmPassword(v => !v);
              }}
              accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 52,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color={colors.textTertiary} />
              ) : (
                <Eye size={20} color={colors.textTertiary} />
              )}
            </TouchableOpacity>
          </View>
          {errors.confirmPassword ? (
            <Text style={errorStyle} accessibilityLiveRegion="polite">
              {errors.confirmPassword}
            </Text>
          ) : null}
        </View>

        {/* Submit */}
        <AnimatedPressable
          onPress={handleSubmit}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Update Password"
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
              Update Password
            </Text>
          )}
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
