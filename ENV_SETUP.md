# Environment Variables Setup

Update your `.env` file with the following variables:

```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth.js Configuration
NEXTAUTH_SECRET="your-nextauth-secret-key-here"
NEXTAUTH_URL="http://localhost:3001"

# Stripe Configuration (Get from Stripe Dashboard)
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
STRIPE_PREMIUM_PRICE_ID="price_your-premium-price-id"

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth (Get from GitHub Developer Settings)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Meta (Facebook) OAuth (Get from Meta for Developers)
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"

# X (Twitter) OAuth (Get from X Developer Portal)
TWITTER_CLIENT_ID="your-twitter-client-id"
TWITTER_CLIENT_SECRET="your-twitter-client-secret"

# Resend Email (Get from Resend.com)
AUTH_RESEND_KEY="your-resend-api-key"
EMAIL_FROM="noreply@yourdomain.com"
```

## Quick Commands

Generate a secure NextAuth secret:
```bash
openssl rand -base64 32
```

Or use this online generator: https://generate-secret.vercel.app/32

## 🔐 OAuth Provider Setup Instructions

### **Google OAuth Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3001/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)
   - Save the **Client ID** and **Client Secret**

### **GitHub OAuth Setup**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: "Credit Card Optimizer"
   - **Homepage URL**: `http://localhost:3001` (dev) or your domain
   - **Authorization callback URL**: `http://localhost:3001/api/auth/callback/github`
4. Save the **Client ID** and **Client Secret**

### **Meta (Facebook) OAuth Setup**
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "Create App" → Choose "Consumer" or "Business"
3. Add "Facebook Login" product to your app
4. In Facebook Login settings:
   - Add Valid OAuth Redirect URIs: `http://localhost:3001/api/auth/callback/facebook`
5. Go to App Settings → Basic
6. Save the **App ID** (use as FACEBOOK_CLIENT_ID) and **App Secret**

### **X (Twitter) OAuth Setup**
1. Go to [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app
3. Enable OAuth 2.0 in your app settings
4. Add callback URL: `http://localhost:3001/api/auth/callback/twitter`
5. Generate your **Client ID** and **Client Secret**
6. Make sure to enable "Request email from users" in permissions

### **Stripe Setup (Payment Processing)**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create a new account or sign in
3. Get your API keys:
   - Go to "Developers" → "API keys"
   - Copy your **Publishable key** (starts with `pk_test_`)
   - Copy your **Secret key** (starts with `sk_test_`)
4. Create a Premium subscription product:
   - Go to "Products" → "Add product"
   - Name: "Premium Subscription"
   - Pricing: $9.99/month recurring
   - Copy the **Price ID** (starts with `price_`)
5. Set up webhooks:
   - Go to "Developers" → "Webhooks" → "Add endpoint"
   - URL: `https://yourdomain.com/api/webhooks/stripe` (or localhost for dev)
   - Events: Select all `customer.subscription.*` events
   - Copy the **Webhook secret** (starts with `whsec_`)

**⚠️ IMPORTANT for Development:**
- For local testing, webhooks won't work with `localhost` URLs
- Use [ngrok](https://ngrok.com/) or similar to expose your local server:
  ```bash
  ngrok http 3000
  ```
- Then use the ngrok URL in your webhook endpoint: `https://your-ngrok-url.ngrok.io/api/webhooks/stripe`
- Alternatively, use the "Verify Subscription" button on the pricing page to manually sync subscription status

### **Resend (Email) Setup**
1. Go to [Resend.com](https://resend.com/)
2. Sign up and verify your account
3. Get your **API Key** from the dashboard
4. (Optional) Add your domain for production email sending 