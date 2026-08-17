import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Send,
  Inbox,
  CheckCircle,
  Clock,
  Plus,
  AlertCircle,
  Copy,
  X,
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyRequests, cancelProofRequest } from '@/services/proofRequestService';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/constants/theme';
import { EmptyStateCard } from '@/components/EmptyStateCard';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { InfoCard } from '@/components/InfoCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Divider } from '@/components/Divider';
import type { ProofRequest } from '@/types/scan';

type Segment = 'sent' | 'received' | 'completed' | 'expired';

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: 'sent', label: 'Sent' },
  { key: 'received', label: 'Received' },
  { key: 'completed', label: 'Completed' },
  { key: 'expired', label: 'Expired' },
];

const EMPTY_STATES: Record<Segment, {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  subtitle: string;
}> = {
  sent: { icon: Send, title: 'No sent requests', subtitle: 'Requests you create will appear here.' },
  received: { icon: Inbox, title: 'No received requests', subtitle: 'Requests sent to your code will appear here.' },
  completed: { icon: CheckCircle, title: 'No completed requests', subtitle: 'Completed verification requests will appear here.' },
  expired: { icon: Clock, title: 'No expired requests', subtitle: 'Expired or cancelled requests will appear here.' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {};

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d < now) return 'Expired';
  const diffMs = d.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 1) return `Expires in ${Math.floor(diffMs / 60000)}m`;
  if (diffHours < 24) return `Expires in ${Math.floor(diffHours)}h`;
  return `Expires ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function truncateCode(code: string): string {
  return code.length > 8 ? code.slice(0, 8) + '…' : code;
}

interface RequestRowProps {
  request: ProofRequest;
  userId: string;
  index: number;
  onCancel: (id: string) => void;
}

function RequestRow({ request, userId, index, onCancel }: RequestRowProps) {
  const { colors } = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, delay: index * 50, useNativeDriver: true }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSender = request.requester_id === userId;
  const challengePreview = request.challenge.length > 60
    ? request.challenge.slice(0, 60) + '…'
    : request.challenge;
  const expiryText = formatExpiry(request.expires_at);
  const codeDisplay = truncateCode(request.share_code);

  const statusColor = request.status === 'completed'
    ? colors.evidence
    : request.status === 'pending'
    ? colors.primary
    : request.status === 'expired'
    ? colors.textTertiary
    : colors.danger;

  const statusBg = request.status === 'completed'
    ? colors.evidenceMuted
    : request.status === 'pending'
    ? colors.primaryMuted
    : request.status === 'expired'
    ? 'rgba(148,163,184,0.12)'
    : colors.dangerMuted;

  const statusLabel = request.status === 'pending'
    ? 'Pending'
    : request.status === 'completed'
    ? 'Completed'
    : request.status === 'expired'
    ? 'Expired'
    : 'Cancelled';

  const handleCopyCode = () => {
    console.log('[RequestsScreen] copy code pressed');
    Clipboard.setString(request.share_code);
    Alert.alert('Copied', 'Share code copied to clipboard.');
  };

  const handleShare = async () => {
    console.log('[RequestsScreen] share code pressed');
    try {
      await Share.share({
        message: `Use this InvisiProof code to submit evidence: ${request.share_code}\n\nChallenge: ${request.challenge}`,
      });
    } catch {
      console.log('[RequestsScreen] share failed');
    }
  };

  const handleCancel = () => {
    console.log('[RequestsScreen] cancel request pressed');
    Alert.alert(
      'Cancel this request?',
      'The share code will no longer be usable.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel request',
          style: 'destructive',
          onPress: () => onCancel(request.id),
        },
      ]
    );
  };

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <AnimatedPressable
        onPress={() => {
          console.log('[RequestsScreen] request row pressed');
          setExpanded(e => !e);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Proof request, ${statusLabel}`}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: RADIUS.lg,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: colors.border,
            boxShadow: SHADOWS.sm,
            gap: SPACING.sm,
          } as any}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
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
            <Text style={[TYPOGRAPHY.label, { color: colors.textTertiary, fontFamily: 'SpaceMono-Regular' }]}>
              {codeDisplay}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={[TYPOGRAPHY.caption, { color: colors.textTertiary }]}>
              {expiryText}
            </Text>
          </View>

          <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]} numberOfLines={expanded ? undefined : 2}>
            {challengePreview}
          </Text>

          {/* Expanded actions for sender */}
          {expanded && isSender ? (
            <View style={{ gap: SPACING.sm, marginTop: SPACING.xs }}>
              <Divider />
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <AnimatedPressable
                  onPress={handleCopyCode}
                  accessibilityRole="button"
                  accessibilityLabel="Copy share code"
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: colors.primaryMuted,
                    borderRadius: RADIUS.sm,
                    height: 40,
                  }}
                >
                  <Copy size={16} color={colors.primary} />
                  <Text style={[TYPOGRAPHY.label, { color: colors.primary }]}>
                    Copy code
                  </Text>
                </AnimatedPressable>
                <AnimatedPressable
                  onPress={handleShare}
                  accessibilityRole="button"
                  accessibilityLabel="Share code"
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: colors.surfaceSecondary,
                    borderRadius: RADIUS.sm,
                    height: 40,
                  }}
                >
                  <Send size={16} color={colors.textSecondary} />
                  <Text style={[TYPOGRAPHY.label, { color: colors.textSecondary }]}>
                    Share
                  </Text>
                </AnimatedPressable>
              </View>
              {request.status === 'pending' ? (
                <AnimatedPressable
                  onPress={handleCancel}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel request"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    height: 40,
                  }}
                >
                  <X size={16} color={colors.danger} />
                  <Text style={[TYPOGRAPHY.label, { color: colors.danger }]}>
                    Cancel request
                  </Text>
                </AnimatedPressable>
              ) : null}
            </View>
          ) : expanded && !isSender ? (
            <View style={{ marginTop: SPACING.xs }}>
              <Divider />
              <Text style={[TYPOGRAPHY.caption, { color: colors.textTertiary, marginTop: SPACING.sm }]}>
                You responded to this request.
              </Text>
            </View>
          ) : null}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function RequestsScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [requests, setRequests] = useState<ProofRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<Segment>('sent');

  const isAuthenticated = !!user;

  const loadRequests = useCallback(async () => {
    if (!user) return;
    console.log('[RequestsScreen] loadRequests called');
    try {
      const data = await fetchMyRequests();
      setRequests(data);
      setError(null);
    } catch {
      console.log('[RequestsScreen] loadRequests error');
      setError('Could not load your requests. Please try again.');
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadRequests().finally(() => setLoading(false));
  }, [isAuthenticated, loadRequests]);

  const handleRefresh = useCallback(async () => {
    console.log('[RequestsScreen] pull-to-refresh triggered');
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  }, [loadRequests]);

  const handleRetry = () => {
    console.log('[RequestsScreen] retry pressed');
    setLoading(true);
    setError(null);
    loadRequests().finally(() => setLoading(false));
  };

  const handleCancel = async (requestId: string) => {
    console.log('[RequestsScreen] cancelling request');
    try {
      await cancelProofRequest(requestId);
      await loadRequests();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not cancel the request.');
    }
  };

  const handleSegmentPress = (key: Segment) => {
    console.log('[RequestsScreen] segment changed:', key);
    setActiveSegment(key);
  };

  const handleCreateRequest = () => {
    console.log('[RequestsScreen] create request pressed');
    router.push('/(tabs)/(requests)/create-request');
  };

  const filteredRequests = requests.filter(r => {
    if (!user) return false;
    if (activeSegment === 'sent') {
      return r.requester_id === user.id && r.status === 'pending';
    }
    if (activeSegment === 'received') {
      return r.respondent_id === user.id;
    }
    if (activeSegment === 'completed') {
      return r.requester_id === user.id && r.status === 'completed';
    }
    if (activeSegment === 'expired') {
      return r.requester_id === user.id && (r.status === 'expired' || r.status === 'cancelled');
    }
    return false;
  });

  const emptyState = EMPTY_STATES[activeSegment];

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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={[TYPOGRAPHY.h1, { color: colors.text, marginBottom: SPACING.xs }]}>
              Proof Requests
            </Text>
            <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
              Request evidence from another person before continuing a transaction.
            </Text>
          </View>
          {isAuthenticated ? (
            <AnimatedPressable
              onPress={handleCreateRequest}
              accessibilityRole="button"
              accessibilityLabel="Create new proof request"
              style={{
                width: 44,
                height: 44,
                borderRadius: RADIUS.md,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={22} color="#FFFFFF" />
            </AnimatedPressable>
          ) : null}
        </View>
      </View>

      {/* Segmented control */}
      <View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.md }}>
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
                    { color: isActive ? '#FFFFFF' : colors.textSecondary, textAlign: 'center' },
                  ]}
                >
                  {seg.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>
      </View>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {renderHeader()}
        <View style={{ paddingHorizontal: SPACING.md }}>
          <EmptyStateCard
            icon={Send}
            title="Sign in to use requests"
            subtitle="Create an account to send and receive proof requests."
            ctaLabel="Sign In"
            onCtaPress={() => {
              console.log('[RequestsScreen] sign in CTA pressed');
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
        <View style={{ alignItems: 'center', paddingTop: SPACING.xl }}>
          <ActivityIndicator size="large" color={colors.primary} />
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
                  Couldn't load requests
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
      data={filteredRequests}
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
          icon={emptyState.icon}
          title={emptyState.title}
          subtitle={emptyState.subtitle}
          ctaLabel={activeSegment === 'sent' ? 'Create Request' : undefined}
          onCtaPress={activeSegment === 'sent' ? handleCreateRequest : undefined}
        />
      }
      renderItem={({ item, index }) => (
        <RequestRow
          request={item}
          userId={user?.id ?? ''}
          index={index}
          onCancel={handleCancel}
        />
      )}
    />
  );
}
