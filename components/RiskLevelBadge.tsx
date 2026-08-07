import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY } from '@/constants/theme';

type RiskLevel = 'low' | 'moderate' | 'medium' | 'high' | 'critical' | 'inconclusive' | 'unknown';

interface RiskLevelBadgeProps {
  level: RiskLevel;
}

const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Low Risk',
  moderate: 'Moderate Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  critical: 'Critical Risk',
  inconclusive: 'Inconclusive',
  unknown: 'Unknown',
};

export function RiskLevelBadge({ level }: RiskLevelBadgeProps) {
  const { colors } = useAppTheme();

  const colorMap: Record<RiskLevel, { bg: string; text: string }> = {
    low: { bg: colors.evidenceMuted, text: colors.evidence },
    moderate: { bg: colors.warningMuted, text: colors.warning },
    medium: { bg: colors.warningMuted, text: colors.warning },
    high: { bg: colors.dangerMuted, text: colors.danger },
    critical: { bg: colors.dangerMuted, text: colors.danger },
    inconclusive: { bg: 'rgba(148,163,184,0.12)', text: colors.textTertiary },
    unknown: { bg: 'rgba(148,163,184,0.12)', text: colors.textTertiary },
  };

  const { bg, text } = colorMap[level] ?? colorMap.unknown;
  const label = RISK_LABELS[level] ?? 'Unknown';

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={[TYPOGRAPHY.micro, { color: text }]}>{label}</Text>
    </View>
  );
}
