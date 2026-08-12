/**
 * ProofLoop Analytics
 *
 * Privacy rules (NEVER record):
 * - API keys or provider credentials
 * - Uploaded image content or bytes
 * - Pasted text content
 * - Private URLs or URL content
 * - Passwords or auth tokens
 * - Personally sensitive evidence
 * - Storage paths
 * - Raw scan objects
 *
 * Safe to record:
 * - Event names
 * - Enum values (input_type, source_type, risk_level, provider type)
 * - Boolean flags
 * - Counts and lengths (never content)
 * - Timestamps
 */

import PostHog from 'posthog-react-native';

// PostHog project API key — public, safe to include in client code
// Replace with real PostHog project API key before production launch
const POSTHOG_API_KEY = 'phc_placeholder_replace_before_launch';
const POSTHOG_HOST = 'https://us.i.posthog.com';

let client: PostHog | null = null;

export function initAnalytics(): void {
  if (client) return;
  try {
    client = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      // Do not capture app lifecycle events automatically (we do it manually)
      captureAppLifecycleEvents: false,
    });
  } catch {
    // Analytics must never crash the app
  }
}

export function identifyUser(userId: string): void {
  try {
    client?.identify(userId);
  } catch {}
}

export function resetAnalyticsUser(): void {
  try {
    client?.reset();
  } catch {}
}

// ─── Event helpers ────────────────────────────────────────────────────────────

export function trackAppOpened(): void {
  track('app_opened');
}

export function trackAccountCreated(): void {
  track('account_created');
}

export function trackSignedIn(): void {
  track('signed_in');
}

export function trackScanStarted(params: {
  scan_type: 'image' | 'text' | 'url';
  source_type: 'camera' | 'library' | 'paste';
}): void {
  track('scan_started', params);
}

export function trackScanCompleted(params: {
  scan_type: 'image' | 'text' | 'url';
}): void {
  track('scan_completed', params);
}

export function trackScanFailed(params: {
  scan_type: 'image' | 'text' | 'url';
  reason: string; // generic error category, not content
}): void {
  track('scan_failed', params);
}

export function trackAnalysisCompleted(params: {
  risk_level: string;
  provider_type: 'local' | 'byok';
  analysis_mode: string;
}): void {
  track('analysis_completed', params);
}

export function trackProofRequestCreated(params: {
  analysis_requirement: string;
}): void {
  track('proof_request_created', params);
}

export function trackProofRequestOpened(): void {
  track('proof_request_opened');
}

export function trackProofResponseSubmitted(): void {
  track('proof_response_submitted');
}

export function trackProofRequestCompleted(): void {
  track('proof_request_completed');
}

export function trackEvidenceReportViewed(params: {
  risk_level: string;
  provider_type: 'local' | 'byok';
}): void {
  track('evidence_report_viewed', params);
}

export function trackScanDeleted(): void {
  track('scan_deleted');
}

export function trackAccountDeleted(): void {
  track('account_deleted');
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function track(event: string, properties?: Record<string, string | boolean | number>): void {
  try {
    client?.capture(event, properties);
  } catch {
    // Analytics must never crash the app
  }
}
