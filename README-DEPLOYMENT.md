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

- `NEXTAUTH_URL`: Change from `http://localhost:3000` to your production domain (e.g., `https://optimizecard.com`)
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
vercel env add NEXTAUTH_URL  # Set to https://optimizecard.com
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
After deployment, you'll get a URL like: `https://optimizecard.com`

### 4.2 Create Webhook in Stripe Dashboard
1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL: `https://optimizecard.com/api/stripe/webhooks`
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
- Add to Authorized redirect URIs: `https://optimizecard.com/api/auth/callback/google`

### GitHub OAuth
- Go to GitHub > Settings > Developer settings > OAuth Apps
- Edit your app
- Update Authorization callback URL: `https://optimizecard.com/api/auth/callback/github`

### Facebook OAuth
- Go to [Meta for Developers](https://developers.facebook.com/)
- Edit your app > Facebook Login > Settings
- Add to Valid OAuth Redirect URIs: `https://optimizecard.com/api/auth/callback/facebook`

### Twitter/X OAuth
- Go to [X Developer Portal](https://developer.twitter.com/)
- Edit your app settings
- Update callback URL: `https://optimizecard.com/api/auth/callback/twitter`

## Step 6: Test the Deployment

### 6.1 Test Basic Functionality
1. Visit your deployed app at https://optimizecard.com
2. Test sign-in with OAuth providers
3. Test spending input and recommendations

### 6.2 Test Stripe Integration
1. Go to pricing page
2. Test subscription with test card: 4242 4242 4242 4242
3. Verify webhook events in Stripe dashboard

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct in Vercel environment variables
- Check if database server is running and accessible
- Test connection from local environment first

### OAuth Authentication Errors
- Ensure all OAuth redirect URLs include your production domain
- Check that OAuth app credentials are correctly set in environment variables
- Verify NEXTAUTH_URL matches your production domain

### Stripe Webhook Issues
- Confirm webhook endpoint URL is correct
- Check webhook signing secret matches environment variable
- Monitor webhook delivery attempts in Stripe dashboard

## Production Checklist

- [ ] Database is accessible and schema is deployed
- [ ] All environment variables are set correctly
- [ ] OAuth providers have correct redirect URLs
- [ ] Stripe webhooks are configured and working
- [ ] SSL certificate is active (automatic with Vercel)
- [ ] Custom domain is configured (if using)
- [ ] Error monitoring is set up (optional)

📖 For detailed environment setup, see `ENV_SETUP.md`
📖 For Stripe configuration, see `STRIPE_SETUP.md`

## Environment Variables Reference

Here's what each variable should contain for production:

```
DATABASE_URL="postgresql://user:pass@host:port/database"
NEXTAUTH_URL="https://optimizecard.com"
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