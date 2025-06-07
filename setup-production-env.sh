#!/bin/bash

echo "🔧 Setting up critical environment variables for NextAuth..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Check if user is logged in to Vercel
echo -e "${BLUE}🔐 Checking Vercel authentication...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Please log in to Vercel:${NC}"
    vercel login
fi

# Function to add environment variable to Vercel
add_env_var() {
    local var_name=$1
    local var_value=$2
    local env_type=${3:-"production,preview,development"}
    
    echo -e "${BLUE}📝 Adding $var_name to Vercel...${NC}"
    
    # Remove existing variable if it exists
    vercel env rm "$var_name" production --yes 2>/dev/null || true
    vercel env rm "$var_name" preview --yes 2>/dev/null || true
    vercel env rm "$var_name" development --yes 2>/dev/null || true
    
    # Add the variable to all environments
    echo "$var_value" | vercel env add "$var_name" production
    echo "$var_value" | vercel env add "$var_name" preview  
    echo "$var_value" | vercel env add "$var_name" development
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Added $var_name${NC}"
    else
        echo -e "${RED}❌ Failed to add $var_name${NC}"
    fi
}

echo ""
echo -e "${YELLOW}🔐 Setting up CRITICAL authentication variables...${NC}"
echo ""

# Generate and set NEXTAUTH_SECRET (CRITICAL)
NEXTAUTH_SECRET="bNa+Ug6TTuz2M82PuGDf/M4xAtsnumfT2S7iwVEsw+g="
add_env_var "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET"

# Set NEXTAUTH_URL for production (CRITICAL) 
add_env_var "NEXTAUTH_URL" "https://optimizecard.com"

# Set AUTH_TRUST_HOST for Vercel deployment
add_env_var "AUTH_TRUST_HOST" "true"

echo ""
echo -e "${YELLOW}📊 Setting up OAuth provider placeholders (will be disabled if empty)...${NC}"
echo ""

# OAuth Provider placeholders - these will be disabled in our defensive config
# Only set these with real values - leaving empty for now
# add_env_var "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID"
# add_env_var "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET"
# add_env_var "GITHUB_CLIENT_ID" "$GITHUB_CLIENT_ID"
# add_env_var "GITHUB_CLIENT_SECRET" "$GITHUB_CLIENT_SECRET"
# add_env_var "FACEBOOK_CLIENT_ID" "$FACEBOOK_CLIENT_ID"
# add_env_var "FACEBOOK_CLIENT_SECRET" "$FACEBOOK_CLIENT_SECRET"
# add_env_var "TWITTER_CLIENT_ID" "$TWITTER_CLIENT_ID"
# add_env_var "TWITTER_CLIENT_SECRET" "$TWITTER_CLIENT_SECRET"
# add_env_var "AUTH_RESEND_KEY" "$AUTH_RESEND_KEY"
add_env_var "EMAIL_FROM" "noreply@optimizecard.com"

echo ""
echo -e "${YELLOW}💾 Setting up database and other services...${NC}"
echo ""

# Database (using existing Supabase)
add_env_var "DATABASE_URL" "postgresql://postgres.gfnimxlygbsgujuvvpag:EnzoPizza123!@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

echo ""
echo -e "${GREEN}✅ Environment variable setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. The app will now work with anonymous users"
echo "2. Authentication will show 'Provider not configured' for OAuth"
echo "3. To enable OAuth providers, update the environment variables with real credentials"
echo "4. Deploy the app with: vercel --prod"
echo ""
echo -e "${YELLOW}🔧 To configure OAuth providers:${NC}"
echo "   Google: https://console.cloud.google.com/"
echo "   GitHub: https://github.com/settings/developers"
echo "   Facebook: https://developers.facebook.com/"
echo "   Twitter/X: https://developer.twitter.com/"
echo "   Resend (Email): https://resend.com/"
echo ""

# Trigger a redeploy
echo -e "${BLUE}🚀 Triggering redeploy...${NC}"
git add -A
git commit -m "Add production environment variables setup" || true
git push

echo -e "${GREEN}🎉 Setup complete! Check your deployment at https://optimizecard.com${NC}" 