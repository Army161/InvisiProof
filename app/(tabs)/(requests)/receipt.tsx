import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, Share } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ReceiptText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { fetchProofReceipt, type ProofReceipt } from '@/services/proofRequestService';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { InfoCard } from '@/components/InfoCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { APP_CONFIG } from '@/config/app';

const POSSESSION_LABELS: Record<NonNullable<ProofReceipt['possession']>, string> = {
  strong: 'Strong signal',
  partial: 'Partial signal',
  weak: 'Weak signal',
};

const OVERALL_RISK_LABELS: Record<string, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  critical: 'High',
  inconclusive: 'Unclear',
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function receiptShareText(receipt: ProofReceipt): string {
  const item = receipt.item ?? 'the item';
  const possession = receipt.possession ? POSSESSION_LABELS[receipt.possession] : 'Not checked';
  const risk = OVERALL_RISK_LABELS[receipt.risk_level ?? 'inconclusive'] ?? 'Unclear';
  const passed = receipt.possession === 'strong';
  return [
    passed
      ? `The seller completed a live possession challenge for: ${item}.`
      : `The seller did not fully pass a live possession challenge for: ${item}.`,
    `Item possession: ${possession}. Overall risk: ${risk}.`,
    receipt.receipt_expires_at
      ? `${APP_CONFIG.name} Proof Receipt, valid until ${formatWhen(receipt.receipt_expires_at)}.`
      : `${APP_CONFIG.name} Proof Receipt.`,
    '',
    `Check your screenshot at ${APP_CONFIG.name}: ${APP_CONFIG.playStoreUrl}`,
  ].join('\n');
}

export default function ProofReceiptScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();

  const [receipt, setReceipt] = useState<ProofReceipt | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    setReceipt(await fetchProofReceipt(requestId));
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

  if (!receipt || receipt.expired) {
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
        {receipt?.expired ? <Clock size={40} color={colors.textTertiary} /> : <ReceiptText size={40} color={colors.textTertiary} />}
        <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, textAlign: 'center' }]}>
          {receipt?.expired
            ? `This Proof Receipt for the ${receipt.item ?? 'item'} expired. Receipts last 24 hours so old proof can't be reused. Send the seller a new request if you still need proof.`
            : "The Proof Receipt isn't ready yet. It appears here as soon as the seller's photo has been checked."}
        </Text>
        {!receipt ? <PrimaryButton title="Check Again" onPress={load} style={{ minWidth: 160 }} /> : null}
      </View>
    );
  }

  const checks = receipt.checks ?? {};
  const hasChallenge = !!receipt.challenge_completed && !!receipt.challenge;
  const possession = receipt.possession ? POSSESSION_LABELS[receipt.possession] : 'Not checked';
  const possessionColor = receipt.possession === 'strong'
    ? colors.evidence
    : receipt.possession === 'partial'
    ? colors.warning
    : colors.danger;
  const overallRisk = OVERALL_RISK_LABELS[receipt.risk_level ?? 'inconclusive'] ?? 'Unclear';
  const riskColor = receipt.risk_level === 'low'
    ? colors.evidence
    : receipt.risk_level === 'moderate'
    ? colors.warning
    : receipt.risk_level === 'inconclusive'
    ? colors.textTertiary
    : colors.danger;

  const receiptRows: { label: string; value: string; color?: string }[] = [
    { label: 'Evidence received', value: 'Yes', color: colors.evidence },
    ...(hasChallenge ? [{ label: 'Item possession', value: possession, color: possessionColor }] : []),
    { label: 'Live challenge completed', value: hasChallenge ? 'Yes' : 'No', color: hasChallenge ? colors.evidence : colors.textTertiary },
    { label: 'Identity confirmed', value: 'Not checked', color: colors.textTertiary },
    { label: 'Payment protection', value: 'None', color: colors.textTertiary },
    { label: 'Overall risk', value: overallRisk, color: riskColor },
    ...(receipt.receipt_expires_at ? [{ label: 'Receipt expires', value: formatWhen(receipt.receipt_expires_at) }] : []),
  ];

  const challengeChecks: { label: string; ok: boolean }[] = hasChallenge ? [
    { label: `${receipt.item ?? 'Item'} visible`, ok: !!checks.item_visible },
    { label: `Code word ${receipt.challenge!.phrase} written on paper`, ok: !!checks.phrase_matches },
    { label: `${receipt.challenge!.object.replace(/^./, c => c.toUpperCase())} next to the item`, ok: !!checks.object_visible },
    { label: `Taken ${receipt.challenge!.angle}`, ok: !!checks.angle_matches },
    { label: 'Live photo, not a screen or screenshot', ok: !!checks.looks_live },
  ] : [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: SPACING.md, paddingBottom: insets.bottom + SPACING.xl, gap: SPACING.md }}
    >
      {/* The receipt card. Built to be screenshotted and shared. */}
      <View
        style={{
          backgroundColor: colors.navy,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          gap: SPACING.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <ShieldCheck size={22} color={colors.primary} />
          <Text style={[TYPOGRAPHY.label, { color: colors.primary, textTransform: 'uppercase' }]}>
            {APP_CONFIG.name} Proof Receipt
          </Text>
        </View>
        {receipt.item ? (
          <Text style={[TYPOGRAPHY.h2, { color: '#FFFFFF' }]}>{receipt.item}</Text>
        ) : null}
        <View style={{ gap: SPACING.sm }}>
          {receiptRows.map(row => (
            <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md }}>
              <Text style={[TYPOGRAPHY.body, { color: 'rgba(255,255,255,0.7)' }]}>{row.label}</Text>
              <Text style={[TYPOGRAPHY.bodyMedium, { color: row.color ?? '#FFFFFF', fontWeight: '600' }]}>{row.value}</Text>
            </View>
          ))}
        </View>
        <Text style={[TYPOGRAPHY.caption, { color: 'rgba(255,255,255,0.5)' }]}>
          Check your screenshot at {APP_CONFIG.name}
        </Text>
      </View>

      <PrimaryButton title="Share Receipt" onPress={() => Share.share({ message: receiptShareText(receipt) }).catch(() => {})} />

      {challengeChecks.length ? (
        <InfoCard>
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginBottom: SPACING.sm }]}>
            What the seller's photo showed
          </Text>
          <View style={{ gap: SPACING.sm }}>
            {challengeChecks.map(check => (
              <View key={check.label} style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' }}>
                {check.ok
                  ? <CheckCircle size={16} color={colors.evidence} style={{ marginTop: 3 }} />
                  : <XCircle size={16} color={colors.danger} style={{ marginTop: 3 }} />}
                <Text style={[TYPOGRAPHY.body, { color: colors.text, flex: 1 }]}>{check.label}</Text>
              </View>
            ))}
          </View>
          {checks.notes ? (
            <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginTop: SPACING.sm }]}>{checks.notes}</Text>
          ) : null}
        </InfoCard>
      ) : null}

      {receipt.summary ? (
        <InfoCard>
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginBottom: SPACING.xs }]}>Summary</Text>
          <Text style={[TYPOGRAPHY.body, { color: colors.text }]}>{receipt.summary}</Text>
        </InfoCard>
      ) : null}

      {receipt.warning_signals?.length ? (
        <InfoCard>
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginBottom: SPACING.sm }]}>Red flags</Text>
          <View style={{ gap: SPACING.sm }}>
            {receipt.warning_signals.map((signal, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <AlertTriangle size={16} color={colors.warning} style={{ marginTop: 3 }} />
                <Text style={[TYPOGRAPHY.body, { color: colors.text, flex: 1 }]}>{signal}</Text>
              </View>
            ))}
          </View>
        </InfoCard>
      ) : null}

      {receipt.recommended_actions?.length ? (
        <InfoCard>
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginBottom: SPACING.sm }]}>Before you pay</Text>
          <View style={{ gap: SPACING.sm }}>
            {receipt.recommended_actions.map((action, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <CheckCircle size={16} color={colors.primary} style={{ marginTop: 3 }} />
                <Text style={[TYPOGRAPHY.body, { color: colors.text, flex: 1 }]}>{action}</Text>
              </View>
            ))}
          </View>
        </InfoCard>
      ) : null}

      <Text style={[TYPOGRAPHY.caption, { color: colors.textTertiary, textAlign: 'center' }]}>
        The seller's photo was checked privately. You see the result, not their photo. A Proof Receipt shows what one
        photo showed; it doesn't confirm who the seller is or protect your payment.
      </Text>
    </ScrollView>
  );
}
