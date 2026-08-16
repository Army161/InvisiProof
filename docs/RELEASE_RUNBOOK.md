# Release Runbook — InvisiProof

## Pre-Release Checklist

### External Blockers (must be resolved first)
- [ ] BLOCKER-008: Update app.json with InvisiProof bundle identifiers and scheme
- [ ] BLOCKER-003: RevenueCat configured (products created, SDK keys obtained)
- [ ] BLOCKER-007: REVENUECAT_WEBHOOK_SECRET set in Supabase Edge Function secrets
- [ ] BLOCKER-001: Apple Developer account configured (Apple ID, Team ID, ASC App ID in eas.json)
- [ ] BLOCKER-002: Google Play Console configured (service account JSON at ./google-play-service-account.json)
- [ ] BLOCKER-004: Vercel domain assigned (invisiproof.com)
- [ ] BLOCKER-005: Mintlify docs deployed (docs.invisiproof.com)
- [ ] BLOCKER-006: Demo account created for store review
- [ ] BLOCKER-009: PostHog API key replaced in services/analytics.ts

### Code Verification
- [ ] Run `eas build --platform ios --profile development` and smoke-test on simulator
- [ ] Verify auth flow end-to-end (sign-up → verify email → sign-in)
- [ ] Verify scan flow (image, text, URL)
- [ ] Verify proof request creation and code entry
- [ ] Verify subscription screen loads entitlement correctly
- [ ] Verify account deletion works

---

## Build Commands

```bash
# iOS production build
eas build --platform ios --profile production

# Android production build
eas build --platform android --profile production

# Both platforms simultaneously
eas build --platform all --profile production

# Submit to stores (after builds complete)
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

---

## EAS Build Profiles

| Profile | Distribution | iOS | Android | Use for |
|---------|-------------|-----|---------|---------|
| development | internal | simulator | APK | Local dev |
| preview | internal | device | APK | QA testing |
| production | store | IPA | AAB | Store submission |

---

## Supabase Edge Functions

| Function | URL | Purpose |
|----------|-----|---------|
| revenuecat-webhook | https://kmipbsotthgigkndazot.supabase.co/functions/v1/revenuecat-webhook | Subscription lifecycle events |
| analyze-scan | https://kmipbsotthgigkndazot.supabase.co/functions/v1/analyze-scan | AI analysis with quota enforcement |

---

## RevenueCat Webhook Configuration

1. In RevenueCat dashboard: Project Settings → Webhooks → Add Endpoint
2. URL: `https://kmipbsotthgigkndazot.supabase.co/functions/v1/revenuecat-webhook`
3. Copy the Authorization header value
4. In Supabase dashboard: Settings → Edge Functions → Secrets
5. Add secret: `REVENUECAT_WEBHOOK_SECRET` = (value from step 3)

---

## Post-Release Monitoring (First 24 Hours)

1. **Supabase Edge Function logs**
   - Dashboard: https://supabase.com/dashboard/project/kmipbsotthgigkndazot/functions
   - Watch for: revenuecat-webhook errors, analyze-scan quota enforcement errors

2. **RevenueCat webhook delivery**
   - Dashboard: https://app.revenuecat.com → Project Settings → Webhooks
   - Watch for: failed deliveries, retry storms

3. **PostHog onboarding funnel**
   - Events to monitor: app_opened → account_created → scan_started → scan_completed
   - Watch for: drop-off at verify-email step (common friction point)

4. **Crash reports**
   - Check EAS dashboard for JS bundle errors
   - Check Supabase logs for RLS policy violations (403s)

5. **Assessment quota enforcement**
   - Verify free-tier users are correctly blocked at 2 scans/month
   - Verify usage_counters table is incrementing correctly

---

## Rollback Procedure

### App rollback
1. In TestFlight: select previous build, set as active
2. In Play Console: Releases → select previous release → Rollout

### Edge function rollback
1. Supabase dashboard → Edge Functions → select function → Deployments
2. Select previous deployment → Promote to active

### Database rollback
Each migration in the sprint has a corresponding rollback SQL.
Run rollback SQL via Supabase SQL editor if a migration causes issues.
Tables added in this sprint (subscriptions, usage_counters, webhook_events) can be dropped
safely if needed — they are additive and do not modify existing tables.

---

## Seven-Day Stabilization Plan

### Day 1–2: Monitor and triage
- Watch all monitoring channels listed above
- Respond to any App Store review feedback
- Fix any critical bugs via EAS Update (OTA) if possible

### Day 3–4: Analytics review
- Review PostHog funnel: where are users dropping off?
- Check scan completion rate vs. scan started rate
- Review paywall conversion if RevenueCat is live

### Day 5–7: Iteration
- Address any App Store review rejection feedback
- Deploy fixes via EAS Update for JS-only changes
- Submit new build via EAS if native changes required
- Begin collecting user feedback via help-support screen

---

## OTA Updates (EAS Update)

For JavaScript-only fixes (no native module changes), use EAS Update to push without store review:

```bash
# Push OTA update to production channel
eas update --channel production --message "Fix: [description]"
```

OTA updates are NOT suitable for:
- Changes to native modules or plugins
- Changes to app.json (bundleIdentifier, permissions, etc.)
- New native dependencies
