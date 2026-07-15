import React, { useState } from 'react';
import { View, Text, ScrollView, Modal } from 'react-native';
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
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { AppearanceMode } from '@/contexts/ThemeContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/constants/theme';
import { InfoCard } from '@/components/InfoCard';
import { Divider } from '@/components/Divider';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { PrimaryButton } from '@/components/PrimaryButton';

interface SettingsRowProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  onPress?: () => void;
  rightValue?: string;
  showChevron?: boolean;
}

function SettingsRow({ icon: Icon, label, onPress, rightValue, showChevron = true }: SettingsRowProps) {
  const { colors } = useAppTheme();

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
      <Icon size={20} color={colors.textSecondary} />
      <Text style={[TYPOGRAPHY.body, { color: colors.text, flex: 1 }]}>{label}</Text>
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

export default function ProfileScreen() {
  const { colors, appearanceMode, setAppearanceMode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [appearanceModalVisible, setAppearanceModalVisible] = useState(false);

  const handleAppearanceSelect = (mode: AppearanceMode) => {
    console.log('[ProfileScreen] appearance mode selected:', mode);
    setAppearanceMode(mode);
  };

  const handleDoneAppearance = () => {
    console.log('[ProfileScreen] appearance modal closed');
    setAppearanceModalVisible(false);
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

        {/* Unauthenticated profile card */}
        <View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.xl }}>
          <InfoCard>
            <View style={{ alignItems: 'center', paddingVertical: SPACING.md, gap: SPACING.md }}>
              <User size={32} color={colors.textTertiary} />
              <View style={{ alignItems: 'center', gap: SPACING.xs }}>
                <Text style={[TYPOGRAPHY.h3, { color: colors.text, textAlign: 'center' }]}>
                  Your ProofLoop account
                </Text>
                <Text
                  style={[
                    TYPOGRAPHY.body,
                    { color: colors.textSecondary, textAlign: 'center', maxWidth: 280 },
                  ]}
                >
                  Account creation, secure report history, and cross-device access will be added in the authentication phase.
                </Text>
              </View>
            </View>
          </InfoCard>
        </View>

        {/* Settings sections */}
        <View style={{ paddingHorizontal: SPACING.md }}>
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
