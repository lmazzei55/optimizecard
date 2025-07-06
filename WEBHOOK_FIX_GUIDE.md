# Stripe Webhook Fix Guide

## Immediate Actions Required

Your Stripe webhooks are failing and will be disabled on **July 8, 2025**. Here's how to fix them:

## Step 1: Test Webhook Configuration

First, test if your webhook endpoint is reachable:

```bash
# Test if the endpoint is accessible
curl https://optimizecard.com/api/stripe/webhooks/test

# Should return something like:
{
  "status": "ok",
  "stripeConfigured": true,
  "webhookSecretConfigured": true,
  "webhookSecretPrefix": "whsec_",
  "timestamp": "2025-06-30T..."
}
```

## Step 2: Check Environment Variables

Make sure these are set in your Vercel environment:

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Go to Settings → Environment Variables
4. Verify these exist:
   - `STRIPE_SECRET_KEY` (should start with `sk_live_`)
   - `STRIPE_WEBHOOK_SECRET` (should start with `whsec_`)
   - `DATABASE_URL` (your Supabase connection string)

## Step 3: Get the Correct Webhook Secret

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your webhook endpoint (`https://optimizecard.com/api/stripe/webhooks`)
3. Click "Reveal" under "Signing secret"
4. Copy the entire secret (starts with `whsec_`)
5. Update it in Vercel:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_[your-secret-here]
   ```

## Step 4: Test with Stripe CLI

Install Stripe CLI and test locally:

```bash
# Install Stripe CLI (if not already)
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to your production endpoint
stripe listen --forward-to https://optimizecard.com/api/stripe/webhooks

# In another terminal, trigger a test event
stripe trigger checkout.session.completed
```

## Step 5: Check Vercel Logs

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Go to Functions tab
4. Look for `/api/stripe/webhooks` logs
5. Check for error messages

## Common Issues and Fixes

### Issue 1: Wrong Webhook Secret
**Symptom**: "Invalid signature" errors
**Fix**: Make sure `STRIPE_WEBHOOK_SECRET` in Vercel matches exactly what's in Stripe Dashboard

### Issue 2: Database Connection Errors
**Symptom**: "prepared statement already exists" errors
**Fix**: Already implemented retry logic and direct SQL queries

### Issue 3: Missing Environment Variables
**Symptom**: 503 errors, "Stripe not configured"
**Fix**: Add all required environment variables to Vercel

### Issue 4: Timeout Issues
**Symptom**: Webhook times out after 20 seconds
**Fix**: Our webhook handlers are already optimized with retry logic

## Step 6: Verify Fix in Stripe Dashboard

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your webhook endpoint
3. Look at "Recent deliveries"
4. Recent events should show "Succeeded" (200 status)

## Step 7: Manual Webhook Replay

If you have failed events:

1. In Stripe Dashboard → Webhooks → Your endpoint
2. Click on a failed event
3. Click "Resend" to retry it
4. Check if it succeeds with the fixes

## Emergency Fallback

If webhooks continue to fail, use the manual sync as a temporary solution:

```bash
# For specific user
curl -X POST https://optimizecard.com/api/admin/sync-user-subscription \
  -H "Authorization: Bearer admin-sync-2024" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

## Monitoring

After fixing, monitor for 24 hours:

1. Check Stripe Dashboard for successful webhook deliveries
2. Monitor Vercel logs for any errors
3. Test a real subscription to ensure it syncs properly

## Prevention

1. **Set up webhook monitoring** in Stripe Dashboard
2. **Enable email alerts** for webhook failures
3. **Test webhooks** after any deployment
4. **Keep webhook secret** secure and up to date

## Need Help?

If webhooks still fail after these steps:

1. Check Vercel function logs for specific errors
2. Test with `curl` to see exact error responses
3. Verify all environment variables are correct
4. Check if Vercel is blocking Stripe IPs (unlikely but possible)

Remember: The auto-sync feature we implemented will catch any missed webhooks, but fixing the webhooks is critical for real-time updates. 