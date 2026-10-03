import { supabase } from '@/lib/supabase';
import type { ProofRequest } from '@/types/scan';

export async function createProofRequest(
  challenge: string,
  expiresInHours: number
): Promise<ProofRequest> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Your session has expired. Please sign in again.');

  console.log('[proofRequestService] createProofRequest called');
  const { data, error } = await supabase
    .rpc('generate_proof_request', {
      p_challenge: challenge.trim(),
      p_expires_in_hours: expiresInHours,
    });

  if (error || !data) {
    console.log('[proofRequestService] createProofRequest failed');
    throw new Error('Could not create proof request. Please try again.');
  }
  console.log('[proofRequestService] createProofRequest success');
  return data as ProofRequest;
}

export async function fetchMyRequests(): Promise<ProofRequest[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  console.log('[proofRequestService] fetchMyRequests called');
  const { data, error } = await supabase
    .from('proof_requests')
    .select('*')
    .or(`requester_id.eq.${session.user.id},respondent_id.eq.${session.user.id}`)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.log('[proofRequestService] fetchMyRequests failed');
    return [];
  }
  return data as ProofRequest[];
}

export async function cancelProofRequest(requestId: string): Promise<void> {
  console.log('[proofRequestService] cancelProofRequest called');
  const { error } = await supabase
    .from('proof_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId)
    .eq('status', 'pending');

  if (error) {
    console.log('[proofRequestService] cancelProofRequest failed');
    throw new Error('Could not cancel the request. Please try again.');
  }
  console.log('[proofRequestService] cancelProofRequest success');
}

export async function lookupProofRequestByCode(code: string): Promise<{
  id: string;
  challenge: string;
  expires_at: string;
  status: string;
} | null> {
  console.log('[proofRequestService] lookupProofRequestByCode called');
  const { data, error } = await supabase
    .rpc('lookup_proof_request_by_code', { p_code: code.toUpperCase().trim() });

  if (error || !data || data.length === 0) {
    console.log('[proofRequestService] lookupProofRequestByCode failed or not found');
    return null;
  }
  return data[0];
}

const SUBMIT_ERROR_MESSAGES: Record<string, string> = {
  invalid_scan: 'This evidence could not be matched to your account. Please scan it again.',
};

export async function submitProofResponse(shareCode: string, scanId: string): Promise<{ success: boolean; error?: string }> {
  console.log('[proofRequestService] submitProofResponse called');
  const { data, error } = await supabase
    .rpc('submit_proof_response', { p_code: shareCode.toUpperCase().trim(), p_scan_id: scanId });

  if (error) {
    console.log('[proofRequestService] submitProofResponse RPC error');
    return { success: false, error: 'Could not submit your response. Please try again.' };
  }
  if (data?.error) {
    return { success: false, error: SUBMIT_ERROR_MESSAGES[data.error] ?? data.error };
  }
  console.log('[proofRequestService] submitProofResponse success');
  return { success: true };
}

export interface ProofRequestVerdict {
  risk_level: 'low' | 'moderate' | 'high' | 'critical' | 'inconclusive';
  risk_score: number;
  summary: string;
  warning_signals: string[];
  recommended_actions: string[];
  responded_at: string | null;
  completed_at: string | null;
}

/**
 * Fetches the verdict for a Proof Request the signed-in user created.
 * Returns only the assessment, never the respondent's evidence.
 */
export async function fetchProofRequestVerdict(requestId: string): Promise<ProofRequestVerdict | null> {
  console.log('[proofRequestService] fetchProofRequestVerdict called');
  const { data, error } = await supabase
    .rpc('get_proof_request_result', { p_request_id: requestId });

  if (error || !data || data.error) {
    console.log('[proofRequestService] fetchProofRequestVerdict failed or not ready');
    return null;
  }
  return data as ProofRequestVerdict;
}
