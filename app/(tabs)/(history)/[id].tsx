import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertCircle,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Image as ImageIcon,
  Type,
  Link,
  Trash2,
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { triggerAnalysis, fetchAssessmentResult } from '@/services/assessmentService';
import { deleteScan } from '@/services/deleteScanService';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/constants/theme';
import { InfoCard } from '@/components/InfoCard';
import { RiskLevelBadge } from '@/components/RiskLevelBadge';
import { LegalDisclaimerCard } from '@/components/LegalDisclaimerCard';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { PrimaryButton, SecondaryButton } from '@/components/PrimaryButton';
import type { Scan, AssessmentResult } from '@/types/scan';

const INPUT_ICONS = {
  image: ImageIcon,
  text: Type,
  url: Link,
};

const INPUT_LABELS = {
  image: 'Image',
  text: 'Text',
  url: 'URL',
};

const SOURCE_LABELS: Record<string, string> = {
  camera: 'Camera',
  library: 'Photo Library',
  paste: 'Pasted',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatScore(score: number): string {
  return String(Math.round(Number(score)));
}

const POLL_INTERVAL_MS = 5000;
const POLL_MAX_COUNT = 12;

export default function ScanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [scan, setScan] = useState<Scan | null>(null);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [signedUrlExpired, setSignedUrlExpired] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerError, setTriggerError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const pollCountRef = useRef(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!id || !user) return;
    console.log('[ScanDetailScreen] loadData called');
    try {
      const { data: scanData, error: scanError } = await supabase
        .from('scans')
        .select('*')
        .eq('id', id)
        .single();

      if (scanError || !scanData) {
        console.log('[ScanDetailScreen] scan not found or access denied');
        setError('This scan could not be found or you do not have access to it.');
        stopPolling();
        return;
      }

      const s = scanData as Scan;
      setScan(s);

      // Stop polling if no longer processing
      if (s.status !== 'processing') {
        stopPolling();
      }

      // Load signed URL for image scans
      if (s.input_type === 'image' && s.storage_path) {
        console.log('[ScanDetailScreen] creating signed URL for image');
        const { data: urlData, error: urlError } = await supabase.storage
          .from('scan-uploads')
          .createSignedUrl(s.storage_path, 60);
        if (!urlError && urlData?.signedUrl) {
          setSignedUrl(urlData.signedUrl);
          setSignedUrlExpired(false);
        }
      }

      // Load assessment result
      const result = await fetchAssessmentResult(id);
      setAssessment(result);
      setError(null);
    } catch {
      console.log('[ScanDetailScreen] loadData unexpected error');
      setError('Could not load scan details. Please check your connection.');
      stopPolling();
    }
  }, [id, user, stopPolling]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  // Polling for processing scans
  useEffect(() => {
    if (!scan || scan.status !== 'processing') return;

    pollCountRef.current = 0;
    stopPolling();

    pollIntervalRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      console.log('[ScanDetailScreen] polling tick', pollCountRef.current);
      if (pollCountRef.current >= POLL_MAX_COUNT) {
        console.log('[ScanDetailScreen] polling max count reached, stopping');
        stopPolling();
        return;
      }
      await loadData();
    }, POLL_INTERVAL_MS);

    return () => {
      stopPolling();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scan?.status, stopPolling, loadData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const handleRefreshSignedUrl = async () => {
    if (!scan?.storage_path) return;
    console.log('[ScanDetailScreen] refresh signed URL pressed');
    const { data, error: urlError } = await supabase.storage
      .from('scan-uploads')
      .createSignedUrl(scan.storage_path, 60);
    if (!urlError && data?.signedUrl) {
      setSignedUrl(data.signedUrl);
      setSignedUrlExpired(false);
    }
  };

  const handleTriggerAnalysis = async () => {
    if (!id) return;
    console.log('[ScanDetailScreen] trigger analysis pressed');
    setTriggerLoading(true);
    setTriggerError(null);
    const result = await triggerAnalysis(id);
    setTriggerLoading(false);
    if (!result.success) {
      setTriggerError(result.error ?? 'Analysis could not be started.');
    } else {
      // Reload to pick up new status
      await loadData();
    }
  };

  const handleRetry = () => {
    console.log('[ScanDetailScreen] retry pressed');
    setLoading(true);
    setError(null);
    loadData().finally(() => setLoading(false));
  };

  const handleDeleteScan = () => {
    if (!id) return;
    console.log('[ScanDetailScreen] delete scan pressed');
    Alert.alert(
      'Delete this scan?',
      'This will permanently delete the scan, image, and analysis results.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('[ScanDetailScreen] delete scan confirmed');
            setDeleting(true);
            const result = await deleteScan(id);
            setDeleting(false);
            if (!result.success) {
              console.log('[ScanDetailScreen] delete scan failed');
              Alert.alert('Error', result.error ?? 'Could not delete this scan. Please try again.');
            } else {
              console.log('[ScanDetailScreen] delete scan success, navigating back');
              router.back();
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !scan) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: SPACING.md }}>
        <InfoCard>
          <View style={{ alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md }}>
            <AlertCircle size={32} color={colors.danger} />
            <View style={{ alignItems: 'center', gap: SPACING.xs }}>
              <Text style={[TYPOGRAPHY.h3, { color: colors.text, textAlign: 'center' }]}>
                Couldn't load scan
              </Text>
              <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, textAlign: 'center' }]}>
                {error ?? 'Scan not found.'}
              </Text>
            </View>
            <PrimaryButton title="Try Again" onPress={handleRetry} style={{ minWidth: 140 }} />
          </View>
        </InfoCard>
      </View>
    );
  }

  const InputIcon = INPUT_ICONS[scan.input_type];
  const inputLabel = INPUT_LABELS[scan.input_type];
  const sourceLabel = SOURCE_LABELS[scan.source_type] ?? scan.source_type;
  const submittedDate = formatDate(scan.created_at);

  const riskLevelForBadge = (() => {
    const level = assessment?.risk_level;
    if (!level) return 'unknown' as const;
    if (level === 'low') return 'low' as const;
    if (level === 'moderate') return 'moderate' as const;
    if (level === 'high') return 'high' as const;
    if (level === 'critical') return 'critical' as const;
    if (level === 'inconclusive') return 'inconclusive' as const;
    return 'unknown' as const;
  })();

  const scoreDisplay = assessment ? formatScore(assessment.risk_score) : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: SPACING.md, gap: SPACING.md, paddingTop: SPACING.md }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {/* Scan metadata card */}
      <InfoCard>
        <View style={{ gap: SPACING.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: RADIUS.md,
                backgroundColor: colors.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <InputIcon size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>
                {inputLabel}
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                {sourceLabel}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: SPACING.xl }}>
            <View>
              <Text style={[TYPOGRAPHY.micro, { color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }]}>
                Submitted
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                {submittedDate}
              </Text>
            </View>
          </View>
        </View>
      </InfoCard>

      {/* Image preview for image scans */}
      {scan.input_type === 'image' ? (
        <InfoCard style={{ padding: 0, overflow: 'hidden' }}>
          {signedUrlExpired ? (
            <AnimatedPressable
              onPress={handleRefreshSignedUrl}
              accessibilityRole="button"
              accessibilityLabel="Refresh image preview"
              style={{
                padding: SPACING.lg,
                alignItems: 'center',
                gap: SPACING.sm,
              }}
            >
              <RefreshCw size={24} color={colors.textSecondary} />
              <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
                Image preview expired. Tap to refresh.
              </Text>
            </AnimatedPressable>
          ) : signedUrl ? (
            <Image
              source={{ uri: signedUrl }}
              style={{ width: '100%', height: 220, borderRadius: RADIUS.lg }}
              resizeMode="cover"
              onError={() => {
                console.log('[ScanDetailScreen] image load error, marking expired');
                setSignedUrlExpired(true);
              }}
            />
          ) : (
            <View style={{ padding: SPACING.lg, alignItems: 'center', gap: SPACING.sm }}>
              <ImageIcon size={24} color={colors.textTertiary} />
              <Text style={[TYPOGRAPHY.caption, { color: colors.textTertiary }]}>
                Image preview unavailable
              </Text>
            </View>
          )}
        </InfoCard>
      ) : null}

      {/* Analysis status / results */}
      {scan.status === 'ready_for_analysis' ? (
        <InfoCard>
          <View style={{ gap: SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Clock size={20} color={colors.textSecondary} />
              <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>
                Queued for analysis
              </Text>
            </View>
            <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
              Your submission is queued for analysis. Tap below to start the AI assessment.
            </Text>
            {triggerError ? (
              <Text style={[TYPOGRAPHY.caption, { color: colors.danger }]}>
                {triggerError}
              </Text>
            ) : null}
            <PrimaryButton
              title="Start Analysis"
              onPress={handleTriggerAnalysis}
              loading={triggerLoading}
            />
          </View>
        </InfoCard>
      ) : scan.status === 'processing' ? (
        <InfoCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
            <ActivityIndicator size="small" color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>
                Analysis in progress
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                This usually takes under a minute.
              </Text>
            </View>
          </View>
        </InfoCard>
      ) : scan.status === 'failed' ? (
        <InfoCard>
          <View style={{ gap: SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <XCircle size={20} color={colors.danger} />
              <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>
                Analysis failed
              </Text>
            </View>
            <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
              Analysis could not be completed. You can try again below.
            </Text>
            {triggerError ? (
              <Text style={[TYPOGRAPHY.caption, { color: colors.danger }]}>
                {triggerError}
              </Text>
            ) : null}
            <SecondaryButton
              title="Retry Analysis"
              onPress={handleTriggerAnalysis}
              loading={triggerLoading}
            />
          </View>
        </InfoCard>
      ) : scan.status === 'completed' && assessment ? (
        <>
          {/* Risk summary card */}
          <InfoCard>
            <View style={{ gap: SPACING.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <CheckCircle size={20} color={colors.evidence} />
                <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>
                  Analysis complete
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                <RiskLevelBadge level={riskLevelForBadge} />
                {scoreDisplay ? (
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                    <Text style={[TYPOGRAPHY.h2, { color: colors.text }]}>
                      {scoreDisplay}
                    </Text>
                    <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                      / 100
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={[TYPOGRAPHY.body, { color: colors.text, lineHeight: 22 }]}>
                {assessment.summary}
              </Text>
            </View>
          </InfoCard>

          {/* Warning signals */}
          {assessment.warning_signals && assessment.warning_signals.length > 0 ? (
            <InfoCard>
              <View style={{ gap: SPACING.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <AlertTriangle size={18} color={colors.warning} />
                  <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>
                    Warning signals
                  </Text>
                </View>
                {assessment.warning_signals.map((signal, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' }}>
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: colors.warning,
                        marginTop: 8,
                        flexShrink: 0,
                      }}
                    />
                    <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, flex: 1 }]}>
                      {signal}
                    </Text>
                  </View>
                ))}
              </View>
            </InfoCard>
          ) : null}

          {/* Recommended actions */}
          {assessment.recommended_actions && assessment.recommended_actions.length > 0 ? (
            <InfoCard>
              <View style={{ gap: SPACING.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <ChevronRight size={18} color={colors.primary} />
                  <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>
                    Recommended actions
                  </Text>
                </View>
                {assessment.recommended_actions.map((action, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: colors.primaryMuted,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <Text style={[TYPOGRAPHY.micro, { color: colors.primary }]}>
                        {String(i + 1)}
                      </Text>
                    </View>
                    <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, flex: 1 }]}>
                      {action}
                    </Text>
                  </View>
                ))}
              </View>
            </InfoCard>
          ) : null}

          {/* Limitations */}
          {assessment.limitations && assessment.limitations.length > 0 ? (
            <InfoCard>
              <View style={{ gap: SPACING.sm }}>
                <Text style={[TYPOGRAPHY.label, { color: colors.textSecondary, textTransform: 'uppercase' }]}>
                  Limitations
                </Text>
                {assessment.limitations.map((limitation, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' }}>
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: colors.textTertiary,
                        marginTop: 8,
                        flexShrink: 0,
                      }}
                    />
                    <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, flex: 1 }]}>
                      {limitation}
                    </Text>
                  </View>
                ))}
              </View>
            </InfoCard>
          ) : null}
        </>
      ) : scan.status === 'completed' && !assessment ? (
        <InfoCard>
          <View style={{ gap: SPACING.sm }}>
            <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>
              Results loading
            </Text>
            <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
              Analysis is complete. Results are being prepared.
            </Text>
            <SecondaryButton title="Refresh" onPress={handleRetry} />
          </View>
        </InfoCard>
      ) : null}

      {/* Delete Scan */}
      <AnimatedPressable
        onPress={deleting ? undefined : handleDeleteScan}
        accessibilityRole="button"
        accessibilityLabel="Delete this scan"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING.sm,
          paddingVertical: SPACING.md,
          opacity: deleting ? 0.5 : 1,
        }}
      >
        {deleting ? (
          <ActivityIndicator size="small" color={colors.danger} />
        ) : (
          <Trash2 size={16} color={colors.danger} />
        )}
        <Text style={[TYPOGRAPHY.body, { color: colors.danger }]}>
          {deleting ? 'Deleting…' : 'Delete Scan'}
        </Text>
      </AnimatedPressable>

      {/* Legal disclaimer */}
      <LegalDisclaimerCard text="ProofLoop identifies observable patterns only. Results do not guarantee safety, identify criminals, or replace professional advice." />
    </ScrollView>
  );
}
