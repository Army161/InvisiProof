import React from 'react';
import { Modal, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Zap, Check } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { PrimaryButton } from '@/components/PrimaryButton';

export type PaywallTrigger = 'quota_exhausted' | 'proof_requests' | 'history' | 'generic';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  trigger?: PaywallTrigger;
}

const HEADLINES: Record<PaywallTrigger, string> = {
  quota_exhausted: "You've used your free assessments",
  proof_requests: 'Proof Requests require a plan',
  history: 'Unlock full scan history',
  generic: 'Unlock InvisiProof',
};

const FEATURE_BULLETS = [
  'More assessments every month',
  'More Proof Requests',
  'Server-verified analysis',
];

export function PaywallModal({ visible, onClose, trigger = 'generic' }: PaywallModalProps) {
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const headline = HEADLINES[trigger];

  const handleViewPlans = () => {
    console.log('[PaywallModal] View Plans pressed, trigger:', trigger);
    onClose();
    router.push('/(tabs)/(profile)/subscription');
  };

  const handleMaybeLater = () => {
    console.log('[PaywallModal] Maybe Later pressed');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.45)',
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: RADIUS.xl,
            borderTopRightRadius: RADIUS.xl,
            paddingTop: SPACING.lg,
            paddingBottom: insets.bottom + SPACING.lg,
            paddingHorizontal: SPACING.lg,
            gap: SPACING.md,
          }}
        >
          {/* Icon */}
          <View style={{ alignItems: 'center', marginBottom: SPACING.xs }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={30} color={colors.primary} />
            </View>
          </View>

          {/* Text */}
          <View style={{ alignItems: 'center', gap: SPACING.xs }}>
            <Text style={[TYPOGRAPHY.h3, { color: colors.text, textAlign: 'center' }]}>
              {headline}
            </Text>
            <Text
              style={[
                TYPOGRAPHY.body,
                {
                  color: colors.textSecondary,
                  textAlign: 'center',
                  maxWidth: 300,
                },
              ]}
            >
              Upgrade to Plus, Pro, or Max to get more assessments, Proof Requests, and server-verified analysis.
            </Text>
          </View>

          {/* Feature bullets */}
          <View style={{ gap: SPACING.sm }}>
            {FEATURE_BULLETS.map((bullet) => (
              <View
                key={bullet}
                style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: colors.evidenceMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={14} color={colors.evidence} />
                </View>
                <Text style={[TYPOGRAPHY.body, { color: colors.text, flex: 1 }]}>
                  {bullet}
                </Text>
              </View>
            ))}
          </View>

          {/* Primary button */}
          <PrimaryButton title="View Plans" onPress={handleViewPlans} />

          {/* Maybe Later */}
          <AnimatedPressable
            onPress={handleMaybeLater}
            accessibilityRole="button"
            accessibilityLabel="Maybe Later"
            style={{
              alignItems: 'center',
              minHeight: 44,
              justifyContent: 'center',
            }}
          >
            <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
              Maybe Later
            </Text>
          </AnimatedPressable>
        </View>
      </View>
    </Modal>
  );
}
