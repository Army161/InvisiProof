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
  AccessibilityInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff, Check, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { AnimatedPressable } from '@/components/AnimatedPressable';

function mapSignUpError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('already registered') || msg.includes('user already')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (msg.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  if (msg.includes('password should be at least') || msg.includes('password must be')) {
    return 'Password must be at least 8 characters.';
  }
  if (msg.includes('email rate limit') || msg.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) {
    return 'Check your connection and try again.';
  }
  return 'We could not create your account. Review the information and try again.';
}

interface FieldError {
  displayName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

export default function SignUpScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUpWithEmail } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const validate = (): boolean => {
    const newErrors: FieldError = {};
    if (!displayName.trim() || displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!password || password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }
    if (!confirmPassword || confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    if (!termsAccepted) {
      newErrors.terms = 'You must agree to the Terms of Use to continue.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('[SignUpScreen] submit pressed');
    setGlobalError('');
    if (!validate()) {
      console.log('[SignUpScreen] validation failed');
      return;
    }
    setLoading(true);
    try {
      const { requiresConfirmation } = await signUpWithEmail(email.trim().toLowerCase(), password, displayName.trim());
      if (requiresConfirmation) {
        console.log('[SignUpScreen] sign up success, email confirmation required');
        router.replace('/(auth)/verify-email');
      } else {
        console.log('[SignUpScreen] sign up success, navigating to scan');
        router.replace('/(tabs)/(scan)');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.log('[SignUpScreen] sign up error:', message);
      setGlobalError(mapSignUpError(message));
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
            console.log('[SignUpScreen] back pressed');
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
          Create Account
        </Text>
        <Text
          style={[
            TYPOGRAPHY.body,
            { color: colors.textSecondary, marginBottom: SPACING.xl },
          ]}
        >
          Join ProofLoop to securely save and manage your verification history.
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

        {/* Display Name */}
        <View style={{ marginBottom: SPACING.md }}>
          <Text style={labelStyle}>Display Name</Text>
          <TextInput
            style={[inputStyle, errors.displayName ? { borderColor: colors.danger } : {}]}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            accessibilityLabel="Display name"
          />
          {errors.displayName ? (
            <Text style={errorStyle} accessibilityLiveRegion="polite">
              {errors.displayName}
            </Text>
          ) : null}
        </View>

        {/* Email */}
        <View style={{ marginBottom: SPACING.md }}>
          <Text style={labelStyle}>Email</Text>
          <TextInput
            ref={emailRef}
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
        <View style={{ marginBottom: SPACING.md }}>
          <Text style={labelStyle}>Password</Text>
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
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry={!showPassword}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              accessibilityLabel="Password"
            />
            <TouchableOpacity
              onPress={() => {
                console.log('[SignUpScreen] toggle password visibility');
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

        {/* Confirm Password */}
        <View style={{ marginBottom: SPACING.md }}>
          <Text style={labelStyle}>Confirm Password</Text>
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
              placeholder="Re-enter your password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry={!showConfirmPassword}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              accessibilityLabel="Confirm password"
            />
            <TouchableOpacity
              onPress={() => {
                console.log('[SignUpScreen] toggle confirm password visibility');
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

        {/* Terms checkbox */}
        <View style={{ marginBottom: SPACING.xl }}>
          <AnimatedPressable
            onPress={() => {
              console.log('[SignUpScreen] terms checkbox toggled:', !termsAccepted);
              setTermsAccepted(v => !v);
            }}
            accessibilityRole="checkbox"
            accessibilityLabel="Agree to Terms of Use and Privacy Policy"
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 1.5,
                borderColor: termsAccepted ? colors.primary : colors.border,
                backgroundColor: termsAccepted ? colors.primary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 1,
                flexShrink: 0,
              }}
            >
              {termsAccepted ? <Check size={14} color="#FFFFFF" /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, lineHeight: 22 }]}>
                {'I agree to the '}
                <Text
                  style={{ color: colors.primary }}
                  onPress={() => {
                    console.log('[SignUpScreen] Terms of Use link pressed');
                    router.push('/(tabs)/(profile)/terms-of-use');
                  }}
                >
                  Terms of Use
                </Text>
                {' and acknowledge the '}
                <Text
                  style={{ color: colors.primary }}
                  onPress={() => {
                    console.log('[SignUpScreen] Privacy Policy link pressed');
                    router.push('/(tabs)/(profile)/privacy-policy');
                  }}
                >
                  Privacy Policy
                </Text>
                {'.'}
              </Text>
            </View>
          </AnimatedPressable>
          {errors.terms ? (
            <Text style={[errorStyle, { marginLeft: 30 }]} accessibilityLiveRegion="polite">
              {errors.terms}
            </Text>
          ) : null}
        </View>

        {/* Submit */}
        <AnimatedPressable
          onPress={handleSubmit}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Create Account"
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
              Create Account
            </Text>
          )}
        </AnimatedPressable>

        {/* Sign in link */}
        <TouchableOpacity
          onPress={() => {
            console.log('[SignUpScreen] sign in link pressed');
            router.replace('/(auth)/sign-in');
          }}
          accessibilityRole="button"
          accessibilityLabel="Already have an account? Sign in"
          style={{ alignItems: 'center', minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
            {'Already have an account? '}
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
