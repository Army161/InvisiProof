import React, { useRef, useState } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff, ChevronLeft, AlertTriangle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { AnimatedPressable } from '@/components/AnimatedPressable';

function mapSignInError(message: string): string {
  const msg = message.toLowerCase();
  if (
    msg.includes('invalid login credentials') ||
    msg.includes('invalid_credentials') ||
    msg.includes('invalid credentials')
  ) {
    return 'The email or password is incorrect.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please verify your email address before signing in.';
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) {
    return 'Check your connection and try again.';
  }
  return 'Sign in failed. Please try again.';
}

interface FieldError {
  email?: string;
  password?: string;
}

export default function SignInScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signInWithEmail } = useAuth();
  const params = useLocalSearchParams<{ expired?: string }>();

  const isExpired = params.expired === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const validate = (): boolean => {
    const newErrors: FieldError = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      newErrors.password = 'Please enter your password.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('[SignInScreen] sign in pressed');
    setGlobalError('');
    if (!validate()) {
      console.log('[SignInScreen] validation failed');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email.trim().toLowerCase(), password);
      console.log('[SignInScreen] sign in success, navigating to scan');
      router.replace('/(tabs)/(scan)');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.log('[SignInScreen] sign in error:', message);
      setGlobalError(mapSignInError(message));
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
            console.log('[SignInScreen] back pressed');
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
          Sign In
        </Text>
        <Text
          style={[
            TYPOGRAPHY.body,
            { color: colors.textSecondary, marginBottom: SPACING.xl },
          ]}
        >
          Welcome back to ProofLoop.
        </Text>

        {/* Session expired banner */}
        {isExpired ? (
          <View
            style={{
              backgroundColor: colors.warningMuted,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              marginBottom: SPACING.md,
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING.sm,
            }}
            accessibilityLiveRegion="polite"
          >
            <AlertTriangle size={18} color={colors.warning} />
            <Text style={[TYPOGRAPHY.body, { color: colors.warning, flex: 1 }]}>
              Your session expired. Please sign in again.
            </Text>
          </View>
        ) : null}

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

        {/* Email */}
        <View style={{ marginBottom: SPACING.md }}>
          <Text style={labelStyle}>Email</Text>
          <TextInput
            style={[inputStyle, errors.email ? { borderColor: colors.danger } : {}]}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            accessibilityLabel="Email address"
          />
          {errors.email ? (
            <Text style={errorStyle} accessibilityLiveRegion="polite">
              {errors.email}
            </Text>
          ) : null}
        </View>

        {/* Password */}
        <View style={{ marginBottom: SPACING.sm }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: SPACING.xs,
            }}
          >
            <Text style={labelStyle}>Password</Text>
            <TouchableOpacity
              onPress={() => {
                console.log('[SignInScreen] forgot password pressed');
                router.push('/(auth)/forgot-password');
              }}
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={[TYPOGRAPHY.caption, { color: colors.primary }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ position: 'relative' }}>
            <TextInput
              ref={passwordRef}
              style={[
                inputStyle,
                { paddingRight: 52 },
                errors.password ? { borderColor: colors.danger } : {},
              ]}
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              accessibilityLabel="Password"
            />
            <TouchableOpacity
              onPress={() => {
                console.log('[SignInScreen] toggle password visibility');
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

        <View style={{ height: SPACING.xl }} />

        {/* Submit */}
        <AnimatedPressable
          onPress={handleSubmit}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Sign In"
          style={{
            backgroundColor: colors.primary,
            height: 52,
            borderRadius: RADIUS.md,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: SPACING.lg,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={[TYPOGRAPHY.bodyMedium, { color: '#FFFFFF', fontWeight: '600' }]}>
              Sign In
            </Text>
          )}
        </AnimatedPressable>

        {/* Create account link */}
        <TouchableOpacity
          onPress={() => {
            console.log('[SignInScreen] create account link pressed');
            router.replace('/(auth)/sign-up');
          }}
          accessibilityRole="button"
          accessibilityLabel="New to ProofLoop? Create an account"
          style={{ alignItems: 'center', minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
            {'New to ProofLoop? '}
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Create an account</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
