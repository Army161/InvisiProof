import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { UserCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyStateCard } from '@/components/EmptyStateCard';

const MAX_DISPLAY_NAME = 50;

export default function EditProfileScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { user, profile, profileLoading, profileError, updateProfile, fetchProfile } = useAuth();

  const originalName = profile?.display_name ?? '';
  const [displayName, setDisplayName] = useState(originalName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync displayName when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
    }
  }, [profile]);

  const trimmedName = displayName.trim();
  const isDirty = trimmedName !== (profile?.display_name ?? '').trim();
  const charCount = displayName.length;

  const validate = useCallback((): boolean => {
    if (trimmedName.length < 2) {
      setNameError('Display name must be at least 2 characters.');
      return false;
    }
    if (trimmedName.length > MAX_DISPLAY_NAME) {
      setNameError(`Display name must be ${MAX_DISPLAY_NAME} characters or fewer.`);
      return false;
    }
    setNameError(null);
    return true;
  }, [trimmedName]);

  // Unsaved-change protection via beforeRemove
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!isDirty || saving) return;
      e.preventDefault();
      console.log('[EditProfileScreen] unsaved changes — prompting discard');
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              console.log('[EditProfileScreen] discard changes confirmed');
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });
    return unsubscribe;
  }, [navigation, isDirty, saving]);

  const handleSave = async () => {
    console.log('[EditProfileScreen] Save Changes pressed');
    if (!validate()) return;
    setSaveError(null);
    setSaving(true);
    try {
      await updateProfile(trimmedName);
      console.log('[EditProfileScreen] profile saved successfully');
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save your profile. Please try again.';
      console.log('[EditProfileScreen] save error');
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = () => {
    console.log('[EditProfileScreen] retry fetch profile pressed');
    fetchProfile();
  };

  const isSaveDisabled = !isDirty || saving || trimmedName.length < 2;
  const saveTitle = saving ? 'Saving\u2026' : 'Save Changes';

  // Loading state — profile not yet loaded
  if (profileLoading && !profile) {
    return (
      <>
        <Stack.Screen options={{ title: 'Edit Profile', headerBackTitle: 'Profile' }} />
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
            gap: SPACING.md,
          }}
        >
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
            Loading profile\u2026
          </Text>
        </View>
      </>
    );
  }

  // Error state — profile failed to load and still null
  if (profileError && !profile) {
    return (
      <>
        <Stack.Screen options={{ title: 'Edit Profile', headerBackTitle: 'Profile' }} />
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <EmptyStateCard
            icon={UserCircle}
            title="Profile unavailable"
            subtitle="We could not load your profile. Check your connection and try again."
            ctaLabel="Retry"
            onCtaPress={handleRetry}
          />
        </View>
      </>
    );
  }

  const emailValue = profile?.email ?? user?.email ?? '';

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Profile', headerBackTitle: 'Profile' }} />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: SPACING.xxxl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Display Name field */}
          <View style={{ marginBottom: SPACING.lg }}>
            <Text
              style={[
                TYPOGRAPHY.label,
                {
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                  marginBottom: SPACING.sm,
                },
              ]}
            >
              Display Name
            </Text>
            <TextInput
              value={displayName}
              onChangeText={(text) => {
                console.log('[EditProfileScreen] display name changed');
                setDisplayName(text);
                if (nameError) setNameError(null);
              }}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              maxLength={MAX_DISPLAY_NAME}
              accessibilityLabel="Display name"
              placeholder="Your display name"
              placeholderTextColor={colors.textTertiary}
              style={[
                TYPOGRAPHY.body,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: nameError ? colors.danger : colors.border,
                  borderRadius: RADIUS.md,
                  paddingHorizontal: SPACING.md,
                  paddingVertical: SPACING.sm + 2,
                  minHeight: 48,
                },
              ]}
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: SPACING.xs,
              }}
            >
              {nameError ? (
                <Text style={[TYPOGRAPHY.caption, { color: colors.danger, flex: 1 }]}>
                  {nameError}
                </Text>
              ) : (
                <View style={{ flex: 1 }} />
              )}
              <Text style={[TYPOGRAPHY.caption, { color: colors.textTertiary }]}>
                {charCount}
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: colors.textTertiary }]}>
                /
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: colors.textTertiary }]}>
                {MAX_DISPLAY_NAME}
              </Text>
            </View>
          </View>

          {/* Email field (read-only) */}
          <View style={{ marginBottom: SPACING.xl }}>
            <Text
              style={[
                TYPOGRAPHY.label,
                {
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                  marginBottom: SPACING.sm,
                },
              ]}
            >
              Email Address
            </Text>
            <TextInput
              value={emailValue}
              editable={false}
              accessibilityLabel="Email address"
              style={[
                TYPOGRAPHY.body,
                {
                  color: colors.textSecondary,
                  backgroundColor: colors.surfaceSecondary,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: RADIUS.md,
                  paddingHorizontal: SPACING.md,
                  paddingVertical: SPACING.sm + 2,
                  minHeight: 48,
                },
              ]}
            />
            <Text
              style={[
                TYPOGRAPHY.caption,
                { color: colors.textTertiary, marginTop: SPACING.xs },
              ]}
            >
              Email cannot be changed here.
            </Text>
          </View>

          {/* Save button */}
          <PrimaryButton
            title={saveTitle}
            onPress={handleSave}
            disabled={isSaveDisabled}
            loading={saving}
          />

          {/* Save error */}
          {saveError ? (
            <Text
              style={[
                TYPOGRAPHY.caption,
                {
                  color: colors.danger,
                  textAlign: 'center',
                  marginTop: SPACING.sm,
                },
              ]}
            >
              {saveError}
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
