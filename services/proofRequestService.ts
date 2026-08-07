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

export async function submitProofResponse(requestId: string, scanId: string): Promise<{ success: boolean; error?: string }> {
  console.log('[proofRequestService] submitProofResponse called');
  const { data, error } = await supabase
    .rpc('submit_proof_response', { p_request_id: requestId, p_scan_id: scanId });

  if (error) {
    console.log('[proofRequestService] submitProofResponse RPC error');
    return { success: false, error: 'Could not submit your response. Please try again.' };
  }
  if (data?.error) {
    return { success: false, error: data.error };
  }
  console.log('[proofRequestService] submitProofResponse success');
  return { success: true };
}
