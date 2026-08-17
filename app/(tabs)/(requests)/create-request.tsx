import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Share,
  Alert,
  Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Copy, Share2, CheckCircle, Check } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { createProofRequest } from '@/services/proofRequestService';
import { trackProofRequestCreated } from '@/services/analytics';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { InfoCard } from '@/components/InfoCard';
import { PrimaryButton, SecondaryButton } from '@/components/PrimaryButton';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import type { ProofRequest } from '@/types/scan';

const EXPIRY_OPTIONS: { label: string; hours: number }[] = [
  { label: '1h', hours: 1 },
  { label: '6h', hours: 6 },
  { label: '24h', hours: 24 },
  { label: '48h', hours: 48 },
  { label: '72h', hours: 72 },
  { label: '7d', hours: 168 },
];

type AnalysisRequirement = ProofRequest['analysis_requirement'];

const ANALYSIS_REQUIREMENT_OPTIONS: { key: AnalysisRequirement; label: string; description: string }[] = [
  {
    key: 'local_or_cloud',
    label: 'Any provider',
    description: 'Respondent can use any AI provider, including local.',
  },
  {
    key: 'server_verified_cloud',
    label: 'Server-verified only',
    description: 'Analysis must be verified by InvisiProof servers.',
  },
];

export default function CreateRequestScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [challenge, setChallenge] = useState('');
  const [selectedHours, setSelectedHours] = useState(24);
  const [analysisRequirement, setAnalysisRequirement] = useState<AnalysisRequirement>('local_or_cloud');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const charCount = challenge.length;
  const isValid = charCount >= 10 && charCount <= 500;

  const handleCreate = async () => {
    if (!isValid) return;
    console.log('[CreateRequestScreen] create request pressed');
    setSubmitting(true);
    setError(null);
    try {
      const result = await createProofRequest(challenge, selectedHours);
      console.log('[CreateRequestScreen] request created successfully');
      trackProofRequestCreated({ analysis_requirement: analysisRequirement ?? 'local_or_cloud' });
      setCreatedCode(result.share_code);
    } catch (e: any) {
      console.log('[CreateRequestScreen] create request failed');
      setError(e?.message ?? 'Could not create proof request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!createdCode) return;
    console.log('[CreateRequestScreen] copy code pressed');
    Clipboard.setString(createdCode);
    Alert.alert('Copied', 'Share code copied to clipboard.');
  };

  const handleShare = async () => {
    if (!createdCode) return;
    console.log('[CreateRequestScreen] share code pressed');
    try {
      await Share.share({
        message: `Use this InvisiProof code to submit evidence: ${createdCode}\n\nChallenge: ${challenge}`,
      });
    } catch {
      console.log('[CreateRequestScreen] share failed');
    }
  };

  const handleDone = () => {
    console.log('[CreateRequestScreen] done pressed');
    router.back();
  };

  if (createdCode) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          paddingHorizontal: SPACING.md,
          paddingTop: SPACING.xl,
          paddingBottom: insets.bottom + SPACING.xl,
          gap: SPACING.md,
          alignItems: 'center',
        }}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Success icon */}
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.evidenceMuted,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: SPACING.sm,
          }}
        >
          <CheckCircle size={36} color={colors.evidence} />
        </View>

        <Text style={[TYPOGRAPHY.h2, { color: colors.text, textAlign: 'center' }]}>
          Request created
        </Text>
        <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, textAlign: 'center', maxWidth: 300 }]}>
          Share this code with the person you want to verify. They will use it to submit evidence.
        </Text>

        {/* Share code display */}
        <InfoCard style={{ width: '100%', alignItems: 'center', gap: SPACING.sm }}>
          <Text style={[TYPOGRAPHY.label, { color: colors.textSecondary, textTransform: 'uppercase' }]}>
            Share code
          </Text>
          <Text
            style={[
              TYPOGRAPHY.h1,
              {
                color: colors.primary,
                letterSpacing: 4,
                fontFamily: 'SpaceMono-Regular',
                textAlign: 'center',
              },
            ]}
          >
            {createdCode}
          </Text>
        </InfoCard>

        {/* Action buttons */}
        <View style={{ width: '100%', gap: SPACING.sm }}>
          <AnimatedPressable
            onPress={handleCopyCode}
            accessibilityRole="button"
            accessibilityLabel="Copy share code"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: SPACING.sm,
              backgroundColor: colors.primaryMuted,
              borderRadius: RADIUS.md,
              height: 52,
            }}
          >
            <Copy size={20} color={colors.primary} />
            <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.primary, fontWeight: '600' }]}>
              Copy code
            </Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Share code"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: SPACING.sm,
              backgroundColor: colors.surfaceSecondary,
              borderRadius: RADIUS.md,
              height: 52,
            }}
          >
            <Share2 size={20} color={colors.textSecondary} />
            <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.textSecondary, fontWeight: '600' }]}>
              Share
            </Text>
          </AnimatedPressable>

          <PrimaryButton title="Done" onPress={handleDone} />
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACING.md,
          paddingTop: SPACING.md,
          paddingBottom: insets.bottom + SPACING.xl,
          gap: SPACING.lg,
        }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        {/* Challenge input */}
        <View style={{ gap: SPACING.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[TYPOGRAPHY.label, { color: colors.textSecondary, textTransform: 'uppercase' }]}>
              Challenge
            </Text>
            <Text
              style={[
                TYPOGRAPHY.caption,
                { color: charCount > 500 ? colors.danger : charCount < 10 && charCount > 0 ? colors.warning : colors.textTertiary },
              ]}
            >
              {charCount}
            </Text>
          </View>
          <TextInput
            value={challenge}
            onChangeText={text => {
              setChallenge(text);
            }}
            placeholder="Describe what evidence you need. E.g. 'Please submit a photo of the item you are selling, held next to today's newspaper.'"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={5}
            maxLength={500}
            style={[
              TYPOGRAPHY.body,
              {
                color: colors.text,
                backgroundColor: colors.surfaceSecondary,
                borderRadius: RADIUS.md,
                padding: SPACING.md,
                minHeight: 120,
                textAlignVertical: 'top',
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
            autoFocus
          />
          {charCount > 0 && charCount < 10 ? (
            <Text style={[TYPOGRAPHY.caption, { color: colors.warning }]}>
              Minimum 10 characters required.
            </Text>
          ) : null}
        </View>

        {/* Expiry picker */}
        <View style={{ gap: SPACING.sm }}>
          <Text style={[TYPOGRAPHY.label, { color: colors.textSecondary, textTransform: 'uppercase' }]}>
            Expires in
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
            {EXPIRY_OPTIONS.map(opt => {
              const isSelected = selectedHours === opt.hours;
              return (
                <AnimatedPressable
                  key={opt.hours}
                  onPress={() => {
                    console.log('[CreateRequestScreen] expiry option selected:', opt.label);
                    setSelectedHours(opt.hours);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Expires in ${opt.label}`}
                  style={{
                    backgroundColor: isSelected ? colors.primary : colors.surfaceSecondary,
                    borderRadius: RADIUS.sm,
                    paddingHorizontal: 16,
                    height: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    style={[
                      TYPOGRAPHY.label,
                      { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>

        {/* Analysis requirement */}
        <View style={{ gap: SPACING.sm }}>
          <Text style={[TYPOGRAPHY.label, { color: colors.textSecondary, textTransform: 'uppercase' }]}>
            Analysis requirement
          </Text>
          <InfoCard style={{ padding: 0, paddingHorizontal: SPACING.md }}>
            {ANALYSIS_REQUIREMENT_OPTIONS.map((opt, i) => {
              const isSelected = analysisRequirement === opt.key;
              return (
                <View key={opt.key}>
                  <AnimatedPressable
                    onPress={() => {
                      console.log('[CreateRequestScreen] analysis requirement selected:', opt.key);
                      setAnalysisRequirement(opt.key);
                    }}
                    accessibilityRole="radio"
                    accessibilityLabel={opt.label}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      minHeight: 56,
                      gap: SPACING.md,
                      paddingVertical: SPACING.sm,
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.text, fontWeight: '600' }]}>
                        {opt.label}
                      </Text>
                      <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                        {opt.description}
                      </Text>
                    </View>
                    {isSelected ? (
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: colors.primary,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={14} color="#FFFFFF" />
                      </View>
                    ) : (
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: colors.border,
                        }}
                      />
                    )}
                  </AnimatedPressable>
                  {i < ANALYSIS_REQUIREMENT_OPTIONS.length - 1 ? (
                    <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 0 }} />
                  ) : null}
                </View>
              );
            })}
          </InfoCard>
        </View>

        {/* Error */}
        {error ? (
          <Text style={[TYPOGRAPHY.body, { color: colors.danger }]}>
            {error}
          </Text>
        ) : null}

        {/* Submit */}
        <PrimaryButton
          title="Create Request"
          onPress={handleCreate}
          disabled={!isValid}
          loading={submitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
