# Stage 02: Billing release checklist

## Pricing contract
Pro £7 monthly / £56 annually; Business £17 monthly / £136 annually.
Enterprise is contact-sales on public pricing; the legacy API catalog retains £50 / £400.
The existing Free plan remains unchanged. No new trial is promised or configured.
Checkout creates recurring price data from the shared catalog. Existing Stripe products and prices are not changed.

## Configuration
Use a separate test-mode Stripe account and a non-production Supabase database for testing. Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL (or existing configured equivalent), SUPABASE_SERVICE_ROLE_KEY and APP_URL to the trusted deployment origin. Never commit secrets. Configure webhook endpoint /api/webhooks/stripe for checkout.session.completed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted and invoice events. Verify Stripe customer portal settings for plan management.

## Required before release
- [ ] CI installs dependencies, runs dashboard and billing contract tests, builds frontend.
- [ ] In test mode verify Pro monthly (£7), Pro yearly (£56), Business monthly (£17), Business yearly (£136) and currency GBP in Stripe Checkout.
- [ ] Verify signed-out visitors return to pricing after login; reselect desired interval.
- [ ] Verify checkout cancel, success, failed payment, delayed webhook, replayed webhook and unrelated session IDs.
- [ ] Verify account ownership, subscription cancellation and renewal and customer portal.
- [ ] Verify paid entitlements in the authenticated dashboard and existing legacy subscriptions.
- [ ] Check multiple open checkout sessions and concurrent requests; robust cross-request idempotency remains follow-up work.
- [ ] Verify canonical APP_URL and deployment environment, including the legacy return route.
- [ ] Audit remaining Supabase edge-function billing paths and old externally shared payment links before retiring them.

Static tests do not prove live checkout works. Do not merge/release billing changes solely on source inspection. Use Stripe test cards only in test mode. No real charge is needed.
