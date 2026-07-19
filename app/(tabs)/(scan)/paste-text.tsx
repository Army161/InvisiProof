import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { AuthRequiredModal } from '@/components/AuthRequiredModal';
import { useSubmitScan } from '@/hooks/useSubmitScan';
import { ConsentCheckbox } from '@/components/ConsentCheckbox';
import { PrimaryButton } from '@/components/PrimaryButton';
import { validateTextContent, validateUrl } from '@/utils/scanValidation';

type TabMode = 'text' | 'link';

export default function PasteTextScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const { stage, stageLabel, error, submitText, submitUrl, reset } = useSubmitScan();

  const [mode, setMode] = useState<TabMode>('text');
  const [textValue, setTextValue] = useState('');
  const [linkValue, setLinkValue] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [linkBlurred, setLinkBlurred] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const isGuestOrNoUser = isGuest || !user;
  const isSubmitting = stage === 'preparing' || stage === 'uploading' || stage === 'saving';

  // Validation
  const textError = mode === 'text' ? validateTextContent(textValue) : null;
  const linkErrorMsg = (() => {
    if (mode !== 'link') return null;
    if (!linkValue.trim()) return 'Please enter a URL.';
    try {
      validateUrl(linkValue);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'Invalid URL.';
    }
  })();

  const showLinkError = linkErrorMsg !== null && (linkBlurred || submitAttempted);
  const currentInputValid = mode === 'text' ? textError === null && textValue.trim().length > 0 : linkErrorMsg === null;
  const submitDisabled = !currentInputValid || !consentChecked || stage !== 'idle';

  const handleModeSwitch = (newMode: TabMode) => {
    console.log('[PasteText] mode switched to:', newMode);
    setMode(newMode);
    setConsentChecked(false);
    setSubmitAttempted(false);
    reset();
  };

  const handleTextFocus = () => {
    if (isGuestOrNoUser) {
      console.log('[PasteText] text input focused by guest, showing auth modal');
      setShowAuthModal(true);
    }
  };

  const handleSubmit = async () => {
    console.log('[PasteText] submit pressed, mode:', mode);
    setSubmitAttempted(true);
    if (!user) return;

    if (mode === 'text') {
      const validationError = validateTextContent(textValue);
      if (validationError) {
        console.log('[PasteText] text validation failed:', validationError);
        return;
      }
      const scan = await submitText(user.id, textValue);
      if (scan) {
        console.log('[PasteText] text submit success, navigating to submission-ready, scanId:', scan.id);
        router.push({
          pathname: '/(tabs)/(scan)/submission-ready',
          params: {
            inputType: scan.input_type,
            sourceType: scan.source_type,
            createdAt: scan.created_at,
          },
        });
      }
    } else {
      let normalizedUrl: string;
      try {
        normalizedUrl = validateUrl(linkValue);
      } catch (e) {
        console.log('[PasteText] URL validation failed:', e instanceof Error ? e.message : e);
        return;
      }
      const scan = await submitUrl(user.id, normalizedUrl);
      if (scan) {
        console.log('[PasteText] URL submit success, navigating to submission-ready, scanId:', scan.id);
        router.push({
          pathname: '/(tabs)/(scan)/submission-ready',
          params: {
            inputType: scan.input_type,
            sourceType: scan.source_type,
            createdAt: scan.created_at,
          },
        });
      }
    }
  };

  const handleConsentToggle = () => {
    setConsentChecked(prev => !prev);
  };

  const textCharCount = textValue.length;

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Segmented control */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.surfaceSecondary,
              borderRadius: RADIUS.md,
              padding: 3,
              marginBottom: SPACING.md,
            }}
          >
            {(['text', 'link'] as TabMode[]).map((tab) => {
              const isActive = mode === tab;
              const tabLabel = tab === 'text' ? 'Text' : 'Link';
              return (
                <Pressable
                  key={tab}
                  onPress={() => handleModeSwitch(tab)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={tabLabel}
                  style={{
                    flex: 1,
                    paddingVertical: SPACING.sm,
                    borderRadius: RADIUS.sm,
                    alignItems: 'center',
                    backgroundColor: isActive ? colors.surface : 'transparent',
                    boxShadow: isActive ? SHADOWS.sm : undefined,
                  } as any}
                >
                  <Text
                    style={[
                      TYPOGRAPHY.bodyMedium,
                      {
                        color: isActive ? colors.primary : colors.textSecondary,
                        fontWeight: isActive ? '600' : '400',
                      },
                    ]}
                  >
                    {tabLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Text input */}
          {mode === 'text' && (
            <View style={{ marginBottom: SPACING.md }}>
              <TextInput
                multiline
                value={textValue}
                onChangeText={(val) => {
                  setTextValue(val);
                  if (stage === 'error') reset();
                }}
                onFocus={handleTextFocus}
                placeholder="Paste or type your message, email, or conversation here…"
                placeholderTextColor={colors.textTertiary}
                maxLength={10000}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: RADIUS.lg,
                  borderWidth: 1,
                  borderColor: submitAttempted && textError ? colors.danger : colors.border,
                  padding: SPACING.md,
                  minHeight: 160,
                  textAlignVertical: 'top',
                  ...TYPOGRAPHY.body,
                  color: colors.text,
                }}
                editable={!isGuestOrNoUser && !isSubmitting}
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: SPACING.xs,
                }}
              >
                {submitAttempted && textError ? (
                  <Text style={[TYPOGRAPHY.caption, { color: colors.danger }]}>
                    {textError}
                  </Text>
                ) : (
                  <View />
                )}
                <Text style={[TYPOGRAPHY.caption, { color: colors.textTertiary }]}>
                  {textCharCount}
                  {' / 10,000'}
                </Text>
              </View>
            </View>
          )}

          {/* Link input */}
          {mode === 'link' && (
            <View style={{ marginBottom: SPACING.md }}>
              <TextInput
                value={linkValue}
                onChangeText={(val) => {
                  setLinkValue(val);
                  if (stage === 'error') reset();
                }}
                onFocus={handleTextFocus}
                onBlur={() => setLinkBlurred(true)}
                placeholder="https://example.com"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: RADIUS.lg,
                  borderWidth: 1,
                  borderColor: showLinkError ? colors.danger : colors.border,
                  padding: SPACING.md,
                  height: 52,
                  ...TYPOGRAPHY.body,
                  color: colors.text,
                }}
                editable={!isGuestOrNoUser && !isSubmitting}
              />
              {showLinkError && (
                <Text style={[TYPOGRAPHY.caption, { color: colors.danger, marginTop: SPACING.xs }]}>
                  {linkErrorMsg}
                </Text>
              )}
            </View>
          )}

          {/* Consent */}
          <View style={{ marginBottom: SPACING.md }}>
            <ConsentCheckbox
              checked={consentChecked}
              onToggle={handleConsentToggle}
              disabled={isSubmitting}
            />
          </View>

          {/* Submit button */}
          <PrimaryButton
            title="Submit for Analysis"
            onPress={isGuestOrNoUser ? () => { console.log('[PasteText] submit pressed by guest'); setShowAuthModal(true); } : handleSubmit}
            disabled={isGuestOrNoUser ? false : submitDisabled}
            loading={isSubmitting}
          />

          {/* Progress label */}
          {isSubmitting && stageLabel.length > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: SPACING.sm,
                marginTop: SPACING.sm,
              }}
            >
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                {stageLabel}
              </Text>
            </View>
          )}

          {/* Error display */}
          {stage === 'error' && error && (
            <View
              style={{
                marginTop: SPACING.sm,
                padding: SPACING.md,
                borderRadius: RADIUS.md,
                backgroundColor: colors.dangerMuted,
                borderWidth: 1,
                borderColor: colors.danger,
                gap: SPACING.xs,
              }}
            >
              <Text style={[TYPOGRAPHY.caption, { color: colors.danger }]}>
                {error}
              </Text>
              <Pressable
                onPress={() => {
                  console.log('[PasteText] try again pressed');
                  reset();
                }}
                accessibilityRole="button"
                accessibilityLabel="Try Again"
              >
                <Text style={[TYPOGRAPHY.caption, { color: colors.danger, fontWeight: '600', textDecorationLine: 'underline' }]}>
                  Try Again
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <AuthRequiredModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
