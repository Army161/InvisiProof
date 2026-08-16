import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileSearch, Image, Type, Link, AlertCircle, Lock } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useSubscription, type Entitlement } from '@/hooks/useSubscription';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/constants/theme';
import { EmptyStateCard } from '@/components/EmptyStateCard';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { RiskLevelBadge } from '@/components/RiskLevelBadge';
import { InfoCard } from '@/components/InfoCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import type { Scan, InputType } from '@/types/scan';

function getHistoryDaysLimit(entitlement: Entitlement): number | null {
  if (entitlement === 'free') return 7;
  if (entitlement === 'plus') return 90;
  return null; // pro/max = unlimited
}

function getHistoryCutoffDate(entitlement: Entitlement): string | null {
  const days = getHistoryDaysLimit(entitlement);
  if (days === null) return null;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff.toISOString();
}

type FilterType = 'all' | InputType;

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'image', label: 'Image' },
  { key: 'text', label: 'Text' },
  { key: 'url', label: 'URL' },
];

const INPUT_ICONS: Record<InputType, React.ComponentType<{ size: number; color: string }>> = {
  image: Image,
  text: Type,
  url: Link,
};

const INPUT_LABELS: Record<InputType, string> = {
  image: 'Image',
  text: 'Text',
  url: 'URL',
};

const STATUS_LABELS: Record<string, string> = {
  ready_for_analysis: 'Queued',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 1) {
    const mins = Math.floor(diffMs / (1000 * 60));
    return mins <= 1 ? 'Just now' : `${mins}m ago`;
  }
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  if (diffHours < 48) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface ScanRowProps {
  scan: Scan;
  index: number;
  onPress: () => void;
}

function ScanRow({ scan, index, onPress }: ScanRowProps) {
  const { colors } = useAppTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, delay: index * 50, useNativeDriver: true }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const InputIcon = INPUT_ICONS[scan.input_type];
  const inputLabel = INPUT_LABELS[scan.input_type];
  const statusLabel = STATUS_LABELS[scan.status] ?? scan.status;
  const dateText = formatDate(scan.created_at);

  const statusColor = scan.status === 'completed'
    ? colors.evidence
    : scan.status === 'failed'
    ? colors.danger
    : scan.status === 'processing'
    ? colors.warning
    : colors.textTertiary;

  const statusBg = scan.status === 'completed'
    ? colors.evidenceMuted
    : scan.status === 'failed'
    ? colors.dangerMuted
    : scan.status === 'processing'
    ? colors.warningMuted
    : 'rgba(148,163,184,0.12)';

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <AnimatedPressable
        onPress={() => {
          console.log('[HistoryScreen] scan row pressed');
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={`${inputLabel} scan, ${statusLabel}`}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: RADIUS.lg,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: colors.border,
            boxShadow: SHADOWS.sm,
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING.md,
          } as any}
        >
          {/* Icon circle */}
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: RADIUS.md,
              backgroundColor: colors.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <InputIcon size={20} color={colors.primary} />
          </View>

          {/* Content */}
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.text }]}>
                {inputLabel}
              </Text>
              <View
                style={{
                  backgroundColor: statusBg,
                  borderRadius: 6,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                }}
              >
                <Text style={[TYPOGRAPHY.micro, { color: statusColor }]}>
                  {statusLabel}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                {dateText}
              </Text>
              {scan.source_type ? (
                <>
                  <Text style={[TYPOGRAPHY.caption, { color: colors.textTertiary }]}>·</Text>
                  <Text style={[TYPOGRAPHY.caption, { color: colors.textTertiary }]}>
                    {scan.source_type === 'camera' ? 'Camera' : scan.source_type === 'library' ? 'Library' : 'Pasted'}
                  </Text>
                </>
              ) : null}
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function SkeletonRow() {
  const { colors } = useAppTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={{
        opacity,
        backgroundColor: colors.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
      }}
    >
      <View style={{ width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: colors.surfaceSecondary }} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={{ height: 14, width: '50%', borderRadius: 7, backgroundColor: colors.surfaceSecondary }} />
        <View style={{ height: 12, width: '35%', borderRadius: 6, backgroundColor: colors.surfaceSecondary }} />
      </View>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { entitlement, loading: subLoading } = useSubscription();

  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const isAuthenticated = !!user;
  const historyDaysLimit = getHistoryDaysLimit(entitlement);
  const isTruncated = historyDaysLimit !== null;

  const loadScans = useCallback(async () => {
    if (!user) return;
    console.log('[HistoryScreen] loadScans called, entitlement:', entitlement);
    try {
      let query = supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const cutoff = getHistoryCutoffDate(entitlement);
      if (cutoff) {
        console.log('[HistoryScreen] applying history cutoff:', cutoff);
        query = query.gte('created_at', cutoff);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.log('[HistoryScreen] loadScans error');
        setError('Could not load your scan history. Please try again.');
        return;
      }
      setScans((data ?? []) as Scan[]);
      setError(null);
    } catch {
      console.log('[HistoryScreen] loadScans unexpected error');
      setError('Could not load your scan history. Please check your connection.');
    }
  }, [user, entitlement]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    if (subLoading) return;
    setLoading(true);
    loadScans().finally(() => setLoading(false));
  }, [isAuthenticated, loadScans, subLoading]);

  const handleRefresh = useCallback(async () => {
    console.log('[HistoryScreen] pull-to-refresh triggered');
    setRefreshing(true);
    await loadScans();
    setRefreshing(false);
  }, [loadScans]);

  const handleRetry = () => {
    console.log('[HistoryScreen] retry pressed');
    setLoading(true);
    setError(null);
    loadScans().finally(() => setLoading(false));
  };

  const handleGoToScan = () => {
    console.log('[HistoryScreen] go to scan pressed');
    router.navigate('/(tabs)/(scan)');
  };

  const handleFilterPress = (key: FilterType) => {
    console.log('[HistoryScreen] filter pressed:', key);
    setActiveFilter(key);
  };

  const filteredScans = activeFilter === 'all'
    ? scans
    : scans.filter(s => s.input_type === activeFilter);

  const renderHeader = () => (
    <View>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + SPACING.md,
          paddingHorizontal: SPACING.md,
          paddingBottom: SPACING.md,
        }}
      >
        <Text style={[TYPOGRAPHY.h1, { color: colors.text, marginBottom: SPACING.xs }]}>
          Scan History
        </Text>
        <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
          Your submitted scans and analysis results.
        </Text>
      </View>

      {/* History truncation banner */}
      {isTruncated && !subLoading ? (
        <View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.sm }}>
          <AnimatedPressable
            onPress={() => {
              console.log('[HistoryScreen] history truncation banner pressed');
              router.push('/(tabs)/(profile)/subscription');
            }}
            accessibilityRole="button"
            accessibilityLabel="Upgrade to see full history"
          >
            <View
              style={{
                backgroundColor: colors.surfaceSecondary,
                borderRadius: RADIUS.md,
                padding: SPACING.sm,
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.sm,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Lock size={14} color={colors.textSecondary} />
              <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, flex: 1 }]}>
                {entitlement === 'free'
                  ? 'Showing last 7 days. Upgrade to Plus for 90 days or Pro/Max for full history.'
                  : 'Showing last 90 days. Upgrade to Pro or Max for unlimited history.'}
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: colors.primary }]}>
                Upgrade
              </Text>
            </View>
          </AnimatedPressable>
        </View>
      ) : null}

      {/* Filter buttons */}
      <View
        style={{
          paddingHorizontal: SPACING.md,
          flexDirection: 'row',
          gap: SPACING.sm,
          marginBottom: SPACING.md,
        }}
      >
        {FILTERS.map(f => {
          const isActive = activeFilter === f.key;
          return (
            <AnimatedPressable
              key={f.key}
              onPress={() => handleFilterPress(f.key)}
              accessibilityRole="button"
              accessibilityLabel={f.label}
              style={{
                backgroundColor: isActive ? colors.primary : colors.surfaceSecondary,
                borderRadius: RADIUS.sm,
                height: 34,
                paddingHorizontal: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={[
                  TYPOGRAPHY.label,
                  { color: isActive ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {f.label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {renderHeader()}
        <View style={{ paddingHorizontal: SPACING.md }}>
          <EmptyStateCard
            icon={FileSearch}
            title="Sign in to view history"
            subtitle="Create an account to save your scan history and access it across devices."
            ctaLabel="Sign In"
            onCtaPress={() => {
              console.log('[HistoryScreen] sign in CTA pressed');
              router.push('/(auth)/sign-in');
            }}
          />
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {renderHeader()}
        <View style={{ paddingHorizontal: SPACING.md, gap: SPACING.sm }}>
          {[0, 1, 2, 3].map(i => <SkeletonRow key={i} />)}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {renderHeader()}
        <View style={{ paddingHorizontal: SPACING.md }}>
          <InfoCard>
            <View style={{ alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md }}>
              <AlertCircle size={32} color={colors.danger} />
              <View style={{ alignItems: 'center', gap: SPACING.xs }}>
                <Text style={[TYPOGRAPHY.h3, { color: colors.text, textAlign: 'center' }]}>
                  Couldn't load history
                </Text>
                <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, textAlign: 'center' }]}>
                  {error}
                </Text>
              </View>
              <PrimaryButton title="Try Again" onPress={handleRetry} style={{ minWidth: 140 }} />
            </View>
          </InfoCard>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredScans}
      keyExtractor={item => item.id}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: 100, gap: SPACING.sm }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={renderHeader}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        <EmptyStateCard
          icon={FileSearch}
          title="No scans yet"
          subtitle={
            activeFilter === 'all'
              ? 'Complete your first scan to begin building your private report history.'
              : `No ${activeFilter} scans found.`
          }
          ctaLabel={activeFilter === 'all' ? 'Go to Scan' : undefined}
          onCtaPress={activeFilter === 'all' ? handleGoToScan : undefined}
        />
      }
      renderItem={({ item, index }) => (
        <ScanRow
          scan={item}
          index={index}
          onPress={() => router.push(`/(tabs)/(history)/${item.id}` as any)}
        />
      )}
    />
  );
}
