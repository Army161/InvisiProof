import React, { useState } from 'react';
import { View, Text, ScrollView, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  Palette,
  Bell,
  Shield,
  AlertTriangle,
  HelpCircle,
  FileText,
  BookOpen,
  Info,
  ChevronRight,
  Check,
  LogOut,
  UserCog,
  Trash2,
  Cpu,
  CreditCard,
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuth } from '@/contexts/AuthContext';
import type { AppearanceMode } from '@/contexts/ThemeContext';
import { trackAccountDeleted } from '@/services/analytics';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/constants/theme';
import { InfoCard } from '@/components/InfoCard';
import { Divider } from '@/components/Divider';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { PrimaryButton, SecondaryButton } from '@/components/PrimaryButton';

interface SettingsRowProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  onPress?: () => void;
  rightValue?: string;
  showChevron?: boolean;
  destructive?: boolean;
}

function SettingsRow({
  icon: Icon,
  label,
  onPress,
  rightValue,
  showChevron = true,
  destructive = false,
}: SettingsRowProps) {
  const { colors } = useAppTheme();
  const textColor = destructive ? colors.danger : colors.text;
  const iconColor = destructive ? colors.danger : colors.textSecondary;

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 52,
        gap: SPACING.md,
        paddingVertical: SPACING.sm,
      }}
    >
      <Icon size={20} color={iconColor} />
      <Text style={[TYPOGRAPHY.body, { color: textColor, flex: 1 }]}>{label}</Text>
      {rightValue ? (
        <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>{rightValue}</Text>
      ) : null}
      {showChevron && !rightValue ? (
        <ChevronRight size={18} color={colors.textTertiary} />
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <AnimatedPressable
      onPress={() => {
        console.log('[ProfileScreen] settings row pressed:', label);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {content}
    </AnimatedPressable>
  );
}

interface SettingsSectionProps {
  title: string;
  rows: React.ReactNode[];
}

function SettingsSection({ title, rows }: SettingsSectionProps) {
  const { colors } = useAppTheme();

  return (
    <View style={{ marginBottom: SPACING.lg }}>
      <Text
        style={[
          TYPOGRAPHY.label,
          {
            color: colors.textSecondary,
            textTransform: 'uppercase',
            marginBottom: SPACING.sm,
            paddingHorizontal: SPACING.xs,
          },
        ]}
      >
        {title}
      </Text>
      <InfoCard style={{ padding: 0, paddingHorizontal: SPACING.md }}>
        {rows.map((row, i) => (
          <View key={i}>
            {row}
            {i < rows.length - 1 && <Divider inset={36} />}
          </View>
        ))}
      </InfoCard>
    </View>
  );
}

const APPEARANCE_OPTIONS: { key: AppearanceMode; label: string }[] = [
  { key: 'system', label: 'System default' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

function AuthenticatedProfileCard() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { user, profile, profileLoading, profileError, fetchProfile } = useAuth();

  const displayName = profile?.display_name ?? user?.user_metadata?.display_name ?? 'InvisiProof User';
  const email = profile?.email ?? user?.email ?? '';
  const initial = String(displayName).charAt(0).toUpperCase();

  const memberSinceDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;
  const memberSinceText = memberSinceDate ? `Member since ${memberSinceDate}` : null;

  const handleRetry = () => {
    console.log('[ProfileScreen] profile error retry pressed');
    fetchProfile();
  };

  const handleEditProfile = () => {
    console.log('[ProfileScreen] Edit Profile button pressed from card');
    router.push('/(tabs)/(profile)/edit-profile');
  };

  return (
    <InfoCard>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
        {/* Initials circle */}
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Text
            style={[
              TYPOGRAPHY.h2,
              { color: colors.primary, fontWeight: '700' },
            ]}
          >
            {initial}
          </Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[TYPOGRAPHY.h3, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text
            style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {email}
          </Text>

          {/* Member since */}
          {profileLoading && !profile ? (
            <View
              style={{
                backgroundColor: colors.surfaceSecondary,
                borderRadius: RADIUS.md,
                height: 16,
                width: 120,
                marginTop: 4,
              }}
            />
          ) : memberSinceText ? (
            <Text style={[TYPOGRAPHY.caption, { color: colors.textTertiary, marginTop: 2 }]}>
              {memberSinceText}
            </Text>
          ) : null}

          <View style={{ marginTop: 4 }}>
            <View
              style={{
                backgroundColor: colors.evidenceMuted,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
                alignSelf: 'flex-start',
              }}
            >
              <Text style={[TYPOGRAPHY.micro, { color: colors.evidence }]}>
                Account active
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Profile error warning */}
      {profileError ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: SPACING.md,
            backgroundColor: colors.warningMuted,
            borderRadius: RADIUS.sm,
            paddingHorizontal: SPACING.sm,
            paddingVertical: SPACING.xs,
            gap: SPACING.sm,
          }}
        >
          <Text
            style={[TYPOGRAPHY.caption, { color: colors.warning, flex: 1 }]}
            numberOfLines={2}
          >
            {profileError}
          </Text>
          <AnimatedPressable
            onPress={handleRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry loading profile"
            style={{
              paddingHorizontal: SPACING.sm,
              paddingVertical: SPACING.xs,
              minHeight: 44,
              justifyContent: 'center',
            }}
          >
            <Text style={[TYPOGRAPHY.caption, { color: colors.warning, fontWeight: '600' }]}>
              Retry
            </Text>
          </AnimatedPressable>
        </View>
      ) : null}

      {/* Edit Profile button */}
      <View style={{ marginTop: SPACING.md }}>
        <SecondaryButton
          title="Edit Profile"
          onPress={handleEditProfile}
        />
      </View>
    </InfoCard>
  );
}

function GuestProfileCard() {
  const { colors } = useAppTheme();
  const router = useRouter();

  return (
    <InfoCard>
      <View style={{ alignItems: 'center', paddingVertical: SPACING.md, gap: SPACING.md }}>
        <User size={32} color={colors.textTertiary} />
        <View style={{ alignItems: 'center', gap: SPACING.xs }}>
          <Text style={[TYPOGRAPHY.h3, { color: colors.text, textAlign: 'center' }]}>
            Your InvisiProof account
          </Text>
          <Text
            style={[
              TYPOGRAPHY.body,
              { color: colors.textSecondary, textAlign: 'center', maxWidth: 280 },
            ]}
          >
            Sign in or create an account to save reports, manage proof requests, and access your data across devices.
          </Text>
        </View>
        <View style={{ width: '100%', gap: SPACING.sm }}>
          <PrimaryButton
            title="Create Account"
            onPress={() => {
              console.log('[ProfileScreen] Create Account pressed from guest card');
              router.push('/(auth)/sign-up');
            }}
          />
          <SecondaryButton
            title="Sign In"
            onPress={() => {
              console.log('[ProfileScreen] Sign In pressed from guest card');
              router.push('/(auth)/sign-in');
            }}
          />
        </View>
      </View>
    </InfoCard>
  );
}

export default function ProfileScreen() {
  const { colors, appearanceMode, setAppearanceMode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isGuest, signOut } = useAuth();
  const [appearanceModalVisible, setAppearanceModalVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const isAuthenticated = !!user;

  const handleAppearanceSelect = (mode: AppearanceMode) => {
    console.log('[ProfileScreen] appearance mode selected:', mode);
    setAppearanceMode(mode);
  };

  const handleDoneAppearance = () => {
    console.log('[ProfileScreen] appearance modal closed');
    setAppearanceModalVisible(false);
  };

  const handleSignOut = () => {
    console.log('[ProfileScreen] sign out row pressed');
    Alert.alert(
      'Sign out of InvisiProof?',
      'You will need to sign in again to access your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            console.log('[ProfileScreen] sign out confirmed');
            try {
              await signOut();
              router.replace('/(auth)/welcome');
            } catch {
              console.log('[ProfileScreen] sign out error');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    console.log('[ProfileScreen] delete account row pressed');
    Alert.alert(
      'Delete your account?',
      'This will permanently delete your account, all scans, images, and assessment results. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            console.log('[ProfileScreen] delete account confirmed');
            if (!user) return;
            setDeletingAccount(true);
            try {
              const { deleteAccount } = await import('@/services/deleteAccountService');
              const result = await deleteAccount();
              if (!result.success) {
                console.log('[ProfileScreen] delete account failed');
                Alert.alert('Error', result.error ?? 'Could not delete your account. Please try again.');
                return;
              }
              console.log('[ProfileScreen] delete account success');
              trackAccountDeleted();
              await signOut();
              router.replace('/(auth)/welcome');
            } catch {
              console.log('[ProfileScreen] delete account unexpected error');
              Alert.alert('Error', 'Could not delete your account. Please try again.');
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
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
          <Text style={[TYPOGRAPHY.h1, { color: colors.text }]}>Profile</Text>
        </View>

        {/* Profile card */}
        <View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.xl }}>
          {isAuthenticated ? <AuthenticatedProfileCard /> : <GuestProfileCard />}
        </View>

        {/* Settings sections */}
        <View style={{ paddingHorizontal: SPACING.md }}>
          {/* Account section — only for authenticated users */}
          {isAuthenticated ? (
            <SettingsSection
              title="Account"
              rows={[
                <SettingsRow
                  key="edit-profile"
                  icon={UserCog}
                  label="Edit Profile"
                  onPress={() => router.push('/(tabs)/(profile)/edit-profile')}
                />,
                <SettingsRow
                  key="subscription"
                  icon={CreditCard}
                  label="Subscription & Billing"
                  onPress={() => router.push('/(tabs)/(profile)/subscription')}
                />,
                <SettingsRow
                  key="sign-out"
                  icon={LogOut}
                  label="Sign Out"
                  destructive
                  onPress={handleSignOut}
                />,
                <SettingsRow
                  key="delete-account"
                  icon={Trash2}
                  label={deletingAccount ? 'Deleting…' : 'Delete Account'}
                  destructive
                  onPress={deletingAccount ? undefined : handleDeleteAccount}
                />,
              ]}
            />
          ) : null}

          <SettingsSection
            title="Preferences"
            rows={[
              <SettingsRow
                key="appearance"
                icon={Palette}
                label="Appearance"
                onPress={() => {
                  console.log('[ProfileScreen] open appearance modal');
                  setAppearanceModalVisible(true);
                }}
              />,
              <SettingsRow
                key="ai-provider"
                icon={Cpu}
                label="AI Provider"
                onPress={() => router.push('/(tabs)/(profile)/ai-provider')}
              />,
              <SettingsRow
                key="notifications"
                icon={Bell}
                label="Notifications"
                onPress={() => router.push('/(tabs)/(profile)/notifications')}
              />,
            ]}
          />

          <SettingsSection
            title="Privacy & Safety"
            rows={[
              <SettingsRow
                key="privacy"
                icon={Shield}
                label="Privacy"
                onPress={() => router.push('/(tabs)/(profile)/privacy')}
              />,
              <SettingsRow
                key="safety"
                icon={AlertTriangle}
                label="Safety Disclaimer"
                onPress={() => router.push('/(tabs)/(profile)/safety-disclaimer')}
              />,
            ]}
          />

          <SettingsSection
            title="Support"
            rows={[
              <SettingsRow
                key="help"
                icon={HelpCircle}
                label="Help & Support"
                onPress={() => router.push('/(tabs)/(profile)/help-support')}
              />,
            ]}
          />

          <SettingsSection
            title="Legal"
            rows={[
              <SettingsRow
                key="privacy-policy"
                icon={FileText}
                label="Privacy Policy"
                onPress={() => router.push('/(tabs)/(profile)/privacy-policy')}
              />,
              <SettingsRow
                key="terms"
                icon={BookOpen}
                label="Terms of Use"
                onPress={() => router.push('/(tabs)/(profile)/terms-of-use')}
              />,
            ]}
          />

          <SettingsSection
            title="About"
            rows={[
              <SettingsRow
                key="version"
                icon={Info}
                label="App Version"
                rightValue="1.0.0"
                showChevron={false}
              />,
            ]}
          />
        </View>
      </ScrollView>

      {/* Appearance Modal */}
      <Modal
        visible={appearanceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleDoneAppearance}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: RADIUS.xl,
              borderTopRightRadius: RADIUS.xl,
              paddingTop: SPACING.md,
              paddingBottom: insets.bottom + SPACING.md,
              paddingHorizontal: SPACING.md,
              boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
            } as any}
          >
            <Text
              style={[
                TYPOGRAPHY.h3,
                { color: colors.text, textAlign: 'center', marginBottom: SPACING.lg },
              ]}
            >
              Appearance
            </Text>

            <InfoCard style={{ padding: 0, paddingHorizontal: SPACING.md, marginBottom: SPACING.lg }}>
              {APPEARANCE_OPTIONS.map((opt, i) => (
                <View key={opt.key}>
                  <AnimatedPressable
                    onPress={() => handleAppearanceSelect(opt.key)}
                    accessibilityRole="radio"
                    accessibilityLabel={opt.label}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      minHeight: 52,
                      gap: SPACING.md,
                    }}
                  >
                    <Text style={[TYPOGRAPHY.body, { color: colors.text, flex: 1 }]}>
                      {opt.label}
                    </Text>
                    {appearanceMode === opt.key ? (
                      <Check size={20} color={colors.primary} />
                    ) : null}
                  </AnimatedPressable>
                  {i < APPEARANCE_OPTIONS.length - 1 && <Divider />}
                </View>
              ))}
            </InfoCard>

            <PrimaryButton title="Done" onPress={handleDoneAppearance} />
          </View>
        </View>
      </Modal>
    </>
  );
}
