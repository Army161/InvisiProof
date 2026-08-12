# ProofLoop

**Verify before you trust, meet, or pay.**

ProofLoop is a privacy-first trust and risk verification platform for iOS and Android. It helps people evaluate suspicious marketplace listings, messages, payment requests, rental offers, job offers, investment promotions, links, and online sellers before they trust, meet, or pay.

## What ProofLoop does

- **Scan screenshots and photos** — Submit an image of a suspicious listing, message, receipt, or payment request for observable risk signal analysis.
- **Paste text or links** — Submit a message, email, URL, or written conversation for analysis.
- **Proof Requests** — Request verifiable evidence from another person before continuing a transaction.
- **Private report history** — All scan results are stored privately, tied to your account, and never shared.

## What ProofLoop does not do

ProofLoop evaluates observable signals and available evidence. It does not guarantee identity, safety, payment, delivery, legality, or recovery of funds.

## Architecture

- **Platform:** React Native / Expo / Expo Router / TypeScript
- **Backend:** Supabase (PostgreSQL, Row Level Security, Storage, Edge Functions)
- **AI Analysis:** Provider-independent. Default: ProofLoop Local (coming soon). Optional: BYOK (OpenAI, Anthropic, Google Gemini, xAI Grok, Custom OpenAI-compatible).
- **Privacy:** Evidence is never used for training. API keys are stored in device SecureStore only and transmitted per-request. No keys are persisted server-side.

## Development

```bash
bun install
bun run dev        # Start Expo dev server
bun run android    # Android
bun run ios        # iOS
bun run lint       # ESLint
bunx tsc --noEmit  # TypeScript check
```

## Bundle identifiers

Current identifiers (pending final brand/domain clearance):
- iOS: `com.northstarrevenue.proofloopverify`
- Android: `com.northstarrevenue.proofloopverify`

Do not submit to App Store or Google Play until permanent brand/domain identifiers are approved.

## Status

Phase 1–9 complete. Local inference runtime pending cross-platform LLM availability.
