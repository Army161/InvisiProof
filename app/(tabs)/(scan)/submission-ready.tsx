import React, { useRef, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ShieldCheck, CheckCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { triggerAnalysis } from '@/services/assessmentService';
import { submitProofResponse } from '@/services/proofRequestService';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { InfoCard } from '@/components/InfoCard';
import { PrimaryButton, SecondaryButton } from '@/components/PrimaryButton';
import type { InputType, SourceType } from '@/types/scan';

function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

function mapInputType(inputType: string): string {
  const map: Record<InputType, string> = {
    image: 'Image',
    text: 'Text',
    url: 'URL',
  };
  return map[inputType as InputType] ?? inputType;
}

function mapSourceType(sourceType: string): string {
  const map: Record<SourceType, string> = {
    camera: 'Camera',
    library: 'Library',
    paste: 'Pasted',
  };
  return map[sourceType as SourceType] ?? sourceType;
}

export default function SubmissionReadyScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    scanId: string;
    inputType: string;
    sourceType: string;
    createdAt: string;
    proofRequestId?: string;
  }>();
  const isProofResponse = !!params.proofRequestId;

  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [sentToRequester, setSentToRequester] = useState(false);
  // Lets a failed send be retried without analyzing the evidence twice.
  const analyzedRef = useRef(false);

  const inputTypeLabel = mapInputType(params.inputType ?? '');
  const sourceTypeLabel = mapSourceType(params.sourceType ?? '');
  const dateLabel = formatDateTime(params.createdAt ?? '');

  const handleRequestAnalysis = async () => {
    if (!params.scanId) {
      console.log('[SubmissionReady] request analysis pressed but no scanId');
      return;
    }
    console.log('[SubmissionReady] request analysis pressed');
    setAnalysisLoading(true);
    const result = analyzedRef.current
      ? { success: true as const, error: undefined }
      : await triggerAnalysis(params.scanId);
    if (!result.success) {
      setAnalysisLoading(false);
      const errMsg = result.error ?? 'Analysis could not be started.';
      if (errMsg.includes('API key was rejected')) {
        Alert.alert('Your API key was rejected', errMsg, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Check AI Provider',
            onPress: () => router.push('/(tabs)/(profile)/ai-provider'),
          },
        ]);
      } else {
        Alert.alert('Analysis failed', errMsg);
      }
      return;
    }
    console.log('[SubmissionReady] analysis completed');
    analyzedRef.current = true;

    // When answering a Proof Request, send the verdict back to the requester.
    if (params.proofRequestId) {
      const response = await submitProofResponse(params.proofRequestId, params.scanId);
      if (!response.success) {
        setAnalysisLoading(false);
        Alert.alert(
          'Could not send to requester',
          response.error ?? 'Your evidence was analyzed, but it could not be sent. Please try again.',
        );
        return;
      }
      setSentToRequester(true);
    }
    setAnalysisLoading(false);
    setAnalysisStarted(true);
  };

  const handleViewInHistory = () => {
    console.log('[SubmissionReady] view in history pressed');
    router.replace('/(tabs)/(history)');
  };

  const handleScanAnother = () => {
    console.log('[SubmissionReady] scan another pressed');
    router.replace('/(tabs)/(scan)');
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top + SPACING.md,
        paddingBottom: insets.bottom + SPACING.lg,
        paddingHorizontal: SPACING.md,
        justifyContent: 'center',
      }}
    >
      {/* Icon */}
      <View style={{ alignItems: 'center', marginBottom: SPACING.lg }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: analysisStarted ? colors.evidenceMuted : colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {analysisStarted ? (
            <CheckCircle size={48} color={colors.evidence} />
          ) : (
            <ShieldCheck size={48} color={colors.primary} />
          )}
        </View>
      </View>

      {/* Heading */}
      <Text
        style={[
          TYPOGRAPHY.h1,
          { color: colors.text, textAlign: 'center', marginBottom: SPACING.sm },
        ]}
      >
        {sentToRequester
          ? 'Sent to Requester'
          : analysisStarted
            ? 'Analysis Complete'
            : isProofResponse ? 'Evidence Ready' : 'Submission Ready'}
      </Text>

      {/* Explanation */}
      <Text
        style={[
          TYPOGRAPHY.body,
          {
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: SPACING.xl,
            paddingHorizontal: SPACING.md,
          },
        ]}
      >
        {sentToRequester
          ? 'Your evidence was checked privately. The requester sees the verdict and score, not your files.'
          : analysisStarted
            ? 'Your results are ready in the History tab.'
            : isProofResponse
              ? 'Your evidence was privately saved. Submit it to have it checked and send the verdict to the requester.'
              : 'Your content was privately saved. Request an AI analysis now, or find it later in your scan history.'}
      </Text>

      {/* Summary card */}
      <InfoCard style={{ marginBottom: SPACING.xl }}>
        <View style={{ gap: SPACING.sm }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
              Type
            </Text>
            <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.text }]}>
              {inputTypeLabel}
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: colors.divider }} />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
              Source
            </Text>
            <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.text }]}>
              {sourceTypeLabel}
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: colors.divider }} />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
              Submitted
            </Text>
            <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.text }]}>
              {dateLabel}
            </Text>
          </View>
        </View>
      </InfoCard>

      {/* Action buttons */}
      <View style={{ gap: SPACING.sm }}>
        {!analysisStarted ? (
          <PrimaryButton
            title={isProofResponse ? 'Check and Send Verdict' : 'Request Analysis Now'}
            onPress={handleRequestAnalysis}
            loading={analysisLoading}
          />
        ) : null}
        <SecondaryButton
          title="View in History"
          onPress={handleViewInHistory}
        />
        <SecondaryButton
          title="Scan Another"
          onPress={handleScanAnother}
        />
      </View>
    </View>
  );
}
