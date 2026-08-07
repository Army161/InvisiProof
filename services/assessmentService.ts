import { supabase } from '@/lib/supabase';
import type { AssessmentResult } from '@/types/scan';

// Trigger AI analysis for a scan (calls the analyze-scan Edge Function)
export async function triggerAnalysis(scanId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false, error: 'Your session has expired. Please sign in again.' };

  console.log('[assessmentService] triggerAnalysis called');
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://kmipbsotthgigkndazot.supabase.co'}/functions/v1/analyze-scan`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ scan_id: scanId }),
    }
  );

  if (!response.ok) {
    await response.text().catch(() => '');
    console.log('[assessmentService] triggerAnalysis failed, status:', response.status);
    return { success: false, error: 'Analysis could not be started. Please try again.' };
  }

  const json = await response.json().catch(() => ({}));
  if (json.error) {
    console.log('[assessmentService] triggerAnalysis error from function');
    return { success: false, error: json.error };
  }

  console.log('[assessmentService] triggerAnalysis success');
  return { success: true };
}

// Fetch assessment result for a scan
export async function fetchAssessmentResult(scanId: string): Promise<AssessmentResult | null> {
  console.log('[assessmentService] fetchAssessmentResult called');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.log('[assessmentService] fetchAssessmentResult — no session');
    return null;
  }
  const { data, error } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('scan_id', scanId)
    .single();

  if (error || !data) {
    if (error?.code !== 'PGRST116') {
      console.log('[assessmentService] fetchAssessmentResult error');
    }
    return null;
  }
  return data as AssessmentResult;
}
