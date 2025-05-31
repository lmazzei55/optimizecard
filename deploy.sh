#!/bin/bash

echo "🚀 Deploying Credit Card Application Advisor to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "Please log in to Vercel:"
    vercel login
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Get your deployment URL from the output above"
echo "2. Update your .env variables for production:"
echo "   - NEXTAUTH_URL: https://your-app.vercel.app"
echo "   - DATABASE_URL: Your production database URL"
echo "3. Set up Stripe webhook:"
echo "   - Go to https://dashboard.stripe.com/webhooks"
echo "   - Add endpoint: https://your-app.vercel.app/api/stripe/webhooks"
echo "   - Select events: customer.subscription.*, invoice.payment_*"
echo "   - Update STRIPE_WEBHOOK_SECRET with the new secret"
echo "4. Update OAuth redirect URLs for all providers"
echo "5. Test the deployed application"
echo ""
echo "📖 See README-DEPLOYMENT.md for detailed instructions" 