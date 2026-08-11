import { supabase } from '@/lib/supabase';
import type { AssessmentResult } from '@/types/scan';
import {
  loadActiveProvider,
  loadCredential,
  isLocalAvailable,
  getLocalUnavailableReason,
  runCloudAnalysis,
} from '@/services/ai';

export async function triggerAnalysis(
  scanId: string,
): Promise<{ success: boolean; error?: string }> {
  console.log('[assessmentService] triggerAnalysis called, scanId:', scanId);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false, error: 'Your session has expired. Please sign in again.' };

  const activeProvider = await loadActiveProvider();
  console.log('[assessmentService] active provider:', activeProvider);

  if (activeProvider === 'local') {
    if (!isLocalAvailable()) {
      const reason = getLocalUnavailableReason();
      console.log('[assessmentService] local provider unavailable:', reason);
      return { success: false, error: reason };
    }
    // Local path — not yet implemented
    return { success: false, error: 'Local analysis is not yet available.' };
  }

  // Cloud BYOK path
  const credential = await loadCredential(activeProvider);
  if (!credential || !credential.apiKey) {
    console.log('[assessmentService] no credential for provider:', activeProvider);
    return {
      success: false,
      error: `No API key configured for ${activeProvider}. Go to Profile → AI Provider to add your key.`,
    };
  }

  try {
    await runCloudAnalysis(scanId, credential);
    console.log('[assessmentService] triggerAnalysis success');
    return { success: true };
  } catch (err: any) {
    console.log('[assessmentService] triggerAnalysis error:', err?.message);
    return { success: false, error: err?.message ?? 'Analysis could not be started. Please try again.' };
  }
}

export async function fetchAssessmentResult(scanId: string): Promise<AssessmentResult | null> {
  console.log('[assessmentService] fetchAssessmentResult called, scanId:', scanId);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.log('[assessmentService] fetchAssessmentResult — no session');
    return null;
  }

  const { data, error } = await supabase
    .from('scan_assessments')
    .select('*')
    .eq('scan_id', scanId)
    .single();

  if (error || !data) {
    if (error?.code !== 'PGRST116') {
      console.log('[assessmentService] fetchAssessmentResult error:', error?.message);
    }
    return null;
  }
  return data as AssessmentResult;
}
