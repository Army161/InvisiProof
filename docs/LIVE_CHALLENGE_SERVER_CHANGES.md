# Live challenge and Proof Receipt: server changes (Supabase project "PROOF LOOP")

The live challenge and Proof Receipt screens need two server changes. Both
are additive: existing scans, requests and the 1.0.3 app keep working.

## 1. Run the migration

In the SQL editor, run `supabase/migrations/20261011000000_live_challenges.sql`.

What it adds:

- New columns on `proof_requests`: `challenge`, `challenge_opened_at`,
  `challenge_deadline`, `challenge_checks` and `receipt_expires_at`.
- A new column `scans.proof_request_id`.
- A trigger on `proof_requests` that lets app users only insert a blank
  pending request and only cancel a pending request. They can't edit the status, the response columns
  (`response_scan_id`, `respondent_id`, `responded_at`), or the challenge
  and receipt columns. This also closes a hole that has been live since
  Phase 1: through the requester update or insert policy, a requester could
  point a request at another user's scan and read that scan's result.
  The security-definer functions run as the table owner, so they are not
  affected. **Before running, check that the live `submit_proof_response`
  is security definer** (`select prosecdef from pg_proc where proname =
  'submit_proof_response'` should return `t`). If it isn't, the 1.0.3
  responder flow would hit the trigger.
- Three functions:
  - `open_proof_challenge(p_code)`. The seller opens the request. This makes
    the random code word, object and angle, and starts a 10-minute clock.
  - `submit_challenge_response(p_request_id, p_scan_id)`. The seller sends
    the checked photo. It must have been uploaded before the deadline, and
    it must be the most recently analyzed photo, so the receipt's checks and
    risk score always describe the same photo. This starts the 24-hour
    receipt.
  - `get_proof_receipt(p_request_id)`. The buyer reads the receipt. They get
    the result only, never the photo, and only "expired" after 24 hours.

The migration can be run twice safely. It was tested on Postgres 16 against
a stand-in schema. Cases covered:
- buyer, seller and other-user access;
- late photos;
- expired receipts;
- a requester trying to attach someone else's scan, by update or by insert (blocked);
- cancel (still works);
- sending an older photo (refused).

## 2. Deploy `analyze-scan`

Deploy `supabase/functions/analyze-scan/index.ts`. Changes from the live
version:

- A photo linked to a proof request (`scans.proof_request_id`) is judged
  against that request's challenge. It returns `challenge_checks`, which are
  saved on the request.
- Challenge photos always use the built-in AI. The seller's own key is
  ignored, so a seller can't grade their own proof. They don't count against
  the seller's monthly scans.
- The checks are stored with the id of the scan they came from.
- A challenge photo is refused (409 `challenge_invalid`) when:
  - the request is not the seller's;
  - the request is closed;
  - the photo was uploaded after the deadline;
  - the seller has already used the 3 photo attempts for that request.
  Together with the 10-minute window and the existing 20-per-hour limit,
  this caps what one request can cost on the built-in AI key.
- The Free plan goes from 2 to 3 scans a month, to match the July
  launch pricing.

No new secrets are needed.
