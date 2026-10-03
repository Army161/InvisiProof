import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { fetchProofRequestVerdict, type ProofRequestVerdict } from '@/services/proofRequestService';
import { TYPOGRAPHY, SPACING } from '@/constants/theme';
import { InfoCard } from '@/components/InfoCard';
import { RiskLevelBadge } from '@/components/RiskLevelBadge';
import { PrimaryButton } from '@/components/PrimaryButton';

export default function ProofVerdictScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { requestId, challenge } = useLocalSearchParams<{ requestId: string; challenge?: string }>();

  const [verdict, setVerdict] = useState<ProofRequestVerdict | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!requestId) return;
    console.log('[ProofVerdictScreen] loading verdict');
    setLoading(true);
    const result = await fetchProofRequestVerdict(requestId);
    setVerdict(result);
    setLoading(false);
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!verdict) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          padding: SPACING.lg,
          gap: SPACING.md,
        }}
      >
        <ShieldCheck size={40} color={colors.textTertiary} />
        <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, textAlign: 'center' }]}>
          The verdict isn't ready yet. It appears here as soon as the other person's evidence has been checked.
        </Text>
        <PrimaryButton title="Check Again" onPress={load} style={{ minWidth: 160 }} />
      </View>
    );
  }

  const score = Math.max(0, Math.min(100, Math.round(verdict.risk_score)));
  const scoreColor = score >= 70 ? colors.danger : score >= 40 ? colors.warning : colors.evidence;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: SPACING.md,
        paddingBottom: insets.bottom + SPACING.xl,
        gap: SPACING.md,
      }}
    >
      <InfoCard>
        <View style={{ alignItems: 'center', gap: SPACING.sm }}>
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>Risk score</Text>
          <Text style={{ fontSize: 56, fontWeight: '700', color: scoreColor }}>{score}</Text>
          <RiskLevelBadge level={verdict.risk_level} />
        </View>
      </InfoCard>

      {challenge ? (
        <InfoCard>
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginBottom: SPACING.xs }]}>
            What you asked them to prove
          </Text>
          <Text style={[TYPOGRAPHY.body, { color: colors.text }]}>{challenge}</Text>
        </InfoCard>
      ) : null}

      {verdict.summary ? (
        <InfoCard>
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginBottom: SPACING.xs }]}>
            Summary
          </Text>
          <Text style={[TYPOGRAPHY.body, { color: colors.text }]}>{verdict.summary}</Text>
        </InfoCard>
      ) : null}

      {verdict.warning_signals?.length ? (
        <InfoCard>
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginBottom: SPACING.sm }]}>
            Warning signals
          </Text>
          <View style={{ gap: SPACING.sm }}>
            {verdict.warning_signals.map((signal, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <AlertTriangle size={16} color={colors.warning} style={{ marginTop: 3 }} />
                <Text style={[TYPOGRAPHY.body, { color: colors.text, flex: 1 }]}>{signal}</Text>
              </View>
            ))}
          </View>
        </InfoCard>
      ) : null}

      {verdict.recommended_actions?.length ? (
        <InfoCard>
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginBottom: SPACING.sm }]}>
            What to do next
          </Text>
          <View style={{ gap: SPACING.sm }}>
            {verdict.recommended_actions.map((action, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <CheckCircle size={16} color={colors.primary} style={{ marginTop: 3 }} />
                <Text style={[TYPOGRAPHY.body, { color: colors.text, flex: 1 }]}>{action}</Text>
              </View>
            ))}
          </View>
        </InfoCard>
      ) : null}

      <Text style={[TYPOGRAPHY.caption, { color: colors.textTertiary, textAlign: 'center' }]}>
        Their evidence was checked privately. You see the verdict, not their files.
      </Text>
    </ScrollView>
  );
}
