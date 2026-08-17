import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Camera, ImageIcon, X, RefreshCw } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { AuthRequiredModal } from '@/components/AuthRequiredModal';
import { useSubmitScan } from '@/hooks/useSubmitScan';
import { ConsentCheckbox } from '@/components/ConsentCheckbox';
import { PrimaryButton } from '@/components/PrimaryButton';
import { prepareImage, deleteTempImage } from '@/utils/imagePrep';
import type { PreparedImage } from '@/types/scan';

export default function ScanScreenshotScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { user, isGuest } = useAuth();
  const { stage, stageLabel, error, submitImage, reset } = useSubmitScan();

  const [preparedImage, setPreparedImage] = useState<PreparedImage | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepError, setPrepError] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sourceType, setSourceType] = useState<'camera' | 'library'>('library');

  const preparedImageRef = useRef<PreparedImage | null>(null);
  const isSubmittingRef = useRef(false);

  const isGuestOrNoUser = isGuest || !user;
  const isSubmitting = stage === 'uploading' || stage === 'saving';
  const submitDisabled = !preparedImage || !consentChecked || stage !== 'idle' || isPreparing;

  // Unmount cleanup — only runs if not navigating away via beforeRemove
  useEffect(() => {
    return () => {
      if (preparedImageRef.current && !isSubmittingRef.current) {
        deleteTempImage(preparedImageRef.current.uri).catch(() => {});
      }
    };
  }, []); // empty deps — reads ref, not state

  // Navigation guard
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (isSubmittingRef.current) {
        e.preventDefault();
        Alert.alert(
          'Upload in progress',
          'Wait for the secure upload to finish before leaving this screen.',
          [{ text: 'Continue Upload' }]
        );
        return;
      }
      if (preparedImageRef.current) {
        e.preventDefault();
        Alert.alert(
          'Discard selected image?',
          'The prepared image will be removed if you leave this screen.',
          [
            { text: 'Keep Editing', style: 'cancel' },
            {
              text: 'Discard',
              style: 'destructive',
              onPress: async () => {
                if (preparedImageRef.current) {
                  await deleteTempImage(preparedImageRef.current.uri);
                  preparedImageRef.current = null;
                }
                navigation.dispatch(e.data.action);
              },
            },
          ]
        );
      }
    });
    return unsubscribe;
  }, [navigation]);

  const handlePrepareAndSet = useCallback(async (asset: ImagePickerAsset, src: 'camera' | 'library') => {
    setIsPreparing(true);
    setPrepError(null);
    console.log('[ScanScreenshot] preparing image, sourceType:', src);
    try {
      const prepared = await prepareImage(asset);
      console.log('[ScanScreenshot] image prepared', { width: prepared.width, height: prepared.height, sizeBytes: prepared.sizeBytes });
      // Delete previous prepared image if any
      if (preparedImageRef.current) {
        await deleteTempImage(preparedImageRef.current.uri);
      }
      preparedImageRef.current = prepared;
      setPreparedImage(prepared);
      setSourceType(src);
      setConsentChecked(false);
      reset();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not prepare the selected image.';
      console.log('[ScanScreenshot] image preparation error:', msg);
      setPrepError(msg);
      // Do NOT clear existing preparedImage on failure
    } finally {
      setIsPreparing(false);
    }
  }, [reset]);

  // Android: recover pending picker result after activity recreation
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let cancelled = false;
    (async () => {
      try {
        const pending = await ImagePicker.getPendingResultAsync();
        if (cancelled) return;
        if (
          pending &&
          !('code' in pending) &&
          'canceled' in pending &&
          !pending.canceled &&
          'assets' in pending &&
          pending.assets &&
          pending.assets.length > 0
        ) {
          if (preparedImageRef.current) return;
          await handlePrepareAndSet(pending.assets[0], 'library');
        }
      } catch {
        // getPendingResultAsync not supported — ignore silently
      }
    })();
    return () => { cancelled = true; };
  }, [handlePrepareAndSet]); // handlePrepareAndSet is stable (useCallback)

  const handlePickLibrary = async () => {
    console.log('[ScanScreenshot] pick from library pressed');
    if (isGuestOrNoUser) {
      setShowAuthModal(true);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    console.log('[ScanScreenshot] library picker result, cancelled:', result.canceled);
    if (!result.canceled && result.assets.length > 0) {
      await handlePrepareAndSet(result.assets[0], 'library');
    }
    // canceled: return silently, preserve existing preparedImage
  };

  const handleTakePhoto = async () => {
    console.log('[ScanScreenshot] take photo pressed');
    if (isGuestOrNoUser) {
      setShowAuthModal(true);
      return;
    }
    const { granted, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      if (canAskAgain) {
        Alert.alert(
          'Camera Access Needed',
          'InvisiProof needs camera access to take a photo.',
          [
            { text: 'Try Again', onPress: handleTakePhoto },
            { text: 'Choose from Photos Instead', onPress: handlePickLibrary },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert(
          'Camera Access Required',
          'Camera access has been denied. Enable it in Settings or choose a photo from your library instead.',
          [
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
            { text: 'Choose from Photos Instead', onPress: handlePickLibrary },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      console.log('[ScanScreenshot] camera result, cancelled:', result.canceled);
      if (!result.canceled && result.assets.length > 0) {
        await handlePrepareAndSet(result.assets[0], 'camera');
      }
      // canceled: return silently
    } catch {
      Alert.alert(
        'Camera Unavailable',
        'A camera is not available on this device. Choose an existing photo instead.',
        [
          { text: 'Choose from Photos Instead', onPress: handlePickLibrary },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleReplace = async () => {
    console.log('[ScanScreenshot] replace image pressed, sourceType:', sourceType);
    // handlePrepareAndSet deletes the old file before setting the new one
    if (sourceType === 'camera') {
      await handleTakePhoto();
    } else {
      await handlePickLibrary();
    }
  };

  const handleRemove = () => {
    console.log('[ScanScreenshot] remove image pressed');
    if (preparedImageRef.current) {
      deleteTempImage(preparedImageRef.current.uri).catch(() => {});
      preparedImageRef.current = null;
    }
    setPreparedImage(null);
    setSourceType('library');
    setConsentChecked(false);
    setPrepError(null);
    reset();
  };

  const handleSubmit = async () => {
    console.log('[ScanScreenshot] submit pressed');
    if (!preparedImage || !consentChecked) return;
    isSubmittingRef.current = true;
    const scan = await submitImage(preparedImage, sourceType);
    isSubmittingRef.current = false;
    if (scan) {
      console.log('[ScanScreenshot] submit success, navigating to submission-ready');
      preparedImageRef.current = null; // hook already deleted the file on success
      setPreparedImage(null);
      setConsentChecked(false);
      router.push({
        pathname: '/(tabs)/(scan)/submission-ready',
        params: {
          inputType: scan.input_type,
          sourceType: scan.source_type,
          createdAt: scan.created_at,
        },
      });
    }
    // On error: preparedImage retained for retry (hook does NOT delete on error)
  };

  const handleConsentToggle = () => {
    setConsentChecked(prev => !prev);
  };

  const sizeKB = preparedImage ? (preparedImage.sizeBytes / 1024).toFixed(0) : '0';
  const dimensionsText = preparedImage ? `${preparedImage.width} × ${preparedImage.height}` : '';
  const sourceLabel = sourceType === 'camera' ? 'Camera' : 'Photo Library';

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: SPACING.md, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Picker buttons — shown when no image and not preparing */}
        {!preparedImage && !isPreparing && (
          <View style={{ gap: SPACING.sm, marginBottom: SPACING.md }}>
            <Pressable
              onPress={handlePickLibrary}
              accessibilityRole="button"
              accessibilityLabel="Choose from library"
              style={{
                backgroundColor: colors.surface,
                borderRadius: RADIUS.lg,
                borderWidth: 1,
                borderColor: colors.border,
                padding: SPACING.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.md,
                boxShadow: SHADOWS.sm,
              } as any}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: RADIUS.md,
                  backgroundColor: colors.primaryMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ImageIcon size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.text }]}>
                  Choose from library
                </Text>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                  Select a screenshot or photo
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handleTakePhoto}
              accessibilityRole="button"
              accessibilityLabel="Take a photo"
              style={{
                backgroundColor: colors.surface,
                borderRadius: RADIUS.lg,
                borderWidth: 1,
                borderColor: colors.border,
                padding: SPACING.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.md,
                boxShadow: SHADOWS.sm,
              } as any}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: RADIUS.md,
                  backgroundColor: colors.primaryMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Camera size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[TYPOGRAPHY.bodyMedium, { color: colors.text }]}>
                  Take a photo
                </Text>
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                  Use your camera to capture content
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Preparation loading state */}
        {isPreparing && (
          <View
            style={{
              height: 240,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
              borderRadius: RADIUS.lg,
              marginBottom: SPACING.md,
            }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginTop: SPACING.sm }]}>
              Preparing image…
            </Text>
          </View>
        )}

        {/* Preparation error state */}
        {prepError && !isPreparing && !preparedImage && (
          <View
            style={{
              marginBottom: SPACING.md,
              padding: SPACING.md,
              borderRadius: RADIUS.md,
              backgroundColor: colors.dangerMuted,
              borderWidth: 1,
              borderColor: colors.danger,
            }}
          >
            <Text style={[TYPOGRAPHY.caption, { color: colors.danger }]}>
              {prepError}
            </Text>
            <Pressable
              onPress={() => setPrepError(null)}
              accessibilityRole="button"
            >
              <Text
                style={[
                  TYPOGRAPHY.caption,
                  {
                    color: colors.danger,
                    fontWeight: '600',
                    textDecorationLine: 'underline',
                    marginTop: SPACING.xs,
                  },
                ]}
              >
                Dismiss
              </Text>
            </Pressable>
          </View>
        )}

        {/* Image preview */}
        {preparedImage && (
          <View style={{ marginBottom: SPACING.md }}>
            <Image
              source={{ uri: preparedImage.uri }}
              resizeMode="contain"
              style={{
                width: '100%',
                height: 240,
                borderRadius: RADIUS.lg,
                backgroundColor: colors.surface,
              }}
            />
            {/* Metadata row */}
            <View
              style={{
                flexDirection: 'row',
                gap: SPACING.sm,
                marginTop: SPACING.xs,
                flexWrap: 'wrap',
              }}
            >
              <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                {dimensionsText}
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                {sizeKB}
                {' KB'}
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
                {sourceLabel}
              </Text>
            </View>
            {/* Replace / Remove row */}
            <View
              style={{
                flexDirection: 'row',
                gap: SPACING.sm,
                marginTop: SPACING.sm,
              }}
            >
              <Pressable
                onPress={handleReplace}
                accessibilityRole="button"
                accessibilityLabel="Replace image"
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: SPACING.xs,
                  paddingVertical: SPACING.sm,
                  borderRadius: RADIUS.md,
                  backgroundColor: colors.surfaceSecondary,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <RefreshCw size={15} color={colors.textSecondary} />
                <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, fontWeight: '500' }]}>
                  Replace
                </Text>
              </Pressable>
              <Pressable
                onPress={handleRemove}
                accessibilityRole="button"
                accessibilityLabel="Remove image"
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: SPACING.xs,
                  paddingVertical: SPACING.sm,
                  borderRadius: RADIUS.md,
                  backgroundColor: colors.dangerMuted,
                  borderWidth: 1,
                  borderColor: colors.danger,
                }}
              >
                <X size={15} color={colors.danger} />
                <Text style={[TYPOGRAPHY.caption, { color: colors.danger, fontWeight: '500' }]}>
                  Remove
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Consent */}
        {preparedImage && (
          <View style={{ marginBottom: SPACING.md }}>
            <ConsentCheckbox
              checked={consentChecked}
              onToggle={handleConsentToggle}
              disabled={isSubmitting}
            />
          </View>
        )}

        {/* Submit button */}
        {preparedImage && (
          <PrimaryButton
            title="Upload Securely"
            onPress={handleSubmit}
            disabled={submitDisabled}
            loading={isSubmitting}
          />
        )}

        {/* Progress label */}
        {isSubmitting && stageLabel.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: SPACING.sm,
              marginTop: SPACING.sm,
            }}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
              {stageLabel}
            </Text>
          </View>
        )}

        {/* Error display */}
        {stage === 'error' && error && (
          <View
            style={{
              marginTop: SPACING.sm,
              padding: SPACING.md,
              borderRadius: RADIUS.md,
              backgroundColor: colors.dangerMuted,
              borderWidth: 1,
              borderColor: colors.danger,
              gap: SPACING.xs,
            }}
          >
            <Text style={[TYPOGRAPHY.caption, { color: colors.danger }]}>
              {error}
            </Text>
            <Pressable
              onPress={() => {
                console.log('[ScanScreenshot] try again pressed');
                reset();
              }}
              accessibilityRole="button"
              accessibilityLabel="Try Again"
            >
              <Text style={[TYPOGRAPHY.caption, { color: colors.danger, fontWeight: '600', textDecorationLine: 'underline' }]}>
                Try Again
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <AuthRequiredModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
