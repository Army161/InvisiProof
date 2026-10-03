import { supabase } from '@/lib/supabase';
import type { ProviderCredential, NormalizedAssessment } from './types';

const SUPABASE_URL = 'https://kmipbsotthgigkndazot.supabase.co';

/**
 * Runs analysis in the analyze-scan edge function.
 * With a credential, the user's own key is used (BYOK).
 * Without one, the function uses InvisiProof's built-in server key.
 */
export async function runCloudAnalysis(
  scanId: string,
  credential: ProviderCredential | null,
): Promise<NormalizedAssessment> {
  console.log('[cloudProvider] runCloudAnalysis called, provider:', credential?.provider ?? 'built-in');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Your session has expired. Please sign in again.');

  const body: Record<string, string> = { scan_id: scanId };
  if (credential) {
    body.provider = credential.provider;
    body.api_key = credential.apiKey;
    if (credential.model) body.model = credential.model;
    if (credential.customBaseUrl) body.custom_base_url = credential.customBaseUrl;
  } else {
    body.provider = 'invisiproof';
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    console.log('[cloudProvider] runCloudAnalysis failed, status:', response.status);
    if (response.status === 429) throw new Error('Analysis limit reached. Please try again later.');
    if (response.status === 409) throw new Error('This scan is already being analyzed.');
    if (json.error === 'managed_ai_unavailable') throw new Error('Built-in analysis is temporarily unavailable. Please try again later.');
    if (json.error === 'quota_exceeded') throw new Error('You have used all of your scans for this month. Upgrade your plan for more.');
    if (json.error === 'provider_error') {
      throw new Error(credential
        ? 'Your API key was rejected by the provider. Please check it in Profile → AI Provider.'
        : 'Analysis could not be completed. Please try again.');
    }
    throw new Error(json.message ?? 'Analysis could not be completed. Please try again.');
  }

  const json = await response.json();
  console.log('[cloudProvider] runCloudAnalysis success');
  // The full assessment is fetched separately via fetchAssessmentResult
  // This just confirms success and returns partial data
  return {
    risk_level: json.risk_level ?? 'inconclusive',
    risk_score: json.risk_score ?? 0,
    summary: '',
    warning_signals: [],
    recommended_actions: [],
    limitations: [],
    provider: credential?.provider ?? 'invisiproof',
    model: credential?.model ?? '',
    analysis_mode: 'cloud_byok',
    trust_level: 'server_verified',
    completed_at: new Date().toISOString(),
  };
}
