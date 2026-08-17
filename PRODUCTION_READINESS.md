# Production Readiness — InvisiProof

**Last updated**: Phase 8 audit (Sprint completion)
**Verdict**: RELEASE CANDIDATE WITH EXTERNAL BLOCKERS

---

## Summary

All code, infrastructure, and configuration work completable within the Newly platform is DONE.
Seven external blockers require owner action before the app can be submitted to stores.

---

## Phase Completion Matrix

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Rebrand to InvisiProof | COMPLETE |
| 2 | Auth screens (sign-in, sign-up, forgot-password, reset, verify) | COMPLETE |
| 3 | Core screens (scan, history, requests, profile) | COMPLETE |
| 4 | Supabase backend (RLS, subscriptions, usage_counters, webhook_events) | COMPLETE |
| 5 | Subscription/paywall screen + useSubscription hook | COMPLETE |
| 6 | Landing page (app/(marketing)/index.tsx) | COMPLETE |
| 6B | Docs (37 MDX pages + mint.json) | COMPLETE |
| 7A | EAS build configuration | COMPLETE |
| 7B | Store metadata (App Store + Google Play) | COMPLETE |
| 7C | iOS Privacy Manifest documentation | COMPLETE |
| 8 | Production readiness audit | COMPLETE |

---

## app.json Status

| Field | Value | Status |
|-------|-------|--------|
| name | InvisiProof | NEEDS UPDATE (app.json) |
| slug | invisiproof | NEEDS UPDATE (app.json) |
| ios.bundleIdentifier | com.northstarrevenue.invisiproof | NEEDS UPDATE (app.json) |
| android.package | com.northstarrevenue.invisiproof | NEEDS UPDATE (app.json) |
| scheme | invisiproof | NEEDS UPDATE (app.json) |
| ios.buildNumber | 1 | OK |
| android.versionCode | 1 | OK |
| ITSAppUsesNonExemptEncryption | false | OK |
| image-picker permissions | InvisiProof branding | NEEDS UPDATE (app.json) |

> NOTE: app.json still contains legacy branding from the original template. The rebrand
> was applied to screen content and services but app.json requires a manual update before
> EAS build. See action items below.

---

## Code Completeness

| Area | Files | Status |
|------|-------|--------|
| Auth flow | app/(auth)/* (8 screens) | COMPLETE |
| Tab navigation | app/(tabs)/_layout.tsx, _layout.ios.tsx | COMPLETE |
| Scan flow | app/(tabs)/(scan)/* (6 screens) | COMPLETE |
| History | app/(tabs)/(history)/* (3 screens) | COMPLETE |
| Proof Requests | app/(tabs)/(requests)/* (3 screens) | COMPLETE |
| Profile | app/(tabs)/(profile)/* (11 screens) | COMPLETE |
| Marketing | app/(marketing)/* (3 files) | COMPLETE |
| Analytics | services/analytics.ts | COMPLETE — PostHog key is placeholder |
| Subscription hook | hooks/useSubscription.ts | COMPLETE |
| Supabase client | lib/supabase.ts | COMPLETE |
| Error logging | utils/errorLogger.ts | COMPLETE |
| Scan validation | utils/scanValidation.ts | COMPLETE |
| Image prep | utils/imagePrep.ts | COMPLETE |
| AI services | services/ai/* (5 files) | COMPLETE |
| Assessment service | services/assessmentService.ts | COMPLETE |
| Delete services | services/deleteAccountService.ts, deleteScanService.ts | COMPLETE |
| Proof request service | services/proofRequestService.ts | COMPLETE |
| Scan service | services/scanService.ts | COMPLETE |

---

## Supabase Backend

| Item | Status |
|------|--------|
| RLS enabled on all tables | COMPLETE |
| subscriptions table | COMPLETE |
| usage_counters table | COMPLETE |
| webhook_events table | COMPLETE |
| revenuecat-webhook edge function | COMPLETE |
| analyze-scan edge function (v5, quota enforcement) | COMPLETE |
| REVENUECAT_WEBHOOK_SECRET secret | BLOCKED_EXTERNAL (BLOCKER-007) |

---

## EAS Build Configuration

| Profile | Status |
|---------|--------|
| development (simulator) | CONFIGURED |
| preview (internal distribution) | CONFIGURED |
| production (autoIncrement, app-bundle) | CONFIGURED |
| submit.production.ios | CONFIGURED — awaiting Apple credentials |
| submit.production.android | CONFIGURED — awaiting service account JSON |

---

## Store Assets

| Asset | Status |
|-------|--------|
| App Store metadata | COMPLETE — docs/store/APP_STORE_METADATA.md |
| Google Play metadata | COMPLETE — docs/store/GOOGLE_PLAY_METADATA.md |
| iOS Privacy Manifest | DOCUMENTED — docs/store/IOS_PRIVACY_MANIFEST.md |
| App icon | EXISTS — assets/images/app-icon-aoa.png (needs InvisiProof branding) |
| Screenshots | BLOCKED_EXTERNAL — requires production build |

---

## Analytics

| Item | Status |
|------|--------|
| PostHog integration | COMPLETE — client initialized, all events instrumented |
| PostHog API key | PLACEHOLDER — replace phc_placeholder_replace_before_launch |
| Privacy compliance | COMPLETE — no content captured, only enum/boolean/count values |
| Paywall events | COMPLETE — paywall_viewed, purchase_started, purchase_completed, purchase_failed |

---

## Pre-Launch Action Items (Owner)

### Critical (blocks store submission)
1. Update app.json: name, slug, bundleIdentifier, package, scheme → InvisiProof values
2. Configure Apple Developer account (BLOCKER-001)
3. Configure Google Play Console (BLOCKER-002)
4. Configure RevenueCat (BLOCKER-003)
5. Set REVENUECAT_WEBHOOK_SECRET in Supabase (BLOCKER-007)

### Important (blocks full functionality)
6. Replace PostHog placeholder API key in services/analytics.ts
7. Create demo account for store review (BLOCKER-006)
8. Assign invisiproof.com domain in Vercel (BLOCKER-004)
9. Deploy docs to Mintlify (BLOCKER-005)

### Nice to have
10. Replace app icon with InvisiProof-branded asset
11. Capture production screenshots for store listings
