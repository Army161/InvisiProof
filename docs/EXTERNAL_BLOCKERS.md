# External Blockers

These items require owner action outside the Newly platform.

---

## BLOCKER-001: Apple Developer Account
- **Task**: Create App Store Connect app record, configure in-app purchases, submit for review
- **Owner**: Jeremy (app owner)
- **Dashboard**: https://appstoreconnect.apple.com
- **Required**: Apple Developer Program membership ($99/yr), Apple ID, Team ID
- **Preparatory work completed**: app.json configured, EAS build config ready, store metadata written, privacy manifest documented
- **Resumption**: Run `eas build --platform ios --profile production` after Apple account is configured

---

## BLOCKER-002: Google Play Console Account
- **Task**: Create Play Console app listing, configure in-app products, upload AAB
- **Owner**: Jeremy
- **Dashboard**: https://play.google.com/console
- **Required**: Google Play Developer account ($25 one-time), service account JSON
- **Preparatory work completed**: app.json configured, EAS build config ready, store metadata written
- **Resumption**: Run `eas build --platform android --profile production` then upload AAB

---

## BLOCKER-003: RevenueCat Configuration
- **Task**: Create RevenueCat project, configure products, set webhook secret
- **Owner**: Jeremy
- **Dashboard**: https://app.revenuecat.com
- **Required**: RevenueCat account, public SDK key for iOS and Android
- **Products to create**:
  - invisiproof_plus_monthly ($14.99/month)
  - invisiproof_plus_annual ($99.99/year)
  - invisiproof_pro_monthly ($34.99/month)
  - invisiproof_pro_annual ($249.99/year)
  - invisiproof_max_monthly ($79.99/month)
  - invisiproof_max_annual ($599.99/year)
- **Webhook URL**: https://kmipbsotthgigkndazot.supabase.co/functions/v1/revenuecat-webhook
- **Supabase secret to set**: REVENUECAT_WEBHOOK_SECRET in Supabase Edge Function secrets
- **Preparatory work completed**: revenuecat-webhook edge function deployed, subscriptions table created, paywall screen built

---

## BLOCKER-004: Vercel Domain Assignment
- **Task**: Assign invisiproof.com to the Vercel project serving this app's web build
- **Owner**: Jeremy
- **Dashboard**: https://vercel.com/dashboard
- **Required**: Vercel account with invisiproof.com domain, project linked to this repo
- **Preparatory work completed**: Landing page built at app/(marketing)/index.tsx

---

## BLOCKER-005: Mintlify Docs Deployment
- **Task**: Connect docs/ directory to Mintlify, configure docs.invisiproof.com
- **Owner**: Jeremy
- **Dashboard**: https://mintlify.com/dashboard
- **Required**: Mintlify account, GitHub App installation on this repo
- **DNS**: Add CNAME record: docs → cname.mintlify.builders
- **Preparatory work completed**: 37 MDX pages created, mint.json configured

---

## BLOCKER-006: Demo Account for Store Review
- **Task**: Create a test account with pre-loaded data for App Store and Play Store review
- **Owner**: Jeremy
- **Action**: Create account at invisiproof.com, run a few assessments, note credentials
- **Where to enter credentials**: eas.json submit.production.ios review notes + store metadata files

---

## BLOCKER-007: REVENUECAT_WEBHOOK_SECRET
- **Task**: Set the webhook secret in Supabase Edge Function secrets
- **Owner**: Jeremy
- **Dashboard**: https://supabase.com/dashboard/project/kmipbsotthgigkndazot/settings/functions
- **Action**: Add secret named REVENUECAT_WEBHOOK_SECRET with value matching RevenueCat webhook authorization header value (found in RevenueCat dashboard under Project Settings → Webhooks)

---

## BLOCKER-008: app.json Rebrand Values
- **Task**: Update app.json with InvisiProof bundle identifiers and scheme
- **Owner**: Jeremy (or platform agent)
- **Required changes**:
  - `name`: "ProofLoop" → "InvisiProof"
  - `slug`: "proofloop" → "invisiproof"
  - `ios.bundleIdentifier`: "com.northstarrevenue.proofloopverify" → "com.northstarrevenue.invisiproof"
  - `android.package`: "com.northstarrevenue.proofloopverify" → "com.northstarrevenue.invisiproof"
  - `scheme`: "proofloop" → "invisiproof"
  - `expo-image-picker` permissions: update "ProofLoop" → "InvisiProof" in permission strings
- **Impact**: EAS build will use wrong bundle ID until this is updated

---

## BLOCKER-009: PostHog API Key
- **Task**: Replace placeholder PostHog API key with real project key
- **Owner**: Jeremy
- **File**: services/analytics.ts, line 26
- **Current value**: `phc_placeholder_replace_before_launch`
- **Dashboard**: https://us.posthog.com (create project, copy API key)
- **Impact**: Analytics events will not be captured until this is set
