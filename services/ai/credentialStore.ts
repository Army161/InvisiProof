import * as SecureStore from 'expo-secure-store';
import type { ProviderCredential, ProofLoopProvider } from './types';

const KEY_PREFIX = 'proofloop_ai_cred_';
const ACTIVE_PROVIDER_KEY = 'proofloop_ai_active_provider';

function credKey(provider: ProofLoopProvider): string {
  return `${KEY_PREFIX}${provider}`;
}

export async function saveCredential(cred: ProviderCredential): Promise<void> {
  console.log('[credentialStore] saveCredential:', cred.provider);
  await SecureStore.setItemAsync(credKey(cred.provider), JSON.stringify(cred));
}

export async function loadCredential(provider: ProofLoopProvider): Promise<ProviderCredential | null> {
  try {
    const raw = await SecureStore.getItemAsync(credKey(provider));
    if (!raw) return null;
    return JSON.parse(raw) as ProviderCredential;
  } catch {
    return null;
  }
}

export async function deleteCredential(provider: ProofLoopProvider): Promise<void> {
  console.log('[credentialStore] deleteCredential:', provider);
  await SecureStore.deleteItemAsync(credKey(provider));
}

export async function saveActiveProvider(provider: ProofLoopProvider): Promise<void> {
  console.log('[credentialStore] saveActiveProvider:', provider);
  await SecureStore.setItemAsync(ACTIVE_PROVIDER_KEY, provider);
}

export async function loadActiveProvider(): Promise<ProofLoopProvider> {
  try {
    const raw = await SecureStore.getItemAsync(ACTIVE_PROVIDER_KEY);
    if (raw && ['local', 'openai', 'anthropic', 'gemini', 'grok', 'custom'].includes(raw)) {
      return raw as ProofLoopProvider;
    }
  } catch {}
  return 'local';
}

export async function hasCredential(provider: ProofLoopProvider): Promise<boolean> {
  const cred = await loadCredential(provider);
  return cred !== null && cred.apiKey.length > 0;
}
