# Credit Card Optimizer – Project Overview

## 1. What the App Is

The Credit Card Optimizer is a modern web application that helps users maximize their credit card rewards through personalized recommendations based on spending patterns and preferences. The app uses a sophisticated mathematical algorithm to analyze user spending across multiple categories and recommends the optimal credit card(s) to maximize annual rewards value.

The target users are financially-aware consumers who want to optimize their credit card rewards without manually calculating complex reward structures across multiple cards and categories.

## 2. Core Functionality (Today)

| Area | Description | Key Endpoints / Components |
|------|-------------|----------------------------|
| **Authentication** | NextAuth.js v5 with OAuth providers (Google, GitHub, Facebook, Twitter) and magic links via Resend | `src/app/api/auth/[...nextauth]/route.ts`, `src/lib/auth.ts` |
| **Recommendation Engine** | Mathematical algorithm that calculates net annual value considering spending patterns, reward rates, benefits, and fees | `src/lib/recommendation-engine.ts`, `src/app/api/recommendations/route.ts` |
| **Spending Input System** | Interactive form with sliders and text inputs for 8+ spending categories with optional subcategory precision, enhanced with explanatory tooltips for all categories and intelligent $0 input feedback | `src/components/SpendingForm.tsx`, `src/components/ui/InfoTooltip.tsx`, `src/app/api/categories/route.ts` |
| **User Profiles & Preferences** | Save reward preferences, point valuations, subcategory settings, and owned cards management | `src/app/api/user/preferences/route.ts`, `src/app/profile/page.tsx` |
| **Subscription System** | Stripe-integrated freemium model with free tier (no-fee cards) and premium tier (all cards) | `src/app/api/stripe/`, `src/lib/stripe.ts` |
| **Multi-Card Strategies** | Premium feature that optimizes 2-3 card combinations for maximum rewards across categories | `src/components/MultiCardStrategies.tsx`, `src/lib/multi-card-engine.ts` |
| **Card Customization** | Per-card benefit valuation and point value customization | `src/components/CardCustomizationModal.tsx` |
| **Admin System** | Comprehensive admin tools for managing credit card database | `src/app/api/admin/`, `README-ADMIN.md` |

## 3. Recent Changes / Known Issues

**2025-01-02** – Fixed critical subscription sync issue where users showed as 'free' tier despite successful payment due to 503 database errors; enhanced fallback mechanisms with Stripe verification and premium status caching

**2025-01-02** – Completed tooltip explanations feature with comprehensive category tooltips, intelligent $0 input feedback, and full accessibility support including keyboard navigation and ARIA labels

**2024-12-XX** – Comprehensive authentication fixes implemented with enhanced error handling, logging, and graceful degradation for database issues

**2024-12-XX** – Fixed retry logic stuck at "1/4" issue by enhancing empty result handling and improving database connection resilience

**2024-12-XX** – Resolved "Get My Recommendations" button not working by populating database with credit cards and fixing retry logic

**2024-12-XX** – Implemented warmup system to address cold start behavior in serverless environment, improving initial load times

**2024-12-XX** – Added comprehensive fixes for spending persistence issues, subcategory aggregation, and cross-component synchronization

**2024-12-XX** – Enhanced subscription loading UX with visible indicators and optimized initializations for better first-use experience (Date: [current date])

**2024-12-XX** – Implemented global UserState loading overlay that displays across all pages during initialization (Date: January 11, 2025)

**Known Issues:**
- Spending amounts reset on page navigation due to hydration mismatch (data saves/loads correctly, issue is client-side state)
- First-time visitors experience 5-10 second load times due to serverless cold starts (expected behavior)

## 4. Future Improvements / Ideas

- **Onboarding Tour** – Interactive guided tour for new users to understand the app's features and workflow
- **Enhanced Multi-Card Strategies** – Advanced optimization for 4+ card combinations with category specialization
- **Signup Bonus Tracking** – Track and remind users of signup bonus opportunities and requirements
- **Spending Analytics Dashboard** – Historical spending analysis and reward tracking over time
- **Business Credit Cards** – Expand database to include business credit cards with different reward structures
- **Mobile App** – React Native or PWA version for mobile-first experience
- **Card Portfolio Analysis** – Analyze user's current card portfolio and suggest optimizations
- **Automated Spending Import** – Integration with financial institutions for automatic spending categorization
- **Reward Redemption Optimization** – Suggest optimal redemption strategies for points-based rewards

## 5. Architectural Notes

### High-Level Architecture
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API routes with Prisma ORM and SQLite database
- **Authentication**: NextAuth.js v5 with JWT strategy and multiple OAuth providers
- **Payments**: Stripe integration with webhook handling for subscription management
- **Deployment**: Vercel with serverless functions

### Key Design Decisions
- **Freemium Model**: Free tier shows no-annual-fee cards, premium tier shows all cards
- **Subcategory System**: Hierarchical category structure with merchant-specific optimization
- **Recommendation Algorithm**: Prioritizes subcategory-specific rewards, falls back to parent category rates
- **Real-time Updates**: Instant recalculation as users adjust spending or preferences
- **Graceful Degradation**: App works for anonymous users, enhanced experience for authenticated users

### Trade-offs
- **SQLite vs PostgreSQL**: SQLite for simplicity in development, easily migrated to PostgreSQL for production scale
- **Serverless vs Always-On**: Serverless for cost efficiency, cold starts addressed with warmup system
- **Client-side vs Server-side State**: Hybrid approach with localStorage for immediate feedback, database for persistence

## 6. Reference Material

- **Admin Documentation**: `README-ADMIN.md` - Complete admin workflows and API reference
- **API Documentation**: `ADMIN_API.md` - Technical endpoint documentation
- **Deployment Guide**: `README-DEPLOYMENT.md` - Production deployment instructions
- **Environment Setup**: `ENV_SETUP.md` - OAuth provider configuration
- **Stripe Setup**: `STRIPE_SETUP.md` - Payment system configuration
- **Comprehensive Analysis**: `FINAL_COMPREHENSIVE_ANALYSIS.md` - Detailed feature analysis
- **Recent Fixes**: `COMPREHENSIVE_FIXES_SUMMARY.md` - Latest bug fixes and improvements
- **Authentication Fixes**: `AUTHENTICATION_FIXES.md` - Auth system improvements
- **Main README**: `README.md` - Quick start guide and feature overview 