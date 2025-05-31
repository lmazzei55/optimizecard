#!/bin/bash

echo "🚀 Setting up Vercel environment variables..."

# Load environment variables from .env file
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Export variables from .env file
set -a
source .env
set +a

# List of variables to add to Vercel
ENV_VARS=(
    "STRIPE_PREMIUM_PRICE_ID"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "GITHUB_CLIENT_ID"
    "GITHUB_CLIENT_SECRET"
    "FACEBOOK_CLIENT_ID"
    "FACEBOOK_CLIENT_SECRET"
    "TWITTER_CLIENT_ID"
    "TWITTER_CLIENT_SECRET"
    "AUTH_RESEND_KEY"
    "EMAIL_FROM"
)

# Function to add environment variable to Vercel
add_env_var() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [ -z "$var_value" ]; then
        echo "⚠️  Skipping $var_name (not set in .env)"
        return
    fi
    
    echo "📝 Adding $var_name..."
    
    # Use printf to handle the input properly
    printf "%s\na\n" "$var_value" | vercel env add "$var_name" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Added $var_name"
    else
        echo "❌ Failed to add $var_name"
    fi
}

echo ""
echo "Adding environment variables to Vercel..."
echo "Note: All variables will be added to Production, Preview, and Development"
echo ""

# Add each environment variable
for var in "${ENV_VARS[@]}"; do
    add_env_var "$var"
done

echo ""
echo "✅ Environment variable setup complete!"
echo ""
echo "🔄 Now let's deploy to Vercel..." 