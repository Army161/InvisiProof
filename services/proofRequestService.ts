import { supabase } from '@/lib/supabase';
import type { ProofRequest } from '@/types/scan';
import { APP_CONFIG } from '@/config/app';

// The live proof_requests table stores the request text in title/message.
// The app shows it as `challenge`. The table's own `challenge` column holds
// the seller's live challenge, kept here as `live_challenge`.
function toProofRequest(row: any): ProofRequest {
  const { challenge: liveChallenge, ...rest } = row;
  return {
    ...rest,
    live_challenge: liveChallenge && typeof liveChallenge === 'object' ? liveChallenge : null,
    challenge: row.message ?? row.title ?? '',
  };
}

/** The text the buyer sends the seller with the proof code. */
export function verificationShareMessage(item: string, code: string): string {
  return [
    `Before I send money for the ${item}, can you show me you have it?`,
    '',
    `Open ${APP_CONFIG.name}, tap "Selling? Enter a proof code" and enter: ${code}`,
    '',
    "You'll get a quick camera challenge. It takes about 2 minutes.",
    APP_CONFIG.playStoreUrl,
  ].join('\n');
}

export async function createProofRequest(
  challenge: string,
  expiresInHours: number
): Promise<ProofRequest> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Your session has expired. Please sign in again.');

  console.log('[proofRequestService] createProofRequest called');
  const text = challenge.trim();
  const args = { p_title: text.slice(0, 80), p_message: text };
  let { data, error } = await supabase
    .rpc('generate_proof_request', { ...args, p_expires_in_hours: expiresInHours });

  // Before the expiry overload is deployed, fall back to the live
  // two-argument function (fixed 7-day expiry).
  if (error?.code === 'PGRST202') {
    ({ data, error } = await supabase.rpc('generate_proof_request', args));
  }

  if (error || !data) {
    console.log('[proofRequestService] createProofRequest failed');
    throw new Error('Could not create proof request. Please try again.');
  }
  console.log('[proofRequestService] createProofRequest success');
  return toProofRequest({ ...data, title: args.p_title, message: text });
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
  return data.map(toProofRequest);
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
  item: string;
  note: string | null;
  challenge: string;
  expires_at: string;
  status: string;
} | null> {
  console.log('[proofRequestService] lookupProofRequestByCode called');
  const { data, error } = await supabase
    .rpc('lookup_proof_request_by_code', { p_code: code.toUpperCase().trim() });

  // The live function returns { found: false } or
  // { found: true, id, title, message, expires_at } for open requests only.
  if (error || !data?.found) {
    console.log('[proofRequestService] lookupProofRequestByCode failed or not found');
    return null;
  }
  return {
    id: data.id,
    item: data.title ?? '',
    note: data.message && data.message !== data.title ? data.message : null,
    challenge: data.message ?? data.title ?? '',
    expires_at: data.expires_at,
    status: 'pending',
  };
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

// ── Verification request, live challenge, Proof Receipt ──

/** How long the seller has to open the request. */
export const VERIFICATION_REQUEST_HOURS = 48;

/**
 * The buyer asks the seller to prove they have the item. The item name is
 * stored as the request title; the optional note as the message.
 */
export async function createVerificationRequest(item: string, note: string): Promise<ProofRequest> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Your session has expired. Please sign in again.');

  console.log('[proofRequestService] createVerificationRequest called');
  const title = item.trim().slice(0, 80);
  const message = note.trim() || null;
  const { data, error } = await supabase.rpc('generate_proof_request', {
    p_title: title,
    p_message: message,
    p_expires_in_hours: VERIFICATION_REQUEST_HOURS,
  });

  if (error || !data) {
    console.log('[proofRequestService] createVerificationRequest failed');
    throw new Error('Could not create the request. Please try again.');
  }
  return toProofRequest({ ...data, title, message });
}

export interface LiveChallenge {
  request_id: string;
  item: string;
  note: string | null;
  phrase: string;
  object: string;
  angle: string;
  deadline: string;
}

const OPEN_CHALLENGE_ERRORS: Record<string, string> = {
  not_found: 'No request found with that code. Check it and try again.',
  own_request: "This is your own request. Send the code to the seller instead.",
  not_open: 'This request was already answered or cancelled.',
  expired: 'This request has expired. Ask the buyer to send a new one.',
  already_claimed: 'Someone else already started this challenge.',
  challenge_expired: 'The 10 minutes ran out. Ask the buyer to send a new request.',
};

/**
 * Starts (or resumes) the seller's live challenge. The first call starts the
 * 10-minute clock on the server.
 */
export async function openProofChallenge(code: string): Promise<{ challenge?: LiveChallenge; error?: string }> {
  console.log('[proofRequestService] openProofChallenge called');
  const { data, error } = await supabase.rpc('open_proof_challenge', { p_code: code.toUpperCase().trim() });
  if (error || !data) {
    console.log('[proofRequestService] openProofChallenge RPC error');
    return { error: 'Could not start the challenge. Please try again.' };
  }
  if (data.error) {
    return { error: OPEN_CHALLENGE_ERRORS[data.error] ?? 'Could not start the challenge. Please try again.' };
  }
  return { challenge: data as LiveChallenge };
}

const SUBMIT_CHALLENGE_ERRORS: Record<string, string> = {
  not_found: 'This challenge could not be found.',
  not_open: 'This request was already answered or cancelled.',
  invalid_scan: 'Your photo could not be matched to this challenge. Please take it again.',
  too_late: 'The photo was taken after the 10 minutes ran out.',
  not_analyzed: 'Your photo has not been checked yet. Please try again.',
};

export async function submitChallengeResponse(requestId: string, scanId: string): Promise<{ success: boolean; error?: string }> {
  console.log('[proofRequestService] submitChallengeResponse called');
  const { data, error } = await supabase.rpc('submit_challenge_response', {
    p_request_id: requestId,
    p_scan_id: scanId,
  });
  if (error || !data) {
    return { success: false, error: 'Could not send your proof. Please try again.' };
  }
  if (data.error) {
    return { success: false, error: SUBMIT_CHALLENGE_ERRORS[data.error] ?? 'Could not send your proof. Please try again.' };
  }
  return { success: true };
}

export interface ChallengeChecks {
  item_visible?: boolean;
  phrase_visible?: boolean;
  phrase_matches?: boolean;
  object_visible?: boolean;
  angle_matches?: boolean;
  looks_live?: boolean;
  notes?: string;
}

export interface ProofReceipt {
  expired: boolean;
  item: string | null;
  challenge?: { phrase: string; object: string; angle: string } | null;
  checks?: ChallengeChecks;
  possession?: 'strong' | 'partial' | 'weak';
  challenge_completed?: boolean;
  risk_level?: ProofRequestVerdict['risk_level'];
  risk_score?: number | null;
  summary?: string;
  warning_signals?: string[];
  recommended_actions?: string[];
  responded_at?: string | null;
  receipt_expires_at: string | null;
}

/**
 * The buyer's Proof Receipt. Falls back to the plain verdict for requests
 * answered before live challenges existed, or before the server has the
 * receipt function.
 */
export async function fetchProofReceipt(requestId: string): Promise<ProofReceipt | null> {
  console.log('[proofRequestService] fetchProofReceipt called');
  const { data, error } = await supabase.rpc('get_proof_receipt', { p_request_id: requestId });

  if (!error && data && !data.error) return data as ProofReceipt;

  if (error?.code === 'PGRST202') {
    const verdict = await fetchProofRequestVerdict(requestId);
    if (!verdict) return null;
    return {
      expired: false,
      item: null,
      challenge_completed: false,
      ...verdict,
      receipt_expires_at: null,
    };
  }
  console.log('[proofRequestService] fetchProofReceipt failed or not ready');
  return null;
}
