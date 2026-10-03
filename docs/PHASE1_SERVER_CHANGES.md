# Phase 1 server changes (Supabase project "PROOF LOOP")

The app changes on this branch depend on these server changes, applied in
the Supabase dashboard. The live `analyze-scan` source is now kept in
`supabase/functions/analyze-scan/index.ts`, with the built-in AI patch
already applied there.

## 1. Database migrations

Run these in the Supabase SQL editor, in this order. All three are additive.

1. `20261003000000_proof_request_result.sql`: adds `get_proof_request_result(p_request_id)`.
2. `20261003000100_submit_proof_response_scan_id.sql`: adds `proof_requests.response_scan_id` and makes `submit_proof_response` store it.
3. `20261003000200_generate_proof_request_expiry.sql`: adds a `generate_proof_request(p_title, p_message, p_expires_in_hours)` overload. Until it runs, the app falls back to the live two-argument function, which always expires after 7 days.

About `get_proof_request_result`:

- Only the request's creator can call it, and only after a response arrives.
- It returns the score, level, summary, warning signals and recommended
  actions. It never returns the respondent's scan, files, text or URL.

The app calls it from the new Proof Verdict screen
(`app/(tabs)/(requests)/verdict.tsx`).

## 2. Edge function `analyze-scan`: built-in AI

The app now calls `analyze-scan` **without** `api_key` when the user has not
saved their own key. In that case it sends `provider: "invisiproof"`.

**Secrets.** Add these under Edge Functions → Secrets. The owner enters the
key value; it is never pasted into chat.

| Secret | Value |
|---|---|
| `INVISIPROOF_AI_PROVIDER` | `openai`, `anthropic` or `gemini` (the provider the owner picks) |
| `INVISIPROOF_AI_KEY` | InvisiProof's own API key for that provider |
| `INVISIPROOF_AI_MODEL` | optional model override |

**Code.** Add this right after the request body is parsed and the user is
authenticated, before the provider call. Adapt the variable names to the
live function.

```ts
// Built-in AI: no user key means InvisiProof's own server key is used.
const usingBuiltInAi = !body.api_key;
if (usingBuiltInAi) {
  const managedKey = Deno.env.get('INVISIPROOF_AI_KEY');
  if (!managedKey) {
    return new Response(JSON.stringify({ error: 'managed_ai_unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  body.provider = Deno.env.get('INVISIPROOF_AI_PROVIDER') ?? 'openai';
  body.api_key = managedKey;
  body.model = Deno.env.get('INVISIPROOF_AI_MODEL') ?? body.model;

  // InvisiProof pays for these calls, so the monthly limit must be
  // enforced here, not only in the app. Count this user's assessments for
  // the current month (usage_counters.direct_assessments_used, or
  // scan_assessments rows) against their plan from the subscriptions table.
  // When the limit is reached, return status 402 with
  // { error: 'quota_exceeded' } (the app already uses 409 and 429 for
  // other errors).
}
```

**Response errors the app understands:**

| Error body | Meaning |
|---|---|
| `{ error: 'managed_ai_unavailable' }` | The secret is not set |
| `{ error: 'quota_exceeded' }` | The monthly limit was reached |
| `{ error: 'provider_error' }` | The AI provider rejected the call |

**Never log `body.api_key`.**

## Proof Request flow after these changes

1. The requester creates a request and shares the code.
2. The respondent enters the code, takes the photo, and taps "Check and Send
   Verdict". The app runs `analyze-scan` and then calls the existing
   `submit_proof_response` RPC.
3. The request shows as Answered in the requester's Completed tab. Tapping it
   opens the verdict.

**Check after deploy:** confirm that `submit_proof_response` sets status to
`responded` or `completed` and fills `response_scan_id`. The verdict function
reads both.
