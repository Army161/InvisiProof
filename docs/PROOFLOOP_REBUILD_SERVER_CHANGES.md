# ProofLoop rebuild: server changes (Supabase project "PROOF LOOP")

The live challenge and Proof Receipt screens need two server changes. Both
are additive: existing scans, requests and the 1.0.3 app keep working.

## 1. Run the migration

In the SQL editor, run `supabase/migrations/20261011000000_live_challenges.sql`.

What it adds:

- New columns on `proof_requests`: `challenge`, `challenge_opened_at`,
  `challenge_deadline`, `challenge_checks` and `receipt_expires_at`.
- A new column `scans.proof_request_id`.
- A trigger that stops app users from editing those challenge columns
  directly.
- Three functions:
  - `open_proof_challenge(p_code)`. The seller opens the request. This makes
    the random code word, object and angle, and starts a 10-minute clock.
  - `submit_challenge_response(p_request_id, p_scan_id)`. The seller sends
    the checked photo. It must have been uploaded before the deadline. This
    starts the 24-hour receipt.
  - `get_proof_receipt(p_request_id)`. The buyer reads the receipt. They get
    the result only, never the photo, and only "expired" after 24 hours.

The migration can be run twice safely. It was tested on Postgres 16 against
a stand-in schema covering the buyer, seller, other-user, late-photo and
expired-receipt cases.

## 2. Deploy `analyze-scan`

Deploy `supabase/functions/analyze-scan/index.ts`. Changes from the live
version:

- A photo linked to a proof request (`scans.proof_request_id`) is judged
  against that request's challenge. It returns `challenge_checks`, which are
  saved on the request.
- Challenge photos always use the built-in AI. The seller's own key is
  ignored, so a seller can't grade their own proof. They don't count against
  the seller's monthly scans.
- A challenge photo is refused (409 `challenge_invalid`) when the request is
  not the seller's, is closed, or the photo was uploaded after the deadline.
- The Free plan goes from 2 to 3 scans a month, to match the original
  ProofLoop pricing.

No new secrets are needed.
