# ProofLoop Mobile — Architecture & Completion Report

**Last updated:** Phase 4–9 AI Provider Refactor
**Platform:** React Native / Expo / Expo Router / TypeScript
**Supabase project:** kmipbsotthgigkndazot

---

## Canonical Implementation

Newly.ai ProofLoop is the canonical Web, Android, and iOS implementation.
There is no separate required Kimi web application and no required Kimi/Moonshot runtime.

---

## AI Provider Architecture (Authoritative)

### Default Provider — ProofLoop Local
- Free, no commercial API key required
- Genuine local inference (not fake/mock)
- Status: Architecture complete. Runtime pending — no stable cross-platform (iOS/Android/Web) on-device LLM runtime is currently available. See `services/ai/localProvider.ts` for full blocker documentation.
- When available: analysis_mode = local, trust_level = device_generated

### BYOK Providers (Optional)
Users may configure their own API key for:
- OpenAI (gpt-4o-mini default)
- Anthropic Claude (claude-3-haiku default)
- Google Gemini (gemini-1.5-flash default)
- xAI Grok (grok-beta default)
- Custom OpenAI-compatible endpoint (HTTPS only, SSRF-protected)

Keys are stored in expo-secure-store (iOS/Android). Never in AsyncStorage, Supabase tables, source files, or logs.
Cloud BYOK analysis: analysis_mode = cloud_byok, trust_level = server_verified (set server-side only).

### Removed
- Moonshot / Kimi — NOT required infrastructure
- MOONSHOT_API_KEY — NOT required
- ProofLoop functions without any commercial AI key

---

## Database Schema

### public.scans
21 columns including analysis lifecycle: analysis_started_at, analysis_completed_at, analysis_error_code, analysis_attempt_count, original_filename.
RLS: authenticated users own their rows. 7 CHECK constraints enforce data integrity.

### public.scan_assessments
18 columns. Full normalized assessment contract:
risk_level, risk_score (0–100), summary, warning_signals[], recommended_actions[], limitations[], signals (jsonb), provider, model, analysis_mode, trust_level, analysis_version, completed_at.
RLS: SELECT-only for authenticated users (inserts only via service-role Edge Function).

### public.proof_requests
12 columns including analysis_requirement ('local_or_cloud' | 'server_verified_cloud').
RLS: requester and respondent can read; only requester can insert/delete.

### public.rate_limit_events
Rate limiting: 20 analyses per hour per user.

---

## Edge Functions

| Function | Status | Purpose |
|---|---|---|
| analyze-scan | ACTIVE v3 | Provider-neutral BYOK analysis. Accepts provider + api_key per request. Never persists keys. SSRF protection on custom URLs. |
| delete-account | ACTIVE | Full account deletion: Storage objects + auth.users cascade |
| delete-scan | ACTIVE | Ownership-verified scan + Storage object deletion |

---

## Storage

Bucket: scan-uploads (private, 8MB limit, image/jpeg only)
Path format: {user-id}/{scan-id}/source.jpg
Policies: INSERT/SELECT/DELETE scoped to auth.uid() first folder. No UPDATE policy.

---

## Frontend Architecture

### Navigation
4-tab bottom navigation: Scan, Requests, History, Profile
Stack screens: scan preparation, scan detail, proof code, create request, all profile sub-screens, AI Provider settings

### AI Provider Screen
Profile → AI Provider
- Provider selection (Local / OpenAI / Anthropic / Gemini / Grok / Custom)
- BYOK key management via SecureStore
- Local provider shows "Coming soon" until runtime is available

### services/ai/
- types.ts — NormalizedAssessment, ProviderCredential, ModelManifestEntry, MODEL_MANIFEST
- credentialStore.ts — SecureStore BYOK key management
- localProvider.ts — Honest stub with runtime blocker documentation
- cloudProvider.ts — Edge Function caller with error mapping
- index.ts — Barrel export

---

## Security Properties

- No service-role key in mobile code
- No API keys in source files, app.json, or logs
- BYOK keys: SecureStore only, transmitted per-request, never persisted server-side
- trust_level = server_verified set only by Edge Function (service role)
- Client cannot self-certify server_verified
- SSRF protection on custom provider URLs
- Rate limiting: 20 analyses/hour
- Atomic scan claiming prevents duplicate analysis
- Rollback: if DB insert fails after upload, Storage object is deleted

---

## Phases Completed

- Phase 1: Foundation, navigation, design system, all base screens ✓
- Phase 3: Scan input, image prep, secure upload, text/URL validation ✓
- Phase 4: Analysis lifecycle, scan_assessments, Edge Function ✓
- Phase 5: History screen, scan detail with full results UI, polling ✓
- Phase 6: Proof requests, create/cancel/respond flow ✓
- Phase 7: Account deletion, scan deletion ✓
- Phase 8: AI provider refactor — provider-neutral architecture ✓
- Phase 9: EAS configuration ✓

## Remaining

- Local inference runtime (blocked on cross-platform LLM runtime availability)
- MOONSHOT_API_KEY: NOT required, NOT used
