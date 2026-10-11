import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, Alert, Linking } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Timer, CheckCircle, AlertCircle, PenLine, Hand, ShieldCheck } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  openProofChallenge,
  submitChallengeResponse,
  type LiveChallenge,
} from '@/services/proofRequestService';
import { uploadImageScan } from '@/services/scanService';
import { runCloudAnalysis } from '@/services/ai';
import { prepareImage, deleteTempImage } from '@/utils/imagePrep';
import { trackProofResponseSubmitted } from '@/services/analytics';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { InfoCard } from '@/components/InfoCard';
import { PrimaryButton, SecondaryButton } from '@/components/PrimaryButton';
import type { ImageMeta, Scan } from '@/types/scan';

type Phase = 'opening' | 'error' | 'ready' | 'sending' | 'done';

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LiveChallengeScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();

  const [phase, setPhase] = useState<Phase>('opening');
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<LiveChallenge | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [photo, setPhoto] = useState<ImageMeta | null>(null);
  const [sendStage, setSendStage] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);

  // Steps that already succeeded, so a retry doesn't repeat them.
  const scanRef = useRef<Scan | null>(null);
  const analyzedRef = useRef(false);

  useEffect(() => {
    if (!code) return;
    openProofChallenge(code).then(result => {
      if (result.challenge) {
        setChallenge(result.challenge);
        setPhase('ready');
      } else {
        setError(result.error ?? 'Could not start the challenge.');
        setPhase('error');
      }
    });
  }, [code]);

  useEffect(() => {
    if (!challenge) return;
    const deadline = new Date(challenge.deadline).getTime();
    const tick = () => setRemainingMs(deadline - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [challenge]);

  const timeUp = !!challenge && remainingMs <= 0 && !scanRef.current;

  const handleTakePhoto = useCallback(async () => {
    const { granted, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert(
        'Camera Needed',
        'The challenge has to be a live photo, so it only works with the camera.',
        canAskAgain
          ? [{ text: 'Try Again', onPress: handleTakePhoto }, { text: 'Cancel', style: 'cancel' }]
          : [{ text: 'Open Settings', onPress: () => Linking.openSettings() }, { text: 'Cancel', style: 'cancel' }]
      );
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (result.canceled || !result.assets.length) return;
      const prepared = await prepareImage(result.assets[0]);
      if (photo) deleteTempImage(photo.uri).catch(() => {});
      setPhoto(prepared);
      setSendError(null);
    } catch (e: any) {
      Alert.alert('Camera Unavailable', e?.message ?? 'Could not take the photo. Please try again.');
    }
  }, [photo]);

  const handleSend = async () => {
    if (!challenge || !photo) return;
    setPhase('sending');
    setSendError(null);
    try {
      if (!scanRef.current) {
        setSendStage('Uploading your photo…');
        scanRef.current = await uploadImageScan(photo, 'camera', new Date(), challenge.request_id);
      }
      if (!analyzedRef.current) {
        setSendStage('Checking your photo…');
        await runCloudAnalysis(scanRef.current.id, null);
        analyzedRef.current = true;
      }
      setSendStage('Sending your proof…');
      const result = await submitChallengeResponse(challenge.request_id, scanRef.current.id);
      if (!result.success) throw new Error(result.error);
      trackProofResponseSubmitted();
      deleteTempImage(photo.uri).catch(() => {});
      setPhase('done');
    } catch (e: any) {
      setSendError(e?.message ?? 'Could not send your proof. Please try again.');
      setPhase('ready');
    }
  };

  const header = <Stack.Screen options={{ headerShown: true, title: 'Live Challenge', headerBackTitle: 'Back' }} />;

  if (phase === 'opening') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: SPACING.md }}>
        {header}
        <ActivityIndicator color={colors.primary} />
        <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>Making your challenge…</Text>
      </View>
    );
  }

  if (phase === 'error' || !challenge) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg, gap: SPACING.md }}>
        {header}
        <AlertCircle size={40} color={colors.warning} />
        <Text style={[TYPOGRAPHY.body, { color: colors.text, textAlign: 'center' }]}>{error}</Text>
        <SecondaryButton title="Go Back" onPress={() => router.back()} style={{ minWidth: 160 }} />
      </View>
    );
  }

  if (phase === 'done') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg, gap: SPACING.md }}>
        <Stack.Screen options={{ headerShown: true, title: 'Proof Sent', headerBackVisible: false }} />
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.evidenceMuted, alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={36} color={colors.evidence} />
        </View>
        <Text style={[TYPOGRAPHY.h2, { color: colors.text, textAlign: 'center' }]}>Proof sent</Text>
        <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, textAlign: 'center', maxWidth: 320 }]}>
          The buyer now has a Proof Receipt for the {challenge.item}. They see the result of the check, not your photo.
        </Text>
        <PrimaryButton title="Done" onPress={() => router.replace('/(tabs)/(scan)')} style={{ minWidth: 200 }} />
      </View>
    );
  }

  const sending = phase === 'sending';
  const urgent = remainingMs < 2 * 60 * 1000;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: SPACING.md, paddingBottom: insets.bottom + SPACING.xl, gap: SPACING.md }}
      contentInsetAdjustmentBehavior="automatic"
    >
      {header}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING.sm,
          backgroundColor: timeUp ? colors.dangerMuted : urgent ? colors.warningMuted : colors.primaryMuted,
          borderRadius: RADIUS.md,
          paddingVertical: SPACING.sm,
        }}
      >
        <Timer size={18} color={timeUp ? colors.danger : urgent ? colors.warning : colors.primary} />
        <Text style={[TYPOGRAPHY.h3, { color: timeUp ? colors.danger : colors.text }]}>
          {timeUp ? "Time's up" : `${formatRemaining(remainingMs)} left`}
        </Text>
      </View>

      <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
        Take one photo of the <Text style={{ color: colors.text, fontWeight: '600' }}>{challenge.item}</Text> that shows all of this:
      </Text>

      <InfoCard style={{ gap: SPACING.md }}>
        <View style={{ flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' }}>
          <PenLine size={22} color={colors.primary} style={{ marginTop: 2 }} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.text }]}>Write this code on paper</Text>
            <Text selectable style={{ fontSize: 32, fontWeight: '700', letterSpacing: 2, color: colors.primary, fontFamily: 'SpaceMono-Regular' }}>
              {challenge.phrase}
            </Text>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: colors.divider }} />
        <View style={{ flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' }}>
          <Hand size={22} color={colors.primary} style={{ marginTop: 2 }} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.text }]}>Put this next to the item</Text>
            <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>{challenge.object}</Text>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: colors.divider }} />
        <View style={{ flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' }}>
          <Camera size={22} color={colors.primary} style={{ marginTop: 2 }} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.text }]}>Take the photo</Text>
            <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>{challenge.angle}</Text>
          </View>
        </View>
      </InfoCard>

      {challenge.note ? (
        <InfoCard>
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginBottom: SPACING.xs }]}>The buyer also asked</Text>
          <Text style={[TYPOGRAPHY.body, { color: colors.text }]}>"{challenge.note}"</Text>
        </InfoCard>
      ) : null}

      {photo ? (
        <Image
          source={{ uri: photo.uri }}
          style={{ width: '100%', aspectRatio: photo.width / photo.height, borderRadius: RADIUS.md, backgroundColor: colors.surfaceSecondary }}
          resizeMode="cover"
          accessibilityLabel="Your challenge photo"
        />
      ) : null}

      {sendError ? (
        <View style={{ flexDirection: 'row', gap: SPACING.xs, alignItems: 'center' }}>
          <AlertCircle size={16} color={colors.danger} />
          <Text style={[TYPOGRAPHY.caption, { color: colors.danger, flex: 1 }]}>{sendError}</Text>
        </View>
      ) : null}

      {sending ? (
        <View style={{ alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>{sendStage}</Text>
        </View>
      ) : timeUp ? (
        <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, textAlign: 'center' }]}>
          The 10 minutes ran out. Ask the buyer to send you a new code.
        </Text>
      ) : photo ? (
        <View style={{ gap: SPACING.sm }}>
          <PrimaryButton title="Send Proof" onPress={handleSend} />
          {!scanRef.current ? (
            <SecondaryButton title="Retake Photo" onPress={handleTakePhoto} />
          ) : null}
        </View>
      ) : (
        <PrimaryButton title="Open Camera" onPress={handleTakePhoto} />
      )}

      <View style={{ flexDirection: 'row', gap: SPACING.xs, alignItems: 'flex-start' }}>
        <ShieldCheck size={14} color={colors.textTertiary} style={{ marginTop: 2 }} />
        <Text style={[TYPOGRAPHY.caption, { color: colors.textTertiary, flex: 1 }]}>
          Your photo is only used to check this challenge. The buyer gets the result, not your photo.
        </Text>
      </View>
    </ScrollView>
  );
}
