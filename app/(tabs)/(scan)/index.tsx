import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  Camera,
  Link,
  KeyRound,
  ChevronRight,
  AlertCircle,
  BadgeCheck,
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { usePaywall } from '@/contexts/PaywallContext';
import { supabase } from '@/lib/supabase';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/constants/theme';
import { InfoCard } from '@/components/InfoCard';
import { SectionHeader } from '@/components/SectionHeader';
import { LegalDisclaimerCard } from '@/components/LegalDisclaimerCard';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { APP_CONFIG } from '@/config/app';

const FREE_ASSESSMENT_LIMIT = 3;

function AnimatedListItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        delay: index * 70,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

interface ScanActionCardProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  description: string;
  onPress: () => void;
  index: number;
}

function ScanActionCard({ icon: Icon, title, description, onPress, index }: ScanActionCardProps) {
  const { colors } = useAppTheme();

  return (
    <AnimatedListItem index={index}>
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={{
          backgroundColor: colors.surface,
          borderRadius: RADIUS.lg,
          padding: SPACING.md,
          borderWidth: 1,
          borderColor: colors.border,
          boxShadow: SHADOWS.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.md,
        } as any}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: RADIUS.md,
            backgroundColor: colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={24} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[TYPOGRAPHY.h3, { color: colors.text, marginBottom: 2 }]}>{title}</Text>
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <ChevronRight size={20} color={colors.textTertiary} />
      </AnimatedPressable>
    </AnimatedListItem>
  );
}

export default function ScanScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { entitlement, loading: subLoading } = useSubscription();
  const { showPaywall } = usePaywall();
  const [assessmentsUsed, setAssessmentsUsed] = useState<number | null>(null);

  useEffect(() => {
    if (!user || subLoading) return;
    if (entitlement !== 'free') return;
    // Only check quota for free users
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    supabase
      .from('usage_counters')
      .select('direct_assessments_used')
      .eq('user_id', user.id)
      .gte('period_start', periodStart)
      .single()
      .then(({ data }) => {
        if (data) {
          console.log('[ScanScreen] usage_counters loaded, assessments used:', data.direct_assessments_used);
          setAssessmentsUsed(data.direct_assessments_used ?? 0);
        } else {
          setAssessmentsUsed(0);
        }
      });
  }, [user, entitlement, subLoading]);

  const isQuotaExhausted = entitlement === 'free' && assessmentsUsed !== null && assessmentsUsed >= FREE_ASSESSMENT_LIMIT;

  const handleScanScreenshot = () => {
    if (isQuotaExhausted) {
      console.log('[ScanScreen] quota exhausted — showing paywall from scan screenshot');
      showPaywall('quota_exhausted');
      return;
    }
    console.log('[ScanScreen] navigate to scan-screenshot');
    router.push('/(tabs)/(scan)/scan-screenshot');
  };

  const handlePasteText = () => {
    if (isQuotaExhausted) {
      console.log('[ScanScreen] quota exhausted — showing paywall from paste text');
      showPaywall('quota_exhausted');
      return;
    }
    console.log('[ScanScreen] navigate to paste-text');
    router.push('/(tabs)/(scan)/paste-text');
  };

  const handleRequestProof = () => {
    console.log('[ScanScreen] navigate to create-request');
    router.push('/(tabs)/(requests)/create-request');
  };

  const handleEnterProofCode = () => {
    console.log('[ScanScreen] navigate to enter-proof-code');
    router.push('/(tabs)/(scan)/enter-proof-code');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + SPACING.md,
          paddingHorizontal: SPACING.md,
          paddingBottom: SPACING.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs }}>
          <ShieldCheck size={32} color={colors.primary} />
          <Text style={[TYPOGRAPHY.h1, { color: colors.text }]}>{APP_CONFIG.name}</Text>
        </View>
        <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
          {APP_CONFIG.tagline}
        </Text>
      </View>

      {/* Quota exhausted banner */}
      {isQuotaExhausted ? (
        <View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.sm }}>
          <View
            style={{
              backgroundColor: colors.warningMuted,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING.sm,
              borderWidth: 1,
              borderColor: colors.warning,
            }}
          >
            <AlertCircle size={18} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.text }]}>
                Free limit reached
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                You've used your 3 free scans this month. Upgrade to keep scanning.
              </Text>
            </View>
            <AnimatedPressable
              onPress={() => {
                console.log('[ScanScreen] upgrade banner pressed');
                showPaywall('quota_exhausted');
              }}
              accessibilityRole="button"
              accessibilityLabel="Upgrade plan"
              style={{
                backgroundColor: colors.primary,
                borderRadius: RADIUS.sm,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={[TYPOGRAPHY.label, { color: '#FFFFFF' }]}>
                Upgrade
              </Text>
            </AnimatedPressable>
          </View>
        </View>
      ) : null}

      {/* Hero */}
      <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.lg }}>
        <Text style={[TYPOGRAPHY.display, { color: colors.text, marginBottom: SPACING.sm }]}>
          {APP_CONFIG.pitch}
        </Text>
        <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
          Check a Marketplace listing, rental or deposit request for red flags. Then make the seller prove they really have it.
        </Text>
      </View>

      {/* Scan action cards */}
      <View style={{ paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.xl }}>
        <ScanActionCard
          icon={Camera}
          title="Scan a listing"
          description="Screenshot the listing, chat or payment request and get a 0–100 risk score."
          onPress={handleScanScreenshot}
          index={0}
        />
        <ScanActionCard
          icon={Link}
          title="Paste a link or message"
          description="Paste the listing link or what the seller sent you."
          onPress={handlePasteText}
          index={1}
        />
        <ScanActionCard
          icon={BadgeCheck}
          title="Request verification before I pay"
          description="Send the seller a live camera challenge that proves they have the item."
          onPress={handleRequestProof}
          index={2}
        />
        <ScanActionCard
          icon={KeyRound}
          title="Selling? Enter a proof code"
          description="A buyer sent you a code. Answer their challenge to show you have the item."
          onPress={handleEnterProofCode}
          index={3}
        />
      </View>

      {/* How it works */}
      <View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.xl }}>
        <SectionHeader title="How it works" />
        <InfoCard>
          {[
            {
              num: '1',
              title: 'Upload the listing',
              desc: 'A screenshot, link or message from the seller.',
            },
            {
              num: '2',
              title: 'Check the risks',
              desc: 'See a 0–100 risk score and the red flags we found.',
            },
            {
              num: '3',
              title: 'Make the seller prove it',
              desc: 'They get a random live challenge: a code word, an object and a camera angle, with 10 minutes to answer.',
            },
            {
              num: '4',
              title: 'Get your Proof Receipt',
              desc: 'See what they proved before you pay. The receipt expires after 24 hours.',
            },
          ].map((step, i) => (
            <View key={step.num}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: SPACING.md,
                  paddingVertical: i === 0 ? 0 : SPACING.md,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.divider,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: RADIUS.full,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Text style={[TYPOGRAPHY.label, { color: '#FFFFFF' }]}>{step.num}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.text, marginBottom: 2 }]}>
                    {step.title}
                  </Text>
                  <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                    {step.desc}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </InfoCard>
        <Text style={[TYPOGRAPHY.caption, { color: colors.textTertiary, textAlign: 'center', marginTop: SPACING.md }]}>
          Built for Marketplace electronics, rentals and vehicle deposits.
        </Text>
      </View>

      {/* Legal disclaimer */}
      <View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.lg }}>
        <LegalDisclaimerCard />
      </View>
    </ScrollView>
  );
}
