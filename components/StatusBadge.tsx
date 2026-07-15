import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY } from '@/constants/theme';

type StatusType = 'sent' | 'received' | 'completed' | 'expired';

interface StatusBadgeProps {
  status: StatusType;
}

const STATUS_LABELS: Record<StatusType, string> = {
  sent: 'Sent',
  received: 'Received',
  completed: 'Completed',
  expired: 'Expired',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { colors } = useAppTheme();

  const colorMap: Record<StatusType, { bg: string; text: string }> = {
    sent: { bg: colors.primaryMuted, text: colors.primary },
    received: { bg: colors.warningMuted, text: colors.warning },
    completed: { bg: colors.evidenceMuted, text: colors.evidence },
    expired: { bg: 'rgba(148,163,184,0.12)', text: colors.textTertiary },
  };

  const { bg, text } = colorMap[status];
  const label = STATUS_LABELS[status];

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
