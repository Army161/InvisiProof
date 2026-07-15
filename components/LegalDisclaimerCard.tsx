import React from 'react';
import { View, Text } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { InfoCard } from '@/components/InfoCard';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING } from '@/constants/theme';

const DEFAULT_DISCLAIMER =
  'ProofLoop evaluates observable signals and available evidence. It does not guarantee identity, safety, payment, delivery, legality, or recovery of funds.';

interface LegalDisclaimerCardProps {
  text?: string;
}

export function LegalDisclaimerCard({ text = DEFAULT_DISCLAIMER }: LegalDisclaimerCardProps) {
  const { colors } = useAppTheme();

  return (
    <InfoCard>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm }}>
        <AlertTriangle size={16} color={colors.warning} style={{ marginTop: 1 }} />
        <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, flex: 1 }]}>
          {text}
        </Text>
      </View>
    </InfoCard>
  );
}
