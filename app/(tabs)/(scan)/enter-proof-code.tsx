import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { KeyRound, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuth } from '@/contexts/AuthContext';
import { lookupProofRequestByCode } from '@/services/proofRequestService';
import { trackProofRequestOpened } from '@/services/analytics';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { InfoCard } from '@/components/InfoCard';
import { PrimaryButton, SecondaryButton } from '@/components/PrimaryButton';
import { AuthRequiredModal } from '@/components/AuthRequiredModal';
import { LegalDisclaimerCard } from '@/components/LegalDisclaimerCard';

interface LookedUpRequest {
  id: string;
  challenge: string;
  expires_at: string;
  status: string;
}

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isExpired(iso: string): boolean {
  return new Date(iso) < new Date();
}

export default function EnterProofCodeScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [code, setCode] = useState('');
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [foundRequest, setFoundRequest] = useState<LookedUpRequest | null>(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const isAuthenticated = !!user;
  const codeClean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const isValidCode = codeClean.length === 12;

  const handleCodeChange = (text: string) => {
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    setCode(cleaned);
    if (foundRequest) setFoundRequest(null);
    if (lookupError) setLookupError(null);
  };

  const handleLookUp = async () => {
    if (!isAuthenticated) {
      console.log('[EnterProofCodeScreen] look up pressed — auth required');
      setAuthModalVisible(true);
      return;
    }
    if (!isValidCode) return;
    console.log('[EnterProofCodeScreen] look up pressed');
    setLooking(true);
    setLookupError(null);
    setFoundRequest(null);

    const result = await lookupProofRequestByCode(codeClean);
    setLooking(false);

    if (!result) {
      setLookupError('No request found with that code. Please check and try again.');
      return;
    }

    console.log('[EnterProofCodeScreen] request found, status:', result.status);
    trackProofRequestOpened();
    setFoundRequest(result);
  };

  const handleSubmitEvidence = () => {
    if (!foundRequest) return;
    console.log('[EnterProofCodeScreen] submit evidence pressed');
    // Navigate to scan screenshot with request ID as param
    router.push({
      pathname: '/(tabs)/(scan)/scan-screenshot',
      params: { proofRequestId: foundRequest.id },
    } as any);
  };

  const expired = foundRequest ? isExpired(foundRequest.expires_at) : false;
  const canSubmit = foundRequest && foundRequest.status === 'pending' && !expired;

  const statusInfo = foundRequest ? (() => {
    if (expired || foundRequest.status === 'expired') {
      return { icon: Clock, color: colors.textTertiary, label: 'Expired', bg: 'rgba(148,163,184,0.12)' };
    }
    if (foundRequest.status === 'completed') {
      return { icon: CheckCircle, color: colors.evidence, label: 'Already answered', bg: colors.evidenceMuted };
    }
    if (foundRequest.status === 'cancelled') {
      return { icon: XCircle, color: colors.danger, label: 'Cancelled', bg: colors.dangerMuted };
    }
    return { icon: CheckCircle, color: colors.primary, label: 'Open', bg: colors.primaryMuted };
  })() : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Enter Proof Code',
          headerShown: true,
          headerBackTitle: 'Scan',
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: SPACING.md,
            paddingTop: SPACING.md,
            paddingBottom: insets.bottom + SPACING.xl,
            gap: SPACING.md,
          }}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
        >
          {/* Description */}
          <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
            Enter a 12-character proof code to respond to a verification request from another InvisiProof user.
          </Text>

          {/* Code input */}
          <View style={{ gap: SPACING.sm }}>
            <Text style={[TYPOGRAPHY.label, { color: colors.textSecondary, textTransform: 'uppercase' }]}>
              Proof code
            </Text>
            <TextInput
              value={code}
              onChangeText={handleCodeChange}
              placeholder="XXXXXXXXXXXX"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              style={[
                TYPOGRAPHY.h2,
                {
                  color: colors.text,
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: RADIUS.md,
                  padding: SPACING.md,
                  borderWidth: 1,
                  borderColor: lookupError ? colors.danger : colors.border,
                  letterSpacing: 4,
                  textAlign: 'center',
                  fontFamily: 'SpaceMono-Regular',
                },
              ]}
              autoFocus
            />
            {lookupError ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                <AlertCircle size={14} color={colors.danger} />
                <Text style={[TYPOGRAPHY.caption, { color: colors.danger, flex: 1 }]}>
                  {lookupError}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Look Up button */}
          <PrimaryButton
            title="Look Up"
            onPress={handleLookUp}
            disabled={!isValidCode || looking}
            loading={looking}
          />

          {/* Found request details */}
          {foundRequest && statusInfo ? (
            <InfoCard>
              <View style={{ gap: SPACING.md }}>
                {/* Status badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <View
                    style={{
                      backgroundColor: statusInfo.bg,
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <statusInfo.icon size={12} color={statusInfo.color} />
                    <Text style={[TYPOGRAPHY.micro, { color: statusInfo.color }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>

                {/* Challenge */}
                <View style={{ gap: SPACING.xs }}>
                  <Text style={[TYPOGRAPHY.label, { color: colors.textSecondary, textTransform: 'uppercase' }]}>
                    Challenge
                  </Text>
                  <Text style={[TYPOGRAPHY.body, { color: colors.text }]}>
                    {foundRequest.challenge}
                  </Text>
                </View>

                {/* Expiry */}
                <View style={{ gap: SPACING.xs }}>
                  <Text style={[TYPOGRAPHY.label, { color: colors.textSecondary, textTransform: 'uppercase' }]}>
                    {expired ? 'Expired' : 'Expires'}
                  </Text>
                  <Text style={[TYPOGRAPHY.caption, { color: expired ? colors.danger : colors.textSecondary }]}>
                    {formatExpiry(foundRequest.expires_at)}
                  </Text>
                </View>

                {/* Status-specific messages */}
                {foundRequest.status === 'completed' ? (
                  <View
                    style={{
                      backgroundColor: colors.evidenceMuted,
                      borderRadius: RADIUS.sm,
                      padding: SPACING.sm,
                    }}
                  >
                    <Text style={[TYPOGRAPHY.caption, { color: colors.evidence }]}>
                      This request has already been answered.
                    </Text>
                  </View>
                ) : foundRequest.status === 'cancelled' ? (
                  <View
                    style={{
                      backgroundColor: colors.dangerMuted,
                      borderRadius: RADIUS.sm,
                      padding: SPACING.sm,
                    }}
                  >
                    <Text style={[TYPOGRAPHY.caption, { color: colors.danger }]}>
                      This request has been cancelled by the requester.
                    </Text>
                  </View>
                ) : expired ? (
                  <View
                    style={{
                      backgroundColor: 'rgba(148,163,184,0.12)',
                      borderRadius: RADIUS.sm,
                      padding: SPACING.sm,
                    }}
                  >
                    <Text style={[TYPOGRAPHY.caption, { color: colors.textTertiary }]}>
                      This request has expired and can no longer be answered.
                    </Text>
                  </View>
                ) : null}

                {/* Submit evidence button */}
                {canSubmit ? (
                  <PrimaryButton
                    title="Submit Evidence"
                    onPress={handleSubmitEvidence}
                  />
                ) : null}
              </View>
            </InfoCard>
          ) : null}

          {/* Legal disclaimer */}
          <LegalDisclaimerCard />
        </ScrollView>
      </KeyboardAvoidingView>

      <AuthRequiredModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />
    </>
  );
}
