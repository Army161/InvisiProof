import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Key, Cpu, Cloud, X, Trash2 } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { InfoCard } from '@/components/InfoCard';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { PrimaryButton, SecondaryButton } from '@/components/PrimaryButton';
import { Divider } from '@/components/Divider';
import {
  loadActiveProvider,
  saveActiveProvider,
  loadCredential,
  saveCredential,
  deleteCredential,
  hasCredential,
  isLocalAvailable,
  getLocalUnavailableReason,
} from '@/services/ai';
import type { InvisiProofProvider, ProviderCredential } from '@/services/ai';

interface ProviderMeta {
  id: InvisiProofProvider;
  name: string;
  description: string;
  isByok: boolean;
  showCustomUrl: boolean;
  modelPlaceholder?: string;
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: 'local',
    name: 'InvisiProof Local',
    description: 'On-device analysis. No API key required. Coming soon.',
    isByok: false,
    showCustomUrl: false,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o and other OpenAI models.',
    isByok: true,
    showCustomUrl: false,
    modelPlaceholder: 'gpt-4o (default)',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude 3.5 Sonnet and other Anthropic models.',
    isByok: true,
    showCustomUrl: false,
    modelPlaceholder: 'claude-3-5-sonnet-20241022 (default)',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini 1.5 Pro and other Google models.',
    isByok: true,
    showCustomUrl: false,
    modelPlaceholder: 'gemini-1.5-pro (default)',
  },
  {
    id: 'grok',
    name: 'xAI Grok',
    description: 'Grok models from xAI.',
    isByok: true,
    showCustomUrl: false,
    modelPlaceholder: 'grok-2-latest (default)',
  },
  {
    id: 'custom',
    name: 'Custom (OpenAI-compatible)',
    description: 'Any OpenAI-compatible API endpoint.',
    isByok: true,
    showCustomUrl: true,
    modelPlaceholder: 'e.g. llama-3.1-70b',
  },
];

const FREE_PROVIDERS = PROVIDERS.filter(p => !p.isByok);
const BYOK_PROVIDERS = PROVIDERS.filter(p => p.isByok);

interface ConfiguredState {
  [key: string]: boolean;
}

export default function AIProviderScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activeProvider, setActiveProvider] = useState<InvisiProofProvider>('local');
  const [configuredState, setConfiguredState] = useState<ConfiguredState>({});
  const [loadingInit, setLoadingInit] = useState(true);

  // Modal state
  const [modalProvider, setModalProvider] = useState<ProviderMeta | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    console.log('[AIProviderScreen] loadState called');
    const [provider, ...credChecks] = await Promise.all([
      loadActiveProvider(),
      ...BYOK_PROVIDERS.map(p => hasCredential(p.id)),
    ]);
    setActiveProvider(provider);
    const state: ConfiguredState = {};
    BYOK_PROVIDERS.forEach((p, i) => {
      state[p.id] = credChecks[i];
    });
    setConfiguredState(state);
  }, []);

  useEffect(() => {
    loadState().finally(() => setLoadingInit(false));
  }, [loadState]);

  const handleSelectProvider = async (provider: ProviderMeta) => {
    if (provider.id === 'local' && !isLocalAvailable()) {
      console.log('[AIProviderScreen] local provider selected but unavailable');
      Alert.alert('Coming Soon', getLocalUnavailableReason());
      return;
    }
    if (provider.isByok && !configuredState[provider.id]) {
      console.log('[AIProviderScreen] byok provider selected but not configured, opening modal:', provider.id);
      openConfigModal(provider);
      return;
    }
    console.log('[AIProviderScreen] active provider changed to:', provider.id);
    await saveActiveProvider(provider.id);
    setActiveProvider(provider.id);
  };

  const openConfigModal = async (provider: ProviderMeta) => {
    console.log('[AIProviderScreen] openConfigModal:', provider.id);
    const existing = await loadCredential(provider.id);
    setApiKeyInput(existing?.apiKey ?? '');
    setModelInput(existing?.model ?? '');
    setCustomUrlInput(existing?.customBaseUrl ?? '');
    setModalError(null);
    setModalProvider(provider);
  };

  const handleCloseModal = () => {
    console.log('[AIProviderScreen] modal closed');
    setModalProvider(null);
    setApiKeyInput('');
    setModelInput('');
    setCustomUrlInput('');
    setModalError(null);
  };

  const handleSaveCredential = async () => {
    if (!modalProvider) return;
    const trimmedKey = apiKeyInput.trim();
    if (!trimmedKey) {
      setModalError('API key is required.');
      return;
    }
    if (modalProvider.showCustomUrl && !customUrlInput.trim()) {
      setModalError('Base URL is required for custom providers.');
      return;
    }
    console.log('[AIProviderScreen] save credential pressed for:', modalProvider.id);
    setModalSaving(true);
    setModalError(null);
    try {
      const cred: ProviderCredential = {
        provider: modalProvider.id,
        apiKey: trimmedKey,
      };
      if (modelInput.trim()) cred.model = modelInput.trim();
      if (modalProvider.showCustomUrl && customUrlInput.trim()) {
        cred.customBaseUrl = customUrlInput.trim();
      }
      await saveCredential(cred);
      setConfiguredState(prev => ({ ...prev, [modalProvider.id]: true }));
      // Auto-select this provider after saving
      await saveActiveProvider(modalProvider.id);
      setActiveProvider(modalProvider.id);
      console.log('[AIProviderScreen] credential saved, provider set to:', modalProvider.id);
      handleCloseModal();
    } catch {
      console.log('[AIProviderScreen] save credential failed');
      setModalError('Could not save your API key. Please try again.');
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeleteCredential = (provider: ProviderMeta) => {
    console.log('[AIProviderScreen] delete credential pressed for:', provider.id);
    Alert.alert(
      `Remove ${provider.name} key?`,
      'Your API key will be deleted from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            console.log('[AIProviderScreen] delete credential confirmed for:', provider.id);
            await deleteCredential(provider.id);
            setConfiguredState(prev => ({ ...prev, [provider.id]: false }));
            if (activeProvider === provider.id) {
              await saveActiveProvider('local');
              setActiveProvider('local');
            }
          },
        },
      ]
    );
  };

  if (loadingInit) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const localAvailable = isLocalAvailable();

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          paddingHorizontal: SPACING.md,
          paddingTop: SPACING.md,
          paddingBottom: insets.bottom + 100,
          gap: SPACING.lg,
        }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle */}
        <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
          Choose how InvisiProof analyzes your submissions.
        </Text>

        {/* Free section */}
        <View style={{ gap: SPACING.sm }}>
          <Text
            style={[
              TYPOGRAPHY.label,
              {
                color: colors.textSecondary,
                textTransform: 'uppercase',
                paddingHorizontal: SPACING.xs,
              },
            ]}
          >
            Free
          </Text>
          <InfoCard style={{ padding: 0, paddingHorizontal: SPACING.md }}>
            {FREE_PROVIDERS.map((provider, i) => (
              <View key={provider.id}>
                <ProviderRow
                  provider={provider}
                  isActive={activeProvider === provider.id}
                  isConfigured={false}
                  isAvailable={localAvailable}
                  onSelect={() => handleSelectProvider(provider)}
                  onConfigure={() => openConfigModal(provider)}
                  onDelete={() => handleDeleteCredential(provider)}
                  colors={colors}
                />
                {i < FREE_PROVIDERS.length - 1 && <Divider inset={36} />}
              </View>
            ))}
          </InfoCard>
        </View>

        {/* BYOK section */}
        <View style={{ gap: SPACING.sm }}>
          <Text
            style={[
              TYPOGRAPHY.label,
              {
                color: colors.textSecondary,
                textTransform: 'uppercase',
                paddingHorizontal: SPACING.xs,
              },
            ]}
          >
            Bring Your Own Key (BYOK)
          </Text>
          <InfoCard style={{ padding: 0, paddingHorizontal: SPACING.md }}>
            {BYOK_PROVIDERS.map((provider, i) => (
              <View key={provider.id}>
                <ProviderRow
                  provider={provider}
                  isActive={activeProvider === provider.id}
                  isConfigured={!!configuredState[provider.id]}
                  isAvailable
                  onSelect={() => handleSelectProvider(provider)}
                  onConfigure={() => openConfigModal(provider)}
                  onDelete={() => handleDeleteCredential(provider)}
                  colors={colors}
                />
                {i < BYOK_PROVIDERS.length - 1 && <Divider inset={36} />}
              </View>
            ))}
          </InfoCard>
        </View>

        {/* Footer disclaimer */}
        <InfoCard style={{ backgroundColor: colors.surfaceSecondary }}>
          <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, lineHeight: 18 }]}>
            Your API key is transmitted securely to InvisiProof's backend for the duration of the analysis request only. It is never stored on our servers.
          </Text>
        </InfoCard>
      </ScrollView>

      {/* Configure Modal */}
      <Modal
        visible={modalProvider !== null}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
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
              paddingBottom: insets.bottom + SPACING.lg,
              paddingHorizontal: SPACING.md,
            } as any}
          >
            {/* Modal header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: SPACING.lg,
              }}
            >
              <Text style={[TYPOGRAPHY.h3, { color: colors.text, flex: 1 }]}>
                {modalProvider ? `Configure ${modalProvider.name}` : ''}
              </Text>
              <AnimatedPressable
                onPress={handleCloseModal}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.surfaceSecondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} color={colors.textSecondary} />
              </AnimatedPressable>
            </View>

            {/* API Key field */}
            <View style={{ gap: SPACING.xs, marginBottom: SPACING.md }}>
              <Text style={[TYPOGRAPHY.label, { color: colors.textSecondary, textTransform: 'uppercase' }]}>
                API Key
              </Text>
              <TextInput
                value={apiKeyInput}
                onChangeText={text => {
                  console.log('[AIProviderScreen] api key input changed');
                  setApiKeyInput(text);
                }}
                placeholder="sk-..."
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  TYPOGRAPHY.body,
                  {
                    color: colors.text,
                    backgroundColor: colors.surfaceSecondary,
                    borderRadius: RADIUS.md,
                    padding: SPACING.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                ]}
              />
            </View>

            {/* Model field */}
            <View style={{ gap: SPACING.xs, marginBottom: SPACING.md }}>
              <Text style={[TYPOGRAPHY.label, { color: colors.textSecondary, textTransform: 'uppercase' }]}>
                Model (optional)
              </Text>
              <TextInput
                value={modelInput}
                onChangeText={text => {
                  console.log('[AIProviderScreen] model input changed');
                  setModelInput(text);
                }}
                placeholder={modalProvider?.modelPlaceholder ?? 'Leave blank for default'}
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  TYPOGRAPHY.body,
                  {
                    color: colors.text,
                    backgroundColor: colors.surfaceSecondary,
                    borderRadius: RADIUS.md,
                    padding: SPACING.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                ]}
              />
            </View>

            {/* Custom URL field — only for custom provider */}
            {modalProvider?.showCustomUrl ? (
              <View style={{ gap: SPACING.xs, marginBottom: SPACING.md }}>
                <Text style={[TYPOGRAPHY.label, { color: colors.textSecondary, textTransform: 'uppercase' }]}>
                  Base URL
                </Text>
                <TextInput
                  value={customUrlInput}
                  onChangeText={text => {
                    console.log('[AIProviderScreen] custom url input changed');
                    setCustomUrlInput(text);
                  }}
                  placeholder="https://api.example.com/v1"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  style={[
                    TYPOGRAPHY.body,
                    {
                      color: colors.text,
                      backgroundColor: colors.surfaceSecondary,
                      borderRadius: RADIUS.md,
                      padding: SPACING.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                  ]}
                />
              </View>
            ) : null}

            {/* Error */}
            {modalError ? (
              <Text style={[TYPOGRAPHY.caption, { color: colors.danger, marginBottom: SPACING.sm }]}>
                {modalError}
              </Text>
            ) : null}

            {/* Actions */}
            <View style={{ gap: SPACING.sm }}>
              <PrimaryButton
                title="Save"
                onPress={handleSaveCredential}
                loading={modalSaving}
              />
              {modalProvider && configuredState[modalProvider.id] ? (
                <SecondaryButton
                  title="Remove Key"
                  onPress={() => {
                    if (modalProvider) {
                      handleCloseModal();
                      handleDeleteCredential(modalProvider);
                    }
                  }}
                />
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

interface ProviderRowProps {
  provider: ProviderMeta;
  isActive: boolean;
  isConfigured: boolean;
  isAvailable: boolean;
  onSelect: () => void;
  onConfigure: () => void;
  onDelete: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}

function ProviderRow({
  provider,
  isActive,
  isConfigured,
  isAvailable,
  onSelect,
  onConfigure,
  onDelete,
  colors,
}: ProviderRowProps) {
  const isLocal = provider.id === 'local';
  const isDisabled = isLocal && !isAvailable;

  const ProviderIcon = isLocal ? Cpu : Cloud;
  const iconColor = isDisabled ? colors.textTertiary : isActive ? colors.primary : colors.textSecondary;

  const comingSoonBadge = isLocal && !isAvailable ? (
    <View
      style={{
        backgroundColor: colors.surfaceSecondary,
        borderRadius: RADIUS.sm,
        paddingHorizontal: 8,
        paddingVertical: 3,
      }}
    >
      <Text style={[TYPOGRAPHY.micro, { color: colors.textTertiary }]}>
        Coming soon
      </Text>
    </View>
  ) : null;

  const configuredBadge = provider.isByok && isConfigured ? (
    <View
      style={{
        backgroundColor: colors.evidenceMuted,
        borderRadius: RADIUS.sm,
        paddingHorizontal: 8,
        paddingVertical: 3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <Check size={11} color={colors.evidence} />
      <Text style={[TYPOGRAPHY.micro, { color: colors.evidence }]}>
        Configured
      </Text>
    </View>
  ) : null;

  return (
    <AnimatedPressable
      onPress={isDisabled ? undefined : onSelect}
      accessibilityRole="radio"
      accessibilityLabel={provider.name}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 64,
        gap: SPACING.md,
        paddingVertical: SPACING.sm,
        opacity: isDisabled ? 0.5 : 1,
      }}
    >
      {/* Icon */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: RADIUS.md,
          backgroundColor: isActive ? colors.primaryMuted : colors.surfaceSecondary,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <ProviderIcon size={18} color={iconColor} />
      </View>

      {/* Text */}
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' }}>
          <Text
            style={[
              TYPOGRAPHY.bodyMedium,
              { color: isDisabled ? colors.textTertiary : colors.text, fontWeight: '600' },
            ]}
          >
            {provider.name}
          </Text>
          {comingSoonBadge}
          {configuredBadge}
        </View>
        <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]} numberOfLines={2}>
          {provider.description}
        </Text>
      </View>

      {/* Right side */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
        {provider.isByok ? (
          <AnimatedPressable
            onPress={e => {
              e.stopPropagation?.();
              console.log('[AIProviderScreen] configure button pressed for:', provider.id);
              onConfigure();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Configure ${provider.name}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: colors.surfaceSecondary,
              borderRadius: RADIUS.sm,
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
          >
            <Key size={13} color={colors.textSecondary} />
            <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, fontWeight: '600' }]}>
              {isConfigured ? 'Edit' : 'Add key'}
            </Text>
          </AnimatedPressable>
        ) : null}

        {isActive ? (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={14} color="#FFFFFF" />
          </View>
        ) : (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: colors.border,
            }}
          />
        )}
      </View>
    </AnimatedPressable>
  );
}
