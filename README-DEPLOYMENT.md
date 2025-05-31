# Deployment Guide - Credit Card Application Advisor

This guide will help you deploy the app to Vercel so that Stripe webhooks work properly in production.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Stripe Account**: Your test/live Stripe account with the keys from `.env`
3. **Database**: Set up a production database (recommended: Supabase PostgreSQL)

## Step 1: Prepare for Deployment

### 1.1 Update Database for Production
If using SQLite locally, you'll need a PostgreSQL database for production:

```bash
# Option A: Use Supabase (recommended)
# 1. Go to https://supabase.com
# 2. Create a new project
# 3. Get the DATABASE_URL from Project Settings > Database

# Option B: Use Vercel Postgres
# 1. In your Vercel dashboard, go to Storage
# 2. Create a Postgres database
# 3. Get the connection string
```

### 1.2 Update Environment Variables for Production
You'll need to update some variables for production:

- `NEXTAUTH_URL`: Change from `http://localhost:3000` to your Vercel domain
- `DATABASE_URL`: Use production database URL
- `STRIPE_WEBHOOK_SECRET`: Will be generated after deployment

## Step 2: Deploy to Vercel

### 2.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 2.2 Login to Vercel
```bash
vercel login
```

### 2.3 Deploy
```bash
# From the credit-card-optimizer directory
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: credit-card-optimizer (or your choice)
# - Directory: ./
# - Override settings? No
```

### 2.4 Set Environment Variables
```bash
# Set all environment variables (replace values with your production values)
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_PREMIUM_PRICE_ID
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET
vercel env add FACEBOOK_CLIENT_ID
vercel env add FACEBOOK_CLIENT_SECRET
vercel env add TWITTER_CLIENT_ID
vercel env add TWITTER_CLIENT_SECRET
vercel env add AUTH_RESEND_KEY
vercel env add EMAIL_FROM
```

## Step 3: Set Up Database Schema

### 3.1 Push Schema to Production Database
```bash
# Generate and push schema
npx prisma db push
```

## Step 4: Configure Stripe Webhooks

### 4.1 Get Your Deployment URL
After deployment, you'll get a URL like: `https://your-app.vercel.app`

### 4.2 Create Webhook in Stripe Dashboard
1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL: `https://your-app.vercel.app/api/stripe/webhooks`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"

### 4.3 Update Webhook Secret
1. Copy the webhook signing secret from Stripe
2. Update the environment variable:
```bash
vercel env add STRIPE_WEBHOOK_SECRET production
# Paste the webhook secret when prompted
```

### 4.4 Redeploy with New Webhook Secret
```bash
vercel --prod
```

## Step 5: Configure OAuth Providers

Update your OAuth app settings to include the new domain:

### Google OAuth
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Navigate to APIs & Services > Credentials
- Edit your OAuth 2.0 client
- Add to Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`

### GitHub OAuth
- Go to GitHub > Settings > Developer settings > OAuth Apps
- Edit your app
- Update Authorization callback URL: `https://your-app.vercel.app/api/auth/callback/github`

### Repeat for other OAuth providers...

## Step 6: Test the Deployment

### 6.1 Test Basic Functionality
1. Visit your deployed app
2. Test sign-in with OAuth providers
3. Test spending input and recommendations

### 6.2 Test Stripe Integration
1. Go to `/pricing` page
2. Click "Start 7-Day Free Trial"
3. Complete checkout with test card: `4242 4242 4242 4242`
4. Verify webhook receives the subscription event
5. Check that subscription status updates automatically

### 6.3 Test Customer Portal
1. After successful payment, click "Manage Subscription"
2. Verify portal opens correctly

## Step 7: Monitor and Debug

### 7.1 View Logs
```bash
vercel logs
```

### 7.2 Check Webhook Deliveries
- Go to Stripe Dashboard > Webhooks
- Click on your webhook endpoint
- Check the "Recent deliveries" section

## Troubleshooting

### Database Connection Issues
- Ensure DATABASE_URL is correctly set
- Check that the database is accessible from Vercel
- Verify the connection string format

### Webhook Issues
- Check webhook URL is exactly: `https://your-domain.vercel.app/api/stripe/webhooks`
- Verify webhook secret is correctly set
- Check Stripe webhook delivery logs

### OAuth Issues
- Ensure all OAuth redirect URLs are updated
- Check that client IDs and secrets are correctly set

## Environment Variables Reference

Here's what each variable should contain for production:

```
DATABASE_URL="postgresql://user:pass@host:port/database"
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-production-secret"
STRIPE_SECRET_KEY="sk_live_..." (or sk_test_ for testing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..." (or pk_test_)
STRIPE_WEBHOOK_SECRET="whsec_..." (from webhook endpoint)
STRIPE_PREMIUM_PRICE_ID="price_..." (your premium price ID)
# ... other OAuth variables
```

## Security Notes

- Never commit `.env` files to version control
- Use different secrets for production vs development
- Consider using live Stripe keys for production
- Regularly rotate secrets and API keys 