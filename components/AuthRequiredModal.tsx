import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { PrimaryButton, SecondaryButton } from '@/components/PrimaryButton';

interface AuthRequiredModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AuthRequiredModal({ visible, onClose }: AuthRequiredModalProps) {
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleCreateAccount = () => {
    console.log('[AuthRequiredModal] Create Account pressed');
    onClose();
    router.push('/(auth)/sign-up');
  };

  const handleSignIn = () => {
    console.log('[AuthRequiredModal] Sign In pressed');
    onClose();
    router.push('/(auth)/sign-in');
  };

  const handleNotNow = () => {
    console.log('[AuthRequiredModal] Not Now pressed');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.45)',
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: RADIUS.xl,
            borderTopRightRadius: RADIUS.xl,
            paddingTop: SPACING.lg,
            paddingBottom: insets.bottom + SPACING.lg,
            paddingHorizontal: SPACING.lg,
            gap: SPACING.md,
          }}
        >
          {/* Icon */}
          <View style={{ alignItems: 'center', marginBottom: SPACING.xs }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={28} color={colors.primary} />
            </View>
          </View>

          {/* Text */}
          <View style={{ alignItems: 'center', gap: SPACING.xs }}>
            <Text
              style={[TYPOGRAPHY.h3, { color: colors.text, textAlign: 'center' }]}
            >
              Create an account to continue
            </Text>
            <Text
              style={[
                TYPOGRAPHY.body,
                {
                  color: colors.textSecondary,
                  textAlign: 'center',
                  maxWidth: 300,
                },
              ]}
            >
              An InvisiProof account is required to securely save this information and access it across devices.
            </Text>
          </View>

          {/* Buttons */}
          <PrimaryButton title="Create Account" onPress={handleCreateAccount} />
          <SecondaryButton title="Sign In" onPress={handleSignIn} />

          {/* Not Now */}
          <TouchableOpacity
            onPress={handleNotNow}
            accessibilityRole="button"
            accessibilityLabel="Not Now"
            style={{
              alignItems: 'center',
              minHeight: 44,
              justifyContent: 'center',
            }}
          >
            <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
              Not Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
