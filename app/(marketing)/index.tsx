import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { DARK_COLORS, LIGHT_COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

type PricingPeriod = 'monthly' | 'annual';

// ─── Data ────────────────────────────────────────────────────────────────────

const PAIN_POINTS = [
  'A screenshot can look convincing. A message can sound urgent. A link can feel legitimate. That still does not tell you what risks are hidden.',
  'The worst time to evaluate a claim is after money, credentials, or private information have already been sent.',
  'Ordinary "send me a screenshot" verification creates another problem: the evidence may contain information the other person should not have to reveal.',
];

const DIRECT_FEATURES = [
  {
    icon: '🖼',
    title: 'Analyze Images',
    description: 'Upload screenshots or photos for risk signal analysis',
  },
  {
    icon: '💬',
    title: 'Analyze Messages',
    description: 'Paste suspicious text or messages for assessment',
  },
  {
    icon: '🔗',
    title: 'Analyze URLs',
    description: 'Submit links for risk analysis without the app visiting them',
  },
];

const PROOF_STEPS = [
  {
    number: '1',
    icon: '📤',
    title: 'Request proof',
    description: 'Create a Proof Request and share the link or code with the other person.',
  },
  {
    number: '2',
    icon: '🔒',
    title: 'They submit privately',
    description: 'The respondent reviews the consent notice and submits their evidence privately.',
  },
  {
    number: '3',
    icon: '🔍',
    title: 'InvisiProof assesses the evidence',
    description: 'The submitted content is analyzed for risk signals using the same process as direct assessments.',
  },
  {
    number: '4',
    icon: '📊',
    title: 'You receive the result',
    description: 'You see the risk assessment — not automatically the raw evidence.',
  },
];

const USE_CASES = [
  {
    icon: '🛒',
    title: 'Suspicious marketplace transaction',
    description: 'A seller claims the item is authentic. Ask for proof before sending payment.',
  },
  {
    icon: '💼',
    title: 'Job or recruiter message',
    description: 'An offer sounds too good. Evaluate the message for urgency patterns and impersonation signals.',
  },
  {
    icon: '🏠',
    title: 'Rental claim',
    description: 'A landlord claims ownership. Request supporting documentation and receive a risk assessment.',
  },
  {
    icon: '💸',
    title: 'Payment request',
    description: 'Someone is asking for money urgently. Analyze the message before acting.',
  },
  {
    icon: '🌐',
    title: 'Unfamiliar URL',
    description: 'A link arrived in a message. Analyze the URL structure without visiting it.',
  },
  {
    icon: '👤',
    title: 'Relationship or identity claim',
    description: 'Someone claims to be who they say they are. Request evidence and receive only the assessment.',
  },
];

const PRIVACY_PILLARS = [
  {
    icon: '🗄',
    title: 'Private storage',
    description: 'Evidence is stored with scoped access controls. Other users cannot read your submissions.',
  },
  {
    icon: '📋',
    title: 'Result-only disclosure',
    description: 'Requesters receive the risk assessment. They do not automatically receive the raw evidence.',
  },
  {
    icon: '🗑',
    title: 'Deletion controls',
    description: 'Delete individual submissions or your entire account at any time.',
  },
  {
    icon: '📵',
    title: 'Analytics exclusions',
    description: 'Submitted images, text, URLs, and messages are never included in analytics events.',
  },
];

const PLANS_MONTHLY = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    features: ['2 assessments/mo', '1 Proof Request/mo', '7-day history'],
    popular: false,
    cta: 'Get Started',
  },
  {
    name: 'Plus',
    price: '$14.99',
    period: '/mo',
    features: ['25 assessments/mo', '8 Proof Requests/mo', '90-day history', 'Priority support'],
    popular: false,
    cta: 'Start Plus',
  },
  {
    name: 'Pro',
    price: '$34.99',
    period: '/mo',
    features: ['150 assessments/mo', '50 Proof Requests/mo', 'Unlimited history', 'BYOK support', 'Priority support'],
    popular: true,
    cta: 'Start Pro',
  },
  {
    name: 'Max',
    price: '$79.99',
    period: '/mo',
    features: ['Fair-use unlimited', '250 Proof Requests/mo', 'Unlimited history', 'BYOK support', 'Priority support'],
    popular: false,
    cta: 'Start Max',
  },
];

const PLANS_ANNUAL = [
  {
    name: 'Free',
    price: '$0',
    period: '/yr',
    features: ['2 assessments/mo', '1 Proof Request/mo', '7-day history'],
    popular: false,
    cta: 'Get Started',
    savings: null,
  },
  {
    name: 'Plus',
    price: '$99.99',
    period: '/yr',
    features: ['25 assessments/mo', '8 Proof Requests/mo', '90-day history', 'Priority support'],
    popular: false,
    cta: 'Start Plus',
    savings: 'Save $79.89/yr',
  },
  {
    name: 'Pro',
    price: '$249.99',
    period: '/yr',
    features: ['150 assessments/mo', '50 Proof Requests/mo', 'Unlimited history', 'BYOK support', 'Priority support'],
    popular: true,
    cta: 'Start Pro',
    savings: 'Save $169.89/yr',
  },
  {
    name: 'Max',
    price: '$599.99',
    period: '/yr',
    features: ['Fair-use unlimited', '250 Proof Requests/mo', 'Unlimited history', 'BYOK support', 'Priority support'],
    popular: false,
    cta: 'Start Max',
    savings: 'Save $359.89/yr',
  },
];

const FAQS = [
  {
    q: 'What does InvisiProof actually assess?',
    a: 'InvisiProof analyzes observable signals in submitted images, text, and URLs. For images, it looks for visual inconsistencies and patterns. For text, it looks for linguistic patterns associated with fraud or deception. For URLs, it analyzes the structure and domain patterns without visiting the URL from your device.',
  },
  {
    q: 'What is a Proof Request?',
    a: 'A Proof Request is a two-party workflow. You create a request and share a link with someone. They submit evidence privately. You receive only the risk assessment result — not automatically the raw evidence they submitted.',
  },
  {
    q: 'Does the requester see the evidence I submit?',
    a: 'No. When you respond to a Proof Request, the requester receives the risk assessment result. They do not automatically receive your raw images, text, or files.',
  },
  {
    q: 'Are results guaranteed to be accurate?',
    a: 'No. InvisiProof provides risk assessments based on observable signals. Results are not verdicts, legal evidence, or guarantees of safety or harm. Always use results as one input among many.',
  },
  {
    q: 'Can I use my own AI provider (BYOK)?',
    a: 'Yes, on Pro and Max plans. Go to Profile → AI Provider to configure your own API key.',
  },
  {
    q: 'Can I delete my data?',
    a: 'Yes. You can delete individual submissions from your scan history at any time. You can also delete your entire account from Profile → Delete Account.',
  },
  {
    q: 'How do subscriptions work?',
    a: 'Subscriptions are billed monthly or annually through the App Store (iOS) or Google Play (Android). You can upgrade, downgrade, or cancel at any time.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Refund requests are handled by Apple (iOS) or Google (Android). InvisiProof cannot issue refunds directly.',
  },
  {
    q: 'How do I contact support?',
    a: 'Email support@invisiproof.com. We aim to respond within 2 business days.',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavBar({ colors, onStartFree }: { colors: typeof DARK_COLORS; onStartFree: () => void }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const handleHowItWorks = useCallback(() => {
    console.log('[Landing] Nav: How It Works tapped');
  }, []);

  const handleUseCases = useCallback(() => {
    console.log('[Landing] Nav: Use Cases tapped');
  }, []);

  const handlePrivacy = useCallback(() => {
    console.log('[Landing] Nav: Privacy tapped');
  }, []);

  const handlePricing = useCallback(() => {
    console.log('[Landing] Nav: Pricing tapped');
  }, []);

  return (
    <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <Text style={[styles.navLogo, { color: colors.primary }]}>InvisiProof</Text>
      {isWide && (
        <View style={styles.navLinks}>
          <Pressable onPress={handleHowItWorks} style={styles.navLink}>
            <Text style={[styles.navLinkText, { color: colors.textSecondary }]}>How It Works</Text>
          </Pressable>
          <Pressable onPress={handleUseCases} style={styles.navLink}>
            <Text style={[styles.navLinkText, { color: colors.textSecondary }]}>Use Cases</Text>
          </Pressable>
          <Pressable onPress={handlePrivacy} style={styles.navLink}>
            <Text style={[styles.navLinkText, { color: colors.textSecondary }]}>Privacy</Text>
          </Pressable>
          <Pressable onPress={handlePricing} style={styles.navLink}>
            <Text style={[styles.navLinkText, { color: colors.textSecondary }]}>Pricing</Text>
          </Pressable>
        </View>
      )}
      <Pressable
        onPress={onStartFree}
        style={[styles.navCta, { backgroundColor: colors.primary }]}
      >
        <Text style={[styles.navCtaText, { color: '#FFFFFF' }]}>Start Free</Text>
      </Pressable>
    </View>
  );
}

function SectionLabel({ text, colors }: { text: string; colors: typeof DARK_COLORS }) {
  return (
    <Text style={[styles.sectionLabel, { color: colors.primary }]}>{text}</Text>
  );
}

function PainCard({ text, colors }: { text: string; colors: typeof DARK_COLORS }) {
  return (
    <View style={[styles.painCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.painCardText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  colors,
}: {
  icon: string;
  title: string;
  description: string;
  colors: typeof DARK_COLORS;
}) {
  return (
    <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={styles.featureCardIcon}>{icon}</Text>
      <Text style={[styles.featureCardTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.featureCardDesc, { color: colors.textSecondary }]}>{description}</Text>
    </View>
  );
}

function ProofStepCard({
  number,
  icon,
  title,
  description,
  colors,
}: {
  number: string;
  icon: string;
  title: string;
  description: string;
  colors: typeof DARK_COLORS;
}) {
  return (
    <View style={[styles.proofStepCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.proofStepNumber, { backgroundColor: colors.primaryMuted }]}>
        <Text style={[styles.proofStepNumberText, { color: colors.primary }]}>{number}</Text>
      </View>
      <Text style={styles.proofStepIcon}>{icon}</Text>
      <Text style={[styles.proofStepTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.proofStepDesc, { color: colors.textSecondary }]}>{description}</Text>
    </View>
  );
}

function UseCaseCard({
  icon,
  title,
  description,
  colors,
}: {
  icon: string;
  title: string;
  description: string;
  colors: typeof DARK_COLORS;
}) {
  return (
    <View style={[styles.useCaseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={styles.useCaseIcon}>{icon}</Text>
      <Text style={[styles.useCaseTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.useCaseDesc, { color: colors.textSecondary }]}>{description}</Text>
    </View>
  );
}

function PrivacyPillarCard({
  icon,
  title,
  description,
  colors,
}: {
  icon: string;
  title: string;
  description: string;
  colors: typeof DARK_COLORS;
}) {
  return (
    <View style={[styles.privacyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={styles.privacyCardIcon}>{icon}</Text>
      <Text style={[styles.privacyCardTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.privacyCardDesc, { color: colors.textSecondary }]}>{description}</Text>
    </View>
  );
}

function PlanCard({
  plan,
  colors,
  onPress,
}: {
  plan: (typeof PLANS_MONTHLY)[0] & { savings?: string | null };
  colors: typeof DARK_COLORS;
  onPress: () => void;
}) {
  const borderColor = plan.popular ? colors.primary : colors.border;
  const bgColor = plan.popular ? colors.primaryMuted : colors.surface;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.planCard, { backgroundColor: bgColor, borderColor }]}
    >
      {plan.popular && (
        <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
        </View>
      )}
      <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
      <View style={styles.planPriceRow}>
        <Text style={[styles.planPrice, { color: colors.text }]}>{plan.price}</Text>
        <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>{plan.period}</Text>
      </View>
      {'savings' in plan && plan.savings ? (
        <Text style={[styles.planSavings, { color: colors.primary }]}>{plan.savings}</Text>
      ) : null}
      <View style={styles.planFeatures}>
        {plan.features.map((f) => (
          <View key={f} style={styles.planFeatureRow}>
            <Text style={[styles.planFeatureCheck, { color: colors.primary }]}>✓</Text>
            <Text style={[styles.planFeatureText, { color: colors.textSecondary }]}>{f}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.planCta, { backgroundColor: plan.popular ? colors.primary : colors.surfaceSecondary }]}>
        <Text style={[styles.planCtaText, { color: plan.popular ? '#FFFFFF' : colors.text }]}>{plan.cta}</Text>
      </View>
    </Pressable>
  );
}

function FaqItem({
  q,
  a,
  colors,
}: {
  q: string;
  a: string;
  colors: typeof DARK_COLORS;
}) {
  const [open, setOpen] = useState(false);

  const handleToggle = useCallback(() => {
    console.log(`[Landing] FAQ toggled: "${q.slice(0, 40)}..."`);
    setOpen((prev) => !prev);
  }, [q]);

  return (
    <Pressable
      onPress={handleToggle}
      style={[styles.faqItem, { borderBottomColor: colors.border }]}
    >
      <View style={styles.faqHeader}>
        <Text style={[styles.faqQuestion, { color: colors.text }]}>{q}</Text>
        <Text style={[styles.faqChevron, { color: colors.textSecondary }]}>{open ? '−' : '+'}</Text>
      </View>
      {open && (
        <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{a}</Text>
      )}
    </Pressable>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const { isDark } = useAppTheme();
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const [pricingPeriod, setPricingPeriod] = useState<PricingPeriod>('monthly');

  const plans = pricingPeriod === 'monthly' ? PLANS_MONTHLY : PLANS_ANNUAL;

  const handleStartFree = useCallback(() => {
    console.log('[Landing] CTA: Start Free tapped');
    if (Platform.OS === 'web') {
      window.location.href = '/sign-up';
    }
  }, []);

  const handleSeeHowProofWorks = useCallback(() => {
    console.log('[Landing] CTA: See How Proof Requests Work tapped');
  }, []);

  const handlePrivacyDocs = useCallback(() => {
    console.log('[Landing] Privacy: docs link tapped');
    if (Platform.OS === 'web') {
      window.open('https://docs.invisiproof.com/privacy/data-flow', '_blank');
    }
  }, []);

  const handlePlanCta = useCallback((planName: string) => {
    console.log(`[Landing] Pricing: plan CTA tapped — ${planName}`);
    if (Platform.OS === 'web') {
      window.location.href = '/sign-up';
    }
  }, []);

  const handlePricingToggle = useCallback((period: PricingPeriod) => {
    console.log(`[Landing] Pricing toggle: ${period}`);
    setPricingPeriod(period);
  }, []);

  const handleFooterLink = useCallback((label: string, url: string) => {
    console.log(`[Landing] Footer: ${label} tapped`);
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    }
  }, []);

  const handleFinalCta = useCallback(() => {
    console.log('[Landing] Final CTA: Start with InvisiProof tapped');
    if (Platform.OS === 'web') {
      window.location.href = '/sign-up';
    }
  }, []);

  const containerBg = isDark ? DARK_COLORS.background : LIGHT_COLORS.background;
  const numColumns = isWide ? 3 : 1;
  const numColumns2 = isWide ? 2 : 1;
  const numColumns4 = isWide ? 4 : 1;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: containerBg }]}
      contentContainerStyle={styles.rootContent}
      showsVerticalScrollIndicator={false}
    >
      {/* NAV */}
      <NavBar colors={colors} onStartFree={handleStartFree} />

      {/* HERO */}
      <View style={[styles.section, styles.heroSection, { backgroundColor: containerBg }]}>
        <View style={[styles.contentWrap, isWide && styles.contentWrapWide]}>
          <SectionLabel text="PRIVATE RISK VERIFICATION" colors={colors} />
          <Text style={[styles.heroHeadline, { color: colors.text }]}>
            When something feels off, ask for proof without asking them to expose everything.
          </Text>
          <Text style={[styles.heroSubhead, { color: colors.textSecondary }]}>
            InvisiProof analyzes suspicious images, messages, and URLs—and lets another person submit evidence privately so you can receive a risk assessment without automatically receiving the raw evidence.
          </Text>
          <View style={styles.heroCtas}>
            <Pressable
              onPress={handleStartFree}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.primaryBtnText}>Start Free</Text>
            </Pressable>
            <Pressable onPress={handleSeeHowProofWorks} style={styles.secondaryBtn}>
              <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                See How Proof Requests Work →
              </Text>
            </Pressable>
          </View>
          <Text style={[styles.heroTrust, { color: colors.textTertiary }]}>
            Privacy-first workflow • Clear limitations • You control what you submit
          </Text>
        </View>
      </View>

      {/* PAIN */}
      <View style={[styles.section, { backgroundColor: colors.surfaceSecondary }]}>
        <View style={[styles.contentWrap, isWide && styles.contentWrapWide]}>
          <SectionLabel text="THE PROBLEM" colors={colors} />
          <Text style={[styles.sectionHeadline, { color: colors.text }]}>
            The risk is already there before you realize it.
          </Text>
          <View style={[styles.grid, { gap: SPACING.md }]}>
            {PAIN_POINTS.map((text, i) => (
              <View
                key={i}
                style={[
                  styles.gridItem,
                  numColumns === 3 && styles.gridItem3,
                ]}
              >
                <PainCard text={text} colors={colors} />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* DIRECT ASSESSMENTS */}
      <View style={[styles.section, { backgroundColor: containerBg }]}>
        <View style={[styles.contentWrap, isWide && styles.contentWrapWide]}>
          <SectionLabel text="DIRECT ASSESSMENTS" colors={colors} />
          <Text style={[styles.sectionHeadline, { color: colors.text }]}>
            Analyze suspicious content directly.
          </Text>
          <Text style={[styles.sectionSubhead, { color: colors.textSecondary }]}>
            Submit images, messages, or URLs and receive a risk assessment with observable signals, warning indicators, and recommended next steps.
          </Text>
          <View style={[styles.grid, { gap: SPACING.md }]}>
            {DIRECT_FEATURES.map((f) => (
              <View
                key={f.title}
                style={[
                  styles.gridItem,
                  numColumns === 3 && styles.gridItem3,
                ]}
              >
                <FeatureCard
                  icon={f.icon}
                  title={f.title}
                  description={f.description}
                  colors={colors}
                />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* PROOF REQUEST */}
      <View style={[styles.section, { backgroundColor: colors.surfaceSecondary }]}>
        <View style={[styles.contentWrap, isWide && styles.contentWrapWide]}>
          <SectionLabel text="PROOF REQUESTS" colors={colors} />
          <Text style={[styles.sectionHeadline, { color: colors.text }]}>
            Ask for evidence without receiving everything.
          </Text>
          <Text style={[styles.sectionSubhead, { color: colors.textSecondary }]}>
            The two-party workflow that separates the evidence from the result. The respondent submits privately. You receive only the risk assessment.
          </Text>
          <View style={[styles.grid, { gap: SPACING.md }]}>
            {PROOF_STEPS.map((step) => (
              <View
                key={step.number}
                style={[
                  styles.gridItem,
                  numColumns4 === 4 && styles.gridItem4,
                ]}
              >
                <ProofStepCard
                  number={step.number}
                  icon={step.icon}
                  title={step.title}
                  description={step.description}
                  colors={colors}
                />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* USE CASES */}
      <View style={[styles.section, { backgroundColor: containerBg }]}>
        <View style={[styles.contentWrap, isWide && styles.contentWrapWide]}>
          <SectionLabel text="USE CASES" colors={colors} />
          <Text style={[styles.sectionHeadline, { color: colors.text }]}>
            When to use InvisiProof.
          </Text>
          <Text style={[styles.sectionSubhead, { color: colors.textSecondary }]}>
            These are examples. InvisiProof is designed for any situation where you want to evaluate a claim before acting on it.
          </Text>
          <View style={[styles.grid, { gap: SPACING.md }]}>
            {USE_CASES.map((uc) => (
              <View
                key={uc.title}
                style={[
                  styles.gridItem,
                  numColumns === 3 && styles.gridItem3,
                ]}
              >
                <UseCaseCard
                  icon={uc.icon}
                  title={uc.title}
                  description={uc.description}
                  colors={colors}
                />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* PRIVACY */}
      <View style={[styles.section, { backgroundColor: colors.surfaceSecondary }]}>
        <View style={[styles.contentWrap, isWide && styles.contentWrapWide]}>
          <SectionLabel text="PRIVACY" colors={colors} />
          <Text style={[styles.sectionHeadline, { color: colors.text }]}>
            Privacy is the product, not a feature.
          </Text>
          <Text style={[styles.sectionSubhead, { color: colors.textSecondary }]}>
            InvisiProof is built around the principle that you should be able to evaluate risk without creating new privacy problems.
          </Text>
          <View style={[styles.grid, { gap: SPACING.md }]}>
            {PRIVACY_PILLARS.map((p) => (
              <View
                key={p.title}
                style={[
                  styles.gridItem,
                  numColumns2 === 2 && styles.gridItem2,
                ]}
              >
                <PrivacyPillarCard
                  icon={p.icon}
                  title={p.title}
                  description={p.description}
                  colors={colors}
                />
              </View>
            ))}
          </View>
          <Pressable onPress={handlePrivacyDocs} style={styles.privacyDocsLink}>
            <Text style={[styles.privacyDocsLinkText, { color: colors.primary }]}>
              Read the full privacy documentation →
            </Text>
          </Pressable>
        </View>
      </View>

      {/* PRICING */}
      <View style={[styles.section, { backgroundColor: containerBg }]}>
        <View style={[styles.contentWrap, isWide && styles.contentWrapWide]}>
          <SectionLabel text="PRICING" colors={colors} />
          <Text style={[styles.sectionHeadline, { color: colors.text }]}>
            Start free. Upgrade when you need more.
          </Text>

          {/* Toggle */}
          <View style={[styles.pricingToggle, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Pressable
              onPress={() => handlePricingToggle('monthly')}
              style={[
                styles.pricingToggleBtn,
                pricingPeriod === 'monthly' && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.pricingToggleBtnText,
                  { color: pricingPeriod === 'monthly' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Monthly
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handlePricingToggle('annual')}
              style={[
                styles.pricingToggleBtn,
                pricingPeriod === 'annual' && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.pricingToggleBtnText,
                  { color: pricingPeriod === 'annual' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Annual
              </Text>
            </Pressable>
          </View>

          <View style={[styles.grid, { gap: SPACING.md }]}>
            {plans.map((plan) => (
              <View
                key={plan.name}
                style={[
                  styles.gridItem,
                  numColumns4 === 4 && styles.gridItem4,
                ]}
              >
                <PlanCard
                  plan={plan}
                  colors={colors}
                  onPress={() => handlePlanCta(plan.name)}
                />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* FAQ */}
      <View style={[styles.section, { backgroundColor: colors.surfaceSecondary }]}>
        <View style={[styles.contentWrap, isWide && styles.contentWrapWide]}>
          <SectionLabel text="FAQ" colors={colors} />
          <Text style={[styles.sectionHeadline, { color: colors.text }]}>
            Common questions.
          </Text>
          <View style={[styles.faqList, { borderTopColor: colors.border }]}>
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} colors={colors} />
            ))}
          </View>
        </View>
      </View>

      {/* FINAL CTA */}
      <View style={[styles.section, styles.finalCtaSection, { backgroundColor: colors.primary }]}>
        <View style={[styles.contentWrap, isWide && styles.contentWrapWide, styles.finalCtaContent]}>
          <Text style={styles.finalCtaHeadline}>
            Before you trust the claim, verify the risk.
          </Text>
          <Pressable
            onPress={handleFinalCta}
            style={[styles.finalCtaBtn, { backgroundColor: '#FFFFFF' }]}
          >
            <Text style={[styles.finalCtaBtnText, { color: colors.primary }]}>
              Start with InvisiProof
            </Text>
          </Pressable>
        </View>
      </View>

      {/* FOOTER */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={[styles.contentWrap, isWide && styles.contentWrapWide]}>
          <Text style={[styles.footerTagline, { color: colors.textSecondary }]}>
            Request proof. Verify the risk. Protect the evidence.
          </Text>
          <View style={styles.footerLinks}>
            {[
              { label: 'Privacy Policy', url: 'https://docs.invisiproof.com/legal/privacy-policy' },
              { label: 'Terms', url: 'https://docs.invisiproof.com/legal/terms' },
              { label: 'Acceptable Use', url: 'https://docs.invisiproof.com/legal/acceptable-use' },
              { label: 'Support', url: 'mailto:support@invisiproof.com' },
              { label: 'Docs', url: 'https://docs.invisiproof.com' },
            ].map((link) => (
              <Pressable
                key={link.label}
                onPress={() => handleFooterLink(link.label, link.url)}
                style={styles.footerLink}
              >
                <Text style={[styles.footerLinkText, { color: colors.textSecondary }]}>
                  {link.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.footerCopyright, { color: colors.textTertiary }]}>
            © 2025 InvisiProof. All rights reserved.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rootContent: {
    flexGrow: 1,
  },

  // Nav
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    position: 'sticky' as any,
    top: 0,
    zIndex: 100,
  },
  navLogo: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  navLink: {
    paddingVertical: SPACING.xs,
  },
  navLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  navCta: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  navCtaText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Layout
  section: {
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
  },
  heroSection: {
    paddingTop: SPACING.xxxl + SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  contentWrap: {
    width: '100%',
  },
  contentWrapWide: {
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
  },

  // Section labels
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  sectionHeadline: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 36,
    marginBottom: SPACING.md,
  },
  sectionSubhead: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: SPACING.xl,
  },

  // Hero
  heroHeadline: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 46,
    marginBottom: SPACING.md,
    maxWidth: 700,
  },
  heroSubhead: {
    fontSize: 17,
    lineHeight: 28,
    marginBottom: SPACING.xl,
    maxWidth: 640,
  },
  heroCtas: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  heroTrust: {
    fontSize: 13,
    lineHeight: 20,
  },

  // Buttons
  primaryBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: SPACING.md,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '100%',
  },
  gridItem2: {
    width: '48%',
    marginRight: '2%',
  },
  gridItem3: {
    width: '31%',
    marginRight: '2%',
  },
  gridItem4: {
    width: '23%',
    marginRight: '2%',
  },

  // Pain cards
  painCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  painCardText: {
    fontSize: 15,
    lineHeight: 24,
  },

  // Feature cards
  featureCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'flex-start',
  },
  featureCardIcon: {
    fontSize: 28,
    marginBottom: SPACING.sm,
  },
  featureCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  featureCardDesc: {
    fontSize: 14,
    lineHeight: 22,
  },

  // Proof steps
  proofStepCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'flex-start',
  },
  proofStepNumber: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  proofStepNumberText: {
    fontSize: 13,
    fontWeight: '800',
  },
  proofStepIcon: {
    fontSize: 24,
    marginBottom: SPACING.sm,
  },
  proofStepTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  proofStepDesc: {
    fontSize: 14,
    lineHeight: 22,
  },

  // Use cases
  useCaseCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  useCaseIcon: {
    fontSize: 24,
    marginBottom: SPACING.sm,
  },
  useCaseTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  useCaseDesc: {
    fontSize: 14,
    lineHeight: 22,
  },

  // Privacy
  privacyCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  privacyCardIcon: {
    fontSize: 24,
    marginBottom: SPACING.sm,
  },
  privacyCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  privacyCardDesc: {
    fontSize: 14,
    lineHeight: 22,
  },
  privacyDocsLink: {
    marginTop: SPACING.md,
  },
  privacyDocsLinkText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Pricing
  pricingToggle: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    padding: 3,
    marginBottom: SPACING.xl,
  },
  pricingToggleBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  pricingToggleBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  planCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.xs,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  planPeriod: {
    fontSize: 14,
    marginLeft: 3,
  },
  planSavings: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  planFeatures: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  planFeatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  planFeatureCheck: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  planFeatureText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  planCta: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  planCtaText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // FAQ
  faqList: {
    borderTopWidth: 1,
  },
  faqItem: {
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    lineHeight: 24,
  },
  faqChevron: {
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 24,
  },
  faqAnswer: {
    fontSize: 15,
    lineHeight: 24,
    marginTop: SPACING.md,
  },

  // Final CTA
  finalCtaSection: {
    paddingVertical: SPACING.xxxl + SPACING.lg,
  },
  finalCtaContent: {
    alignItems: 'center',
  },
  finalCtaHeadline: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 40,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    maxWidth: 560,
  },
  finalCtaBtn: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },
  finalCtaBtnText: {
    fontSize: 17,
    fontWeight: '700',
  },

  // Footer
  footer: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderTopWidth: 1,
  },
  footerTagline: {
    fontSize: 14,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  footerLink: {
    paddingVertical: SPACING.xs,
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footerCopyright: {
    fontSize: 12,
    textAlign: 'center',
  },
});
