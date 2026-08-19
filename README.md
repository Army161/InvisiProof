# InvisiProof

**Privacy-first trust and risk verification for the digital age**

InvisiProof is a mobile and web application that uses AI to assess the risk level of suspicious screenshots, text messages, and URLs. It also provides a two-party Proof Request workflow that lets one person ask another to submit evidence privately — the requester receives only the normalized risk result, never the raw evidence.

---

## Overview

Digital fraud, impersonation, and manipulation are increasingly difficult to detect. InvisiProof gives individuals and organizations a structured, privacy-respecting way to evaluate suspicious content before acting on it.

**Who it's for:**
- Individuals who receive suspicious messages, images, or links and want an objective second opinion
- Professionals who need to verify claims made by third parties without exposing sensitive evidence
- Organizations that want to give employees a safe, private tool for reporting suspicious content

InvisiProof is not a legal service. Results are risk assessments based on observable signals — not verdicts, not legal evidence, and not guarantees of safety or harm.

---

## Key Features

### Direct Assessments
- **Analyze Image** — Upload a screenshot, photo, or document image for visual signal analysis (compression artifacts, layout anomalies, editing indicators, embedded text patterns)
- **Analyze Text** — Paste a message, email, or conversation for linguistic pattern analysis (urgency language, impersonation signals, financial pressure, suspicious instructions)
- **Analyze URL** — Submit a link for structural risk analysis without the app visiting the URL from your device

### Proof Requests
A two-party workflow where a requester creates a challenge, shares a 6-digit code with a respondent, and receives only the AI-generated risk result — never the raw evidence. Row-level security enforces this boundary at the database level.

### BYOK (Bring Your Own Key)
Privacy-conscious users can supply their own OpenAI, Anthropic, or Google Gemini API key. The key is stored encrypted in Supabase and is never logged or transmitted to InvisiProof servers. Assessments run through the user's own provider account.

### Subscription Tiers
| Plan | Assessments/month | History | Price |
|------|-------------------|---------|-------|
| Free | 2 | 7 days | Free |
| Plus | 25 | 90 days | $14.99/mo or $99.99/yr |
| Pro | 150 | Unlimited | $34.99/mo or $249.99/yr |
| Max | Unlimited | Unlimited | $79.99/mo or $599.99/yr |

### Privacy-First Analytics
PostHog is used for product analytics. Event tracking is limited to app lifecycle and feature usage events. Image contents, text contents, URLs, API keys, and passwords are never tracked.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile app | Expo 54 / React Native |
| Navigation | Expo Router (file-based) |
| Backend | Supabase (auth, database, storage, edge functions) |
| Subscriptions | RevenueCat (Android in-app purchases) |
| Analytics | PostHog (privacy-conscious, self-hostable) |
| Language | TypeScript (strict) |
| Package manager | Bun |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                     │
│  Expo Router · React Native · TypeScript · RevenueCat   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│                  Supabase Backend                        │
│  Auth · PostgreSQL (RLS) · Storage · Edge Functions      │
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    ┌─────▼─────┐  ┌─────▼─────┐  ┌───▼──────────┐
    │  OpenAI   │  │ Anthropic │  │ Google Gemini │
    │  (BYOK)   │  │  (BYOK)   │  │   (BYOK)      │
    └───────────┘  └───────────┘  └──────────────┘
```

- The **mobile app** handles all user interaction, scan submission, and result display
- **Supabase edge functions** orchestrate AI analysis and enforce row-level security
- **RevenueCat** manages Android subscription entitlements and webhooks
- **BYOK** routes analysis through the user's own AI provider account when configured

---

## Repository Structure

```
app/                  Expo Router screens and layouts
  (auth)/             Authentication screens (sign in, sign up, reset password)
  (tabs)/             Main tab screens (home, scan, requests, profile)
  (marketing)/        Marketing/onboarding screens
components/           Reusable UI components
services/             Service layer (scan, assessment, proof request, AI)
  ai/                 AI provider integrations and prompt logic
hooks/                Custom React hooks
contexts/             React context providers (auth, theme, widget)
docs/                 Mintlify documentation source
supabase/             Supabase config and migration files
lib/                  Shared library code (Supabase client)
utils/                Utility functions (image prep, validation, error logging)
constants/            App-wide constants (colors, theme)
types/                TypeScript type definitions
config/               App configuration
```

---

## Development Setup

### Prerequisites

- Node.js 18+
- [Bun](https://bun.sh) (package manager)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`bun add -g expo-cli`)
- [EAS CLI](https://docs.expo.dev/eas/) (`bun add -g eas-cli`)
- Android Studio (for Android emulator) or a physical Android device

### Install and run

```bash
git clone <repository-url>
cd invisiproof
bun install
bunx expo start
```

Press `a` to open on Android emulator, or scan the QR code with Expo Go on a physical device.

### Build for production

```bash
# Android APK / AAB
eas build --platform android --profile production

# Web
bunx expo export --platform web
```

---

## Environment

Supabase configuration is embedded in `lib/supabase.ts` and referenced via `app.json` extra fields. No `.env` file is required for local development — the Supabase project URL and anon key are non-secret public values.

For BYOK functionality, users supply their own AI provider keys through the app UI. These are stored encrypted in Supabase and are never present in the app bundle.

---

## Docs

Full documentation: **[https://docs.invisiproof.com](https://docs.invisiproof.com)**

---

## Website

**[https://www.invisiproof.com](https://www.invisiproof.com)**

---

## Support

**[support@invisiproof.com](mailto:support@invisiproof.com)**

Response time: 1–2 business days.

For security vulnerabilities, see [SECURITY.md](./SECURITY.md).

---

## License

**Proprietary. All rights reserved.**

This software is not open source. Unauthorized copying, distribution, or modification is prohibited. See [LICENSE](./LICENSE) for full terms.

---

© 2025 InvisiProof. All rights reserved.
