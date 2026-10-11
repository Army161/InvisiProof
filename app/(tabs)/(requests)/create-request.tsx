import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Share,
  Alert,
  Clipboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Copy, CheckCircle, Camera, Timer, ReceiptText } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuth } from '@/contexts/AuthContext';
import {
  createVerificationRequest,
  verificationShareMessage,
  VERIFICATION_REQUEST_HOURS,
} from '@/services/proofRequestService';
import { trackProofRequestCreated } from '@/services/analytics';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { InfoCard } from '@/components/InfoCard';
import { PrimaryButton, SecondaryButton } from '@/components/PrimaryButton';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { AuthRequiredModal } from '@/components/AuthRequiredModal';

export default function CreateRequestScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ item?: string }>();

  const [item, setItem] = useState(params.item ?? '');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const itemClean = item.trim();
  const isValid = itemClean.length >= 2 && itemClean.length <= 80;

  const handleCreate = async () => {
    if (!user) {
      setAuthModalVisible(true);
      return;
    }
    if (!isValid) return;
    console.log('[CreateRequestScreen] create verification request pressed');
    setSubmitting(true);
    setError(null);
    try {
      const result = await createVerificationRequest(itemClean, note);
      trackProofRequestCreated({ analysis_requirement: 'server_verified_cloud' });
      setCreatedCode(result.share_code);
    } catch (e: any) {
      setError(e?.message ?? 'Could not create the request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!createdCode) return;
    Clipboard.setString(createdCode);
    Alert.alert('Copied', 'Proof code copied.');
  };

  const handleShare = async () => {
    if (!createdCode) return;
    try {
      await Share.share({ message: verificationShareMessage(itemClean, createdCode) });
    } catch {
      console.log('[CreateRequestScreen] share failed');
    }
  };

  if (createdCode) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          paddingHorizontal: SPACING.md,
          paddingTop: SPACING.xl,
          paddingBottom: insets.bottom + SPACING.xl,
          gap: SPACING.md,
          alignItems: 'center',
        }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.evidenceMuted,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: SPACING.sm,
          }}
        >
          <CheckCircle size={36} color={colors.evidence} />
        </View>

        <Text style={[TYPOGRAPHY.h2, { color: colors.text, textAlign: 'center' }]}>
          Send this to the seller
        </Text>
        <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, textAlign: 'center', maxWidth: 320 }]}>
          Paste it into your Marketplace chat. The code works once and expires in {VERIFICATION_REQUEST_HOURS} hours.
          You'll get a Proof Receipt here when they answer.
        </Text>

        <InfoCard style={{ width: '100%', alignItems: 'center', gap: SPACING.sm }}>
          <Text style={[TYPOGRAPHY.label, { color: colors.textSecondary, textTransform: 'uppercase' }]}>
            Proof code
          </Text>
          <Text
            selectable
            style={[
              TYPOGRAPHY.h1,
              { color: colors.primary, letterSpacing: 3, fontFamily: 'SpaceMono-Regular', textAlign: 'center' },
            ]}
          >
            {createdCode}
          </Text>
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
            {itemClean}
          </Text>
        </InfoCard>

        <View style={{ width: '100%', gap: SPACING.sm }}>
          <PrimaryButton title="Send to Seller" onPress={handleShare} />
          <AnimatedPressable
            onPress={handleCopyCode}
            accessibilityRole="button"
            accessibilityLabel="Copy proof code"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: SPACING.sm,
              backgroundColor: colors.primaryMuted,
              borderRadius: RADIUS.md,
              height: 52,
            }}
          >
            <Copy size={20} color={colors.primary} />
            <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.primary, fontWeight: '600' }]}>
              Copy code only
            </Text>
          </AnimatedPressable>
          <SecondaryButton title="Done" onPress={() => router.replace('/(tabs)/(requests)')} />
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACING.md,
          paddingTop: SPACING.md,
          paddingBottom: insets.bottom + SPACING.xl,
          gap: SPACING.lg,
        }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: SPACING.xs }}>
          <Text style={[TYPOGRAPHY.h2, { color: colors.text }]}>Make the seller prove it</Text>
          <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
            Before you send a deposit, ask the seller to show they really have the item, right now, on camera.
          </Text>
        </View>

        <View style={{ gap: SPACING.sm }}>
          <Text style={[TYPOGRAPHY.label, { color: colors.textSecondary, textTransform: 'uppercase' }]}>
            What are you buying?
          </Text>
          <TextInput
            value={item}
            onChangeText={setItem}
            placeholder="e.g. PS5 Slim, $350"
            placeholderTextColor={colors.textTertiary}
            maxLength={80}
            style={[
              TYPOGRAPHY.body,
              {
                color: colors.text,
                backgroundColor: colors.surfaceSecondary,
                borderRadius: RADIUS.md,
                paddingHorizontal: SPACING.md,
                height: 52,
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
            autoFocus={!params.item}
            returnKeyType="next"
          />
        </View>

        <View style={{ gap: SPACING.sm }}>
          <Text style={[TYPOGRAPHY.label, { color: colors.textSecondary, textTransform: 'uppercase' }]}>
            Note to the seller (optional)
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Please show the serial number sticker too."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={300}
            style={[
              TYPOGRAPHY.body,
              {
                color: colors.text,
                backgroundColor: colors.surfaceSecondary,
                borderRadius: RADIUS.md,
                padding: SPACING.md,
                minHeight: 88,
                textAlignVertical: 'top',
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
          />
        </View>

        <InfoCard style={{ gap: SPACING.md }}>
          <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.text, fontWeight: '600' }]}>
            What the seller will have to do
          </Text>
          {[
            { icon: Camera, text: 'Take one live photo of the item with a random code word written on paper, next to a random household object, from a random angle.' },
            { icon: Timer, text: "The challenge is made up the moment they open it, so old photos won't work. They get 10 minutes and can only use the camera." },
            { icon: ReceiptText, text: 'You get a Proof Receipt with what they proved. You never see their photo, and the receipt expires after 24 hours.' },
          ].map(({ icon: Icon, text }) => (
            <View key={text} style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <Icon size={18} color={colors.primary} style={{ marginTop: 2 }} />
              <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, flex: 1 }]}>{text}</Text>
            </View>
          ))}
        </InfoCard>

        {error ? <Text style={[TYPOGRAPHY.body, { color: colors.danger }]}>{error}</Text> : null}

        <PrimaryButton
          title="Create Proof Request"
          onPress={handleCreate}
          disabled={!isValid}
          loading={submitting}
        />
      </ScrollView>

      <AuthRequiredModal visible={authModalVisible} onClose={() => setAuthModalVisible(false)} />
    </KeyboardAvoidingView>
  );
}
