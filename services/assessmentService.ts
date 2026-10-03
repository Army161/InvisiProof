import { supabase } from '@/lib/supabase';
import type { AssessmentResult } from '@/types/scan';
import {
  loadActiveProvider,
  loadCredential,
  runCloudAnalysis,
} from '@/services/ai';

export async function triggerAnalysis(
  scanId: string,
): Promise<{ success: boolean; error?: string }> {
  console.log('[assessmentService] triggerAnalysis called');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false, error: 'Your session has expired. Please sign in again.' };

  const activeProvider = await loadActiveProvider();
  console.log('[assessmentService] active provider:', activeProvider);

  // A user's own key (BYOK) is used when one is selected and saved.
  // Otherwise the scan runs on InvisiProof's built-in server AI.
  const credential = activeProvider === 'local' || activeProvider === 'invisiproof'
    ? null
    : await loadCredential(activeProvider);
  const useOwnKey = !!credential?.apiKey;

  try {
    await runCloudAnalysis(scanId, useOwnKey ? credential : null);
    console.log('[assessmentService] triggerAnalysis success');
    return { success: true };
  } catch (err: any) {
    console.log('[assessmentService] triggerAnalysis error:', err?.message);
    return { success: false, error: err?.message ?? 'Analysis could not be started. Please try again.' };
  }
}

export async function fetchAssessmentResult(scanId: string): Promise<AssessmentResult | null> {
  console.log('[assessmentService] fetchAssessmentResult called');
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
