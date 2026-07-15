import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Inbox, CheckCircle, Clock } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { EmptyStateCard } from '@/components/EmptyStateCard';
import { AnimatedPressable } from '@/components/AnimatedPressable';

type Segment = 'sent' | 'received' | 'completed' | 'expired';

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: 'sent', label: 'Sent' },
  { key: 'received', label: 'Received' },
  { key: 'completed', label: 'Completed' },
  { key: 'expired', label: 'Expired' },
];

const EMPTY_STATES: Record<
  Segment,
  { icon: React.ComponentType<{ size: number; color: string }>; title: string; subtitle: string }
> = {
  sent: {
    icon: Send,
    title: 'No sent requests',
    subtitle: 'Requests you create will appear here.',
  },
  received: {
    icon: Inbox,
    title: 'No received requests',
    subtitle: 'Requests sent to your account will appear here.',
  },
  completed: {
    icon: CheckCircle,
    title: 'No completed requests',
    subtitle: 'Completed verification requests will appear here.',
  },
  expired: {
    icon: Clock,
    title: 'No expired requests',
    subtitle: 'Expired or cancelled requests will appear here.',
  },
};

function FadeInView({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <Animated.View style={{ opacity, flex: 1 }}>{children}</Animated.View>;
}

export default function RequestsScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [activeSegment, setActiveSegment] = useState<Segment>('sent');

  const handleSegmentPress = (key: Segment) => {
    console.log('[RequestsScreen] segment changed:', key);
    setActiveSegment(key);
  };

  const emptyState = EMPTY_STATES[activeSegment];

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
          paddingBottom: SPACING.lg,
        }}
      >
        <Text style={[TYPOGRAPHY.h1, { color: colors.text, marginBottom: SPACING.xs }]}>
          Proof Requests
        </Text>
        <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
          Request evidence from another person before continuing a transaction.
        </Text>
      </View>

      {/* Segmented control */}
      <View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.lg }}>
        <View
          style={{
            backgroundColor: colors.surfaceSecondary,
            borderRadius: RADIUS.md,
            padding: SPACING.xs,
            flexDirection: 'row',
            gap: 4,
          }}
        >
          {SEGMENTS.map(seg => {
            const isActive = activeSegment === seg.key;
            return (
              <AnimatedPressable
                key={seg.key}
                onPress={() => handleSegmentPress(seg.key)}
                accessibilityRole="button"
                accessibilityLabel={seg.label}
                style={{
                  flex: 1,
                  backgroundColor: isActive ? colors.primary : 'transparent',
                  borderRadius: RADIUS.sm,
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={[
                    TYPOGRAPHY.label,
                    {
                      color: isActive ? '#FFFFFF' : colors.textSecondary,
                      textAlign: 'center',
                    },
                  ]}
                >
                  {seg.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>
      </View>

      {/* Empty state */}
      <FadeInView key={activeSegment}>
        <View style={{ paddingHorizontal: SPACING.md }}>
          <EmptyStateCard
            icon={emptyState.icon}
            title={emptyState.title}
            subtitle={emptyState.subtitle}
          />
        </View>
      </FadeInView>
    </ScrollView>
  );
}
