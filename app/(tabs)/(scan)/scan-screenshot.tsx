import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
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
import { deleteTempImage } from '@/utils/imagePrep';
import type { ImageSourcePropType } from 'react-native';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function ScanScreenshotScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const { stage, stageLabel, error, submitImage, reset } = useSubmitScan();

  const [selectedAsset, setSelectedAsset] = useState<ImagePickerAsset | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sourceType, setSourceType] = useState<'camera' | 'library'>('library');

  const isGuestOrNoUser = isGuest || !user;
  const isSubmitting = stage === 'preparing' || stage === 'uploading' || stage === 'saving';
  const submitDisabled = !selectedAsset || !consentChecked || stage !== 'idle';

  // Android: recover pending picker result after activity recreation
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pending = await ImagePicker.getPendingResultAsync();
        if (cancelled) return;
        if (
          pending &&
          'canceled' in pending &&
          !pending.canceled &&
          'assets' in pending &&
          pending.assets &&
          pending.assets.length > 0
        ) {
          // Only process if we don't already have a selected asset
          setSelectedAsset(prev => {
            if (prev) return prev; // already have one, don't overwrite
            return (pending as ImagePicker.ImagePickerSuccessResult).assets[0];
          });
          setSourceType('library');
          setConsentChecked(false);
        }
      } catch {
        // getPendingResultAsync not supported on this platform — ignore
      }
    })();
    return () => { cancelled = true; };
  }, []); // run once on mount

  // Cleanup temp file on unmount
  useEffect(() => {
    return () => {
      if (selectedAsset?.uri) {
        deleteTempImage(selectedAsset.uri).catch(() => {});
      }
    };
  }, [selectedAsset]);

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
      setSelectedAsset(result.assets[0]);
      setSourceType('library');
      setConsentChecked(false);
      reset();
    }
  };

  const handleTakePhoto = async () => {
    console.log('[ScanScreenshot] take photo pressed');
    if (isGuestOrNoUser) {
      setShowAuthModal(true);
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    console.log('[ScanScreenshot] camera permission status:', status);
    if (status !== 'granted') {
      if (status === 'denied') {
        // Can potentially re-request — just inform
        Alert.alert(
          'Camera Access Needed',
          'Camera permission is required to take a photo.',
          [{ text: 'OK' }]
        );
      } else {
        // 'blocked' or 'undetermined' after denial — must open Settings
        Alert.alert(
          'Camera Access Blocked',
          'Camera access has been denied. You can enable it in Settings or choose a photo from your library instead.',
          [
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
            { text: 'Choose from Photos', onPress: handlePickLibrary },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    console.log('[ScanScreenshot] camera result, cancelled:', result.canceled);
    if (!result.canceled && result.assets.length > 0) {
      setSelectedAsset(result.assets[0]);
      setSourceType('camera');
      setConsentChecked(false);
      reset();
    }
  };

  const handleReplace = async () => {
    console.log('[ScanScreenshot] replace image pressed, sourceType:', sourceType);
    const prevUri = selectedAsset?.uri;
    if (prevUri) deleteTempImage(prevUri).catch(() => {});
    if (sourceType === 'camera') {
      await handleTakePhoto();
    } else {
      await handlePickLibrary();
    }
  };

  const handleRemove = () => {
    console.log('[ScanScreenshot] remove image pressed');
    if (selectedAsset?.uri) {
      deleteTempImage(selectedAsset.uri).catch(() => {});
    }
    setSelectedAsset(null);
    setConsentChecked(false);
    reset();
  };

  const handleSubmit = async () => {
    console.log('[ScanScreenshot] submit pressed');
    if (!selectedAsset) return;
    const scan = await submitImage(selectedAsset, sourceType);
    if (scan) {
      console.log('[ScanScreenshot] submit success, navigating to submission-ready');
      router.push({
        pathname: '/(tabs)/(scan)/submission-ready',
        params: {
          inputType: scan.input_type,
          sourceType: scan.source_type,
          createdAt: scan.created_at,
        },
      });
    }
  };

  const handleConsentToggle = () => {
    setConsentChecked(prev => !prev);
  };

  const imageUri = selectedAsset?.uri ?? '';

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: SPACING.md, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Picker buttons */}
        {!selectedAsset && (
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

        {/* Image preview */}
        {selectedAsset && (
          <View style={{ marginBottom: SPACING.md }}>
            <Image
              source={resolveImageSource(imageUri)}
              resizeMode="contain"
              style={{
                width: '100%',
                height: 240,
                borderRadius: RADIUS.lg,
                backgroundColor: colors.surface,
              }}
            />
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
        {selectedAsset && (
          <View style={{ marginBottom: SPACING.md }}>
            <ConsentCheckbox
              checked={consentChecked}
              onToggle={handleConsentToggle}
              disabled={isSubmitting}
            />
          </View>
        )}

        {/* Submit button */}
        {selectedAsset && (
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
