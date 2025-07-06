# Subscription Sync Guide

This guide explains how to prevent and fix subscription sync issues between Stripe and the database.

## The Problem

Sometimes users who pay for premium subscriptions via Stripe still show as "free tier" in the app. This happens when:

1. **Webhook Delivery Fails**: Stripe webhooks fail to reach our server
2. **Database Connection Issues**: Prepared statement conflicts prevent webhook processing
3. **Timing Issues**: User accesses app before webhook processes

## Prevention (Long-term Solution)

### 1. Automatic Detection & Sync

The app now automatically detects and fixes subscription mismatches:

- **User Subscription API** (`/api/user/subscription`) now checks Stripe when database shows "free"
- **Auto-upgrade**: If active Stripe subscription found, automatically upgrades user to premium
- **Logging**: All sync operations are logged for debugging

### 2. Enhanced Webhook Reliability

- **Retry Logic**: Database operations use retry logic with exponential backoff
- **Better Error Handling**: Webhooks return proper status codes for Stripe retry logic
- **Direct Database Updates**: Uses raw SQL to avoid Prisma prepared statement conflicts

### 3. Fallback Mechanisms

- **localStorage Caching**: Premium status cached in browser for resilience
- **Multiple Verification Points**: App checks subscription at multiple points
- **Graceful Degradation**: App continues working even with temporary database issues

## Fixing Existing Issues

### Option 1: Automatic Fix (Recommended)

Just refresh the app! The enhanced subscription API will:
1. Detect the mismatch between database (free) and Stripe (premium)
2. Automatically upgrade the user to premium
3. Cache the premium status for future reliability

### Option 2: Manual User Sync

For individual users, use the sync endpoint:

```bash
# Sync specific user
curl -X POST https://your-app.vercel.app/api/stripe/sync-subscription \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# Or sync authenticated user (no email needed)
curl -X POST https://your-app.vercel.app/api/stripe/sync-subscription \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Option 3: Admin Sync (For Support)

For admin/support use, there's a protected endpoint:

```bash
curl -X POST https://your-app.vercel.app/api/admin/sync-user-subscription \
  -H "Authorization: Bearer admin-sync-2024" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

### Option 4: Direct Database Fix (Emergency)

If all else fails, directly update the database:

```javascript
// Run this script with: DATABASE_URL="your-url" node fix-subscription.js
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

await client.connect();
await client.query(`
  UPDATE "User" 
  SET 
    "subscriptionTier" = 'premium',
    "subscriptionStatus" = 'active',
    "trialEndDate" = '2025-07-07T23:59:59Z'
  WHERE "email" = 'user@example.com'
`);
await client.end();
```

## Monitoring & Debugging

### Check User Status

```bash
# Check what Stripe thinks
curl https://your-app.vercel.app/api/stripe/verify-subscription

# Check what database thinks  
curl https://your-app.vercel.app/api/user/subscription
```

### Webhook Testing

```bash
# Test webhook processing
curl -X POST https://your-app.vercel.app/api/stripe/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"customer_email":"user@example.com"}'
```

### Logs to Monitor

- `🎯 Found active subscription for free-tier user, upgrading...` - Auto-sync working
- `✅ User upgraded to premium automatically` - Successful auto-upgrade
- `⚠️ Stripe verification failed` - Stripe API issues
- `❌ prepared statement already exists` - Database connection issues

## Best Practices

1. **Monitor Webhook Delivery**: Check Stripe dashboard for failed webhooks
2. **Database Health**: Monitor for prepared statement conflicts
3. **User Feedback**: Have users report subscription issues quickly
4. **Regular Audits**: Periodically compare Stripe vs database subscription states

## Recovery Commands

Quick reference for common fixes:

```bash
# Fix specific user
curl -X POST /api/stripe/sync-subscription -d '{"email":"user@example.com"}'

# Force verification for authenticated user
curl -X GET /api/stripe/verify-subscription

# Admin emergency sync
curl -X POST /api/admin/sync-user-subscription \
  -H "Authorization: Bearer admin-sync-2024" \
  -d '{"email":"user@example.com"}'
```

## Technical Details

### Database Schema Updates

The sync process updates these fields:
- `subscriptionTier`: 'free' or 'premium'
- `subscriptionStatus`: 'active', 'trialing', 'past_due', etc.
- `customerId`: Stripe customer ID
- `subscriptionId`: Stripe subscription ID
- `subscriptionStartDate`: When subscription started
- `subscriptionEndDate`: When current period ends
- `trialEndDate`: When trial ends (if applicable)

### Error Handling

- **503 Service Unavailable**: Stripe not configured
- **401 Unauthorized**: Authentication required
- **404 Not Found**: User or subscription not found
- **500 Internal Server Error**: Database or Stripe API error

The system is designed to gracefully handle all these errors and provide fallback functionality. 