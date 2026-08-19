import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Star, Zap, Shield, BarChart3 } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import {
  trackPaywallViewed,
  trackPurchaseStarted,
  trackPurchaseCompleted,
  trackPurchaseFailed,
  trackRestoreCompleted,
} from '@/services/analytics';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/constants/theme';
import { InfoCard } from '@/components/InfoCard';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { PrimaryButton, SecondaryButton } from '@/components/PrimaryButton';
import { Divider } from '@/components/Divider';

type Period = 'monthly' | 'annual';

interface PlanConfig {
  id: string;
  name: string;
  entitlement: string;
  monthlyPrice: string;
  annualPrice: string;
  annualMonthlyEquiv: string;
  annualSavings: string;
  monthlyProductId: string;
  annualProductId: string;
  features: string[];
  popular?: boolean;
}

const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    entitlement: 'free',
    monthlyPrice: '$0',
    annualPrice: '$0',
    annualMonthlyEquiv: '$0',
    annualSavings: '',
    monthlyProductId: '',
    annualProductId: '',
    features: [
      '2 assessments / month',
      '1 Proof Request / month',
      '7-day scan history',
      'Device-generated analysis',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    entitlement: 'plus',
    monthlyPrice: '$14.99',
    annualPrice: '$99.99',
    annualMonthlyEquiv: '$8.33',
    annualSavings: 'Save 44%',
    monthlyProductId: 'invisiproof_plus_monthly',
    annualProductId: 'invisiproof_plus_annual',
    features: [
      '25 assessments / month',
      '8 Proof Requests / month',
      '90-day scan history',
      'Device-generated analysis',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    entitlement: 'pro',
    monthlyPrice: '$34.99',
    annualPrice: '$249.99',
    annualMonthlyEquiv: '$20.83',
    annualSavings: 'Save 40%',
    monthlyProductId: 'invisiproof_pro_monthly',
    annualProductId: 'invisiproof_pro_annual',
    features: [
      '150 assessments / month',
      '50 Proof Requests / month',
      'Unlimited scan history',
      'Server-verified analysis',
    ],
    popular: true,
  },
  {
    id: 'max',
    name: 'Max',
    entitlement: 'max',
    monthlyPrice: '$79.99',
    annualPrice: '$599.99',
    annualMonthlyEquiv: '$49.99',
    annualSavings: 'Save 38%',
    monthlyProductId: 'invisiproof_max_monthly',
    annualProductId: 'invisiproof_max_annual',
    features: [
      'Fair-use unlimited assessments',
      '250 Proof Requests / month',
      'Unlimited scan history',
      'Server-verified analysis',
    ],
  },
];

interface PlanCardProps {
  plan: PlanConfig;
  period: Period;
  isCurrentPlan: boolean;
  onSubscribe: (plan: PlanConfig) => void;
  subscribing: boolean;
}

function PlanCard({ plan, period, isCurrentPlan, onSubscribe, subscribing }: PlanCardProps) {
  const { colors } = useAppTheme();

  const priceDisplay = period === 'annual' ? plan.annualMonthlyEquiv : plan.monthlyPrice;
  const billingNote = period === 'annual' && plan.id !== 'free'
    ? `Billed ${plan.annualPrice}/yr`
    : plan.id !== 'free'
    ? 'Billed monthly'
    : 'Always free';

  const isFree = plan.id === 'free';
  const borderColor = plan.popular ? colors.primary : isCurrentPlan ? colors.evidence : colors.border;
  const borderWidth = plan.popular || isCurrentPlan ? 2 : 1;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: RADIUS.lg,
        borderWidth,
        borderColor,
        overflow: 'hidden',
        boxShadow: plan.popular ? SHADOWS.md : SHADOWS.sm,
      } as any}
    >
      {/* Popular badge */}
      {plan.popular ? (
        <View
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 6,
            alignItems: 'center',
          }}
        >
          <Text style={[TYPOGRAPHY.label, { color: '#FFFFFF' }]}>
            MOST POPULAR
          </Text>
        </View>
      ) : null}

      <View style={{ padding: SPACING.md, gap: SPACING.sm }}>
        {/* Plan name + price */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View>
            <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>
              {plan.name}
            </Text>
            {period === 'annual' && plan.annualSavings ? (
              <View
                style={{
                  backgroundColor: colors.evidenceMuted,
                  borderRadius: 4,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  alignSelf: 'flex-start',
                  marginTop: 2,
                }}
              >
                <Text style={[TYPOGRAPHY.micro, { color: colors.evidence }]}>
                  {plan.annualSavings}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
              <Text style={[TYPOGRAPHY.h2, { color: colors.text }]}>
                {priceDisplay}
              </Text>
              {!isFree ? (
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                  /mo
                </Text>
              ) : null}
            </View>
            <Text style={[TYPOGRAPHY.micro, { color: colors.textTertiary }]}>
              {billingNote}
            </Text>
          </View>
        </View>

        <Divider />

        {/* Features */}
        <View style={{ gap: 6 }}>
          {plan.features.map((feature, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Check size={14} color={colors.evidence} />
              <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, flex: 1 }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        {isCurrentPlan ? (
          <View
            style={{
              backgroundColor: colors.evidenceMuted,
              borderRadius: RADIUS.sm,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.evidence }]}>
              Current Plan
            </Text>
          </View>
        ) : isFree ? (
          <SecondaryButton
            title="Start Free"
            onPress={() => {
              console.log('[SubscriptionScreen] start free pressed');
            }}
          />
        ) : (
          <PrimaryButton
            title={subscribing ? 'Processing…' : 'Subscribe'}
            onPress={() => {
              console.log('[SubscriptionScreen] subscribe pressed:', plan.id, period);
              onSubscribe(plan);
            }}
            loading={subscribing}
          />
        )}
      </View>
    </View>
  );
}

export default function SubscriptionScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { entitlement, loading: subLoading } = useSubscription();

  const [period, setPeriod] = useState<Period>('monthly');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    console.log('[SubscriptionScreen] screen viewed');
    trackPaywallViewed({ source: 'profile' });
  }, []);

  const handleSubscribe = async (plan: PlanConfig) => {
    if (!user) {
      console.log('[SubscriptionScreen] subscribe pressed but not authenticated');
      Alert.alert(
        'Sign in required',
        'Please sign in to subscribe.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/sign-in') },
        ]
      );
      return;
    }

    const productId = period === 'annual' ? plan.annualProductId : plan.monthlyProductId;
    console.log('[SubscriptionScreen] initiating purchase:', { plan: plan.id, period, productId });
    trackPurchaseStarted({ plan: plan.id, period });
    setSubscribing(true);

    try {
      if (Platform.OS === 'android') {
        const Purchases = require('react-native-purchases').default;
        console.log('[SubscriptionScreen] calling Purchases.purchaseProduct:', productId);
        const { customerInfo } = await Purchases.purchaseProduct(productId);
        const isActive = customerInfo.activeSubscriptions.includes(productId);
        console.log('[SubscriptionScreen] purchase result — isActive:', isActive, 'activeSubscriptions:', customerInfo.activeSubscriptions);
        if (isActive) {
          trackPurchaseCompleted({ plan: plan.id, period });
          Alert.alert('Subscribed!', `You are now on the ${plan.name} plan.`);
        }
      } else {
        // Web — Stripe checkout (coming soon)
        console.log('[SubscriptionScreen] web purchase attempted — not yet supported');
        Alert.alert(
          'Web Billing',
          'Web subscriptions are coming soon. Download the Android app to subscribe now.',
          [{ text: 'OK' }]
        );
        trackPurchaseFailed({ plan: plan.id, reason: 'web_not_supported' });
      }
    } catch (err: any) {
      if (!err?.userCancelled) {
        const reason = err?.message ?? 'unknown';
        console.log('[SubscriptionScreen] purchase failed:', reason);
        trackPurchaseFailed({ plan: plan.id, reason });
        Alert.alert('Purchase failed', 'Could not complete the purchase. Please try again.');
      } else {
        console.log('[SubscriptionScreen] purchase cancelled by user');
      }
    } finally {
      setSubscribing(false);
    }
  };

  const handleRestore = async () => {
    console.log('[SubscriptionScreen] restore purchases pressed');
    setSubscribing(true);
    try {
      if (Platform.OS === 'android') {
        const Purchases = require('react-native-purchases').default;
        console.log('[SubscriptionScreen] calling Purchases.restorePurchases');
        const customerInfo = await Purchases.restorePurchases();
        const hasActive = customerInfo.activeSubscriptions.length > 0;
        console.log('[SubscriptionScreen] restore result — hasActive:', hasActive, 'activeSubscriptions:', customerInfo.activeSubscriptions);
        trackRestoreCompleted({ restored: hasActive });
        Alert.alert(
          hasActive ? 'Purchases Restored' : 'Nothing to Restore',
          hasActive
            ? 'Your subscription has been restored.'
            : 'No active purchases found on this account.'
        );
      } else {
        console.log('[SubscriptionScreen] restore attempted on web — not supported');
        Alert.alert('Restore', 'Restore is only available on Android. Web billing coming soon.');
        trackRestoreCompleted({ restored: false });
      }
    } catch (err: any) {
      console.log('[SubscriptionScreen] restore failed:', err?.message);
      Alert.alert('Restore Failed', 'Could not restore purchases. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleManageSubscription = () => {
    console.log('[SubscriptionScreen] manage subscription pressed');
    Linking.openURL('https://play.google.com/store/account/subscriptions');
  };

  const handlePrivacyPolicy = () => {
    console.log('[SubscriptionScreen] privacy policy pressed');
    router.push('/(tabs)/(profile)/privacy-policy');
  };

  const handleTerms = () => {
    console.log('[SubscriptionScreen] terms pressed');
    router.push('/(tabs)/(profile)/terms-of-use');
  };

  if (subLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.lg,
        paddingBottom: insets.bottom + SPACING.xl,
        gap: SPACING.lg,
      }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={{ alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: SPACING.xs,
          }}
        >
          <Shield size={32} color={colors.primary} />
        </View>
        <Text style={[TYPOGRAPHY.h1, { color: colors.text, textAlign: 'center' }]}>
          Know the risk before you trust the situation.
        </Text>
        <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, textAlign: 'center', maxWidth: 320 }]}>
          Direct assessments analyze suspicious content with AI. Private Proof Requests let you request verified evidence from anyone before you proceed.
        </Text>
      </View>

      {/* Period toggle */}
      <View
        style={{
          backgroundColor: colors.surfaceSecondary,
          borderRadius: RADIUS.md,
          padding: 4,
          flexDirection: 'row',
          gap: 4,
        }}
      >
        {(['monthly', 'annual'] as Period[]).map(p => {
          const isActive = period === p;
          return (
            <AnimatedPressable
              key={p}
              onPress={() => {
                console.log('[SubscriptionScreen] period toggle pressed:', p);
                setPeriod(p);
              }}
              accessibilityRole="button"
              accessibilityLabel={p === 'monthly' ? 'Monthly billing' : 'Annual billing'}
              style={{
                flex: 1,
                backgroundColor: isActive ? colors.primary : 'transparent',
                borderRadius: RADIUS.sm,
                paddingVertical: 8,
                alignItems: 'center',
              }}
            >
              <Text style={[TYPOGRAPHY.bodyMedium, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}>
                {p === 'monthly' ? 'Monthly' : 'Annual'}
              </Text>
              {p === 'annual' && !isActive ? (
                <Text style={[TYPOGRAPHY.micro, { color: colors.evidence }]}>
                  Save up to 44%
                </Text>
              ) : null}
            </AnimatedPressable>
          );
        })}
      </View>

      {/* Plan cards */}
      <View style={{ gap: SPACING.md }}>
        {PLANS.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            period={period}
            isCurrentPlan={entitlement === plan.entitlement}
            onSubscribe={handleSubscribe}
            subscribing={subscribing}
          />
        ))}
      </View>

      {/* Restore + Manage links */}
      <View style={{ gap: SPACING.sm, alignItems: 'center' }}>
        <AnimatedPressable
          onPress={handleRestore}
          accessibilityRole="button"
          accessibilityLabel="Restore purchases"
        >
          <Text style={[TYPOGRAPHY.body, { color: colors.primary }]}>
            Restore Purchases
          </Text>
        </AnimatedPressable>
        <AnimatedPressable
          onPress={handleManageSubscription}
          accessibilityRole="button"
          accessibilityLabel="Manage subscription"
        >
          <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
            Manage Subscription
          </Text>
        </AnimatedPressable>
      </View>

      {/* Footer */}
      <InfoCard>
        <View style={{ gap: SPACING.sm }}>
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, textAlign: 'center', lineHeight: 18 }]}>
            Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. Manage or cancel your subscription in your Google Play account settings.
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: SPACING.md }}>
            <AnimatedPressable
              onPress={handlePrivacyPolicy}
              accessibilityRole="button"
              accessibilityLabel="Privacy Policy"
            >
              <Text style={[TYPOGRAPHY.caption, { color: colors.primary }]}>
                Privacy Policy
              </Text>
            </AnimatedPressable>
            <Text style={[TYPOGRAPHY.caption, { color: colors.textTertiary }]}>·</Text>
            <AnimatedPressable
              onPress={handleTerms}
              accessibilityRole="button"
              accessibilityLabel="Terms of Use"
            >
              <Text style={[TYPOGRAPHY.caption, { color: colors.primary }]}>
                Terms of Use
              </Text>
            </AnimatedPressable>
          </View>
        </View>
      </InfoCard>
    </ScrollView>
  );
}
