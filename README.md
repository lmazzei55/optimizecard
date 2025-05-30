# 💳 Credit Card Optimizer

A modern web application that helps users maximize their credit card rewards through personalized recommendations based on spending patterns and preferences.

![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-6.8.2-2D3748?logo=prisma)
![NextAuth](https://img.shields.io/badge/NextAuth.js-5-purple?logo=auth0)

## ✨ Features

### 🎯 Core Functionality
- **Smart Recommendations**: Mathematical algorithm analyzes spending patterns and ranks credit cards by net annual value
- **Owned Cards Exclusion**: Never get recommended cards you already have - manage your owned cards in your profile
- **Subcategory Precision**: Toggle between basic categories and detailed subcategories (Amazon, Whole Foods, Hotels, Car Rental, etc.) for merchant-specific optimization
- **Category-Based Analysis**: Input spending across 8 categories (Dining, Travel, Gas, Groceries, etc.) with optional subcategory breakdowns
- **Advanced Reward Mapping**: Intelligent fallback system - prioritizes subcategory-specific rewards, falls back to parent category rates
- **Card Benefits Valuation**: Personalize benefit values (travel credits, lounge access, etc.) based on your actual usage
- **Dual Input Methods**: Interactive sliders for quick adjustment + precise text inputs for exact amounts
- **Reward Preference**: Choose between cashback or points-based rewards with custom point valuations
- **Real-time Calculations**: Instant updates as you adjust spending amounts and benefit valuations
- **Detailed Breakdowns**: See category-by-category reward calculations, benefits breakdown, and effective rates
- **Proper Display Formatting**: Points cards show "5x points", cashback cards show "5.0% cashback"

### 👤 User Accounts & Personalization
- **NextAuth.js Authentication**: Demo account system for testing, easily extensible to Google/social providers
- **User Profiles**: Save reward preferences, point valuations, and subcategory settings
- **Owned Cards Management**: Visual interface to select and manage your existing credit cards
- **Preference Syncing**: Settings saved in profile automatically apply across the application
- **Personalized Dashboard**: Your preferences persist across sessions for a tailored experience

### 🎨 User Experience
- **Unified Navigation**: Consistent header across all pages with smart information architecture
- **Dark/Light Mode**: Fully functional theme toggle with localStorage persistence (Tailwind CSS v4)
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern UI**: Glass morphism effects, gradients, smooth animations, and hover states
- **Visual Feedback**: Loading states, progress indicators, and clear result displays
- **Intuitive Navigation**: Dashboard in header, settings in user dropdown for optimal UX

### 💾 Data & Performance
- **Pre-seeded Database**: 8 popular credit cards with real reward structures and current fees
- **SQLite Database**: Fast local development with easy deployment options
- **API-First Design**: Clean separation with TypeScript interfaces throughout
- **Error Handling**: Robust error boundaries and validation
- **Type Safety**: Full TypeScript implementation with proper interfaces
- **Real-time Updates**: Automatic preference synchronization across pages

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and navigate**
   ```bash
   git clone <repository-url>
   cd credit-card-optimizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📱 How to Use

### 0. 🔐 Get Started with Authentication
- Visit the homepage and click "Sign In" or use the demo account system
- Enter any email address for demo purposes (e.g., `demo@example.com`)
- Quick demo buttons available: `cashback.user@demo.com` or `points.user@demo.com`
- Your preferences will be saved and persist across sessions

### 1. ⚙️ Set Your Profile (First Time)
- Click your user avatar → "Settings" to access your profile
- **Reward Preferences**: Choose Cashback 💵, Points 🎯, or Best Overall 🏆
- **Point Valuations**: Set custom values for points (e.g., 1.2¢ per Chase UR point)
- **Subcategories**: Enable detailed merchant-specific categories for precision
- **Owned Cards**: Select credit cards you already have to exclude from recommendations
- Click "Save Preferences" - changes apply immediately across the app

### 2. 💳 Input Your Spending (Dashboard)
- Navigate to Dashboard from the header (your preferences will already be applied!)
- **Subcategory Mode**: If enabled in profile, see detailed merchant-specific options
- Use intuitive sliders or precise text inputs for each spending category
- **Smart Organization**: Categories are grouped with subcategories indented and highlighted
- Sliders provide quick adjustment ($0-$2000+ range)
- Text inputs allow exact dollar amounts
- See real-time totals for monthly and annual spending

### 3. 🎁 Customize Card Benefits (Optional)
- Click "Customize Card" on any recommendation to personalize benefits
- Adjust benefit values based on your personal usage patterns
- Example: $300 travel credit → $200 if you only travel that much annually
- Enable/disable specific benefits you don't use
- Set custom point valuations per card for precise optimization

### 4. 🏆 Get Personalized Recommendations
- Click "Get My Recommendations" to see mathematically ranked results
- **Owned cards automatically excluded** - you'll never see cards you already have
- View detailed breakdowns: net annual value, total rewards, annual fees, benefits value
- See category-by-category reward calculations and personal benefits breakdown
- Understand effective reward rates for your spending patterns
- Discover signup bonus opportunities tailored to your profile

## 🏗️ Technical Architecture

### Frontend
- **Framework**: Next.js 15 with App Router and Turbopack
- **Authentication**: NextAuth.js v5 with session management and JWT strategy
- **Styling**: Tailwind CSS v4 with class-based dark mode configuration
- **UI Components**: Custom-built components with Radix UI primitives
- **State Management**: React hooks with proper TypeScript interfaces
- **Theme System**: localStorage persistence with SSR-safe mounting
- **Navigation**: Unified Header component with responsive design

### Backend
- **API Routes**: Next.js API routes with proper error handling
- **Authentication**: NextAuth.js with Prisma adapter and demo credentials
- **Database**: Prisma ORM with SQLite (development) including User/Session models
- **Recommendation Engine**: Mathematical algorithm with category-specific calculations
- **User Management**: CRUD operations for preferences and owned cards
- **Type Safety**: Comprehensive TypeScript interfaces for all data structures

### Authentication System
- **NextAuth.js v5**: Modern authentication with JWT sessions
- **Demo Mode**: Accept any email for testing (easily configurable for production)
- **Session Management**: Persistent user preferences across page loads
- **Database Integration**: User data stored in Prisma with proper relationships

### Dark Mode Implementation
```css
/* Tailwind CSS v4 Configuration */
@variant dark (&:is(.dark *));  /* Enable class-based dark mode */

/* Theme classes applied via JavaScript */
document.documentElement.classList.add('dark')
```

### Database Schema
```
User → UserCard → CreditCard
├── id, email, name          ├── userId, cardId     ├── name, issuer, fees
├── rewardPreference         └── ownership tracking └── base rewards
├── pointValue               
├── enableSubCategories      
└── session data            

SpendingCategory → SubCategory → CategoryReward
├── id, name, description    ├── parentCategoryId      ├── categoryId OR subCategoryId
└── category mappings        └── specific merchants    └── reward multipliers
```

## 💡 Algorithm Details

The recommendation engine calculates net annual value through:

1. **Base Rewards**: Applies each card's base reward rate (1-2%) to all spending
2. **Subcategory Priority**: Checks for subcategory-specific rewards first (Amazon 5%, Hotels 10x, etc.)
3. **Category Fallback**: Falls back to parent category rates if no subcategory match exists
4. **Point Valuations**: Converts points to cash value based on user-defined rates
5. **Benefits Valuation**: Adds user's personal valuation of card benefits (travel credits, lounge access, etc.)
6. **Annual Fee Deduction**: Subtracts annual fees from total rewards and benefits
7. **Category Limits**: Respects quarterly/annual spending caps where applicable
8. **Ranking**: Sorts by highest net annual value for optimal recommendations

### Example Calculation
```typescript
// For $500/month Amazon spending on Amazon Prime card + subcategory optimization
const baseReward = 500 * 12 * 0.01           // $60 (1% base)
const subcategoryBonus = 500 * 12 * 0.05     // $300 (5% Amazon subcategory)
const benefitsValue = 0                       // $0 (no annual fee card)
const netValue = 300 + 0 - 0                 // $300 (subcategory rewards + benefits - fee)

// Fallback example: $500/month general groceries on Amazon Prime card
const baseReward = 500 * 12 * 0.01           // $60 (1% base - no subcategory match, no general groceries rate)
```

## 🃏 Included Credit Cards

- **Chase Sapphire Preferred**: 3x dining & travel, 1x everything else ($95 AF) + rental car insurance, trip protection, extended warranty
- **Chase Sapphire Reserve**: 3x dining & travel, 10x hotels/car rental through portal, 5x airfare, 1x everything else ($550 AF) + $300 travel credit, Priority Pass, TSA PreCheck credit, travel insurance
- **Chase Freedom Unlimited**: 1.5% everything, no annual fee
- **Capital One Venture X**: 2x everything, 5x hotels/car rental through portal ($395 AF) + $300 travel credit, Priority Pass, TSA PreCheck credit, travel insurance
- **American Express Gold**: 4x dining & groceries, 1x everything else ($250 AF) + $120 Uber credit, $120 entertainment credit, Grubhub+ credits, hotel status
- **American Express Platinum**: 5x airfare, 1x everything else ($695 AF) + $200 hotel credit, $200 airline credit, $189 CLEAR credit, Centurion lounge access, hotel status
- **Citi Double Cash**: 2% everything (1% purchase + 1% payment), no annual fee
- **Discover it Cash Back**: 5% rotating categories, 1% everything else, no annual fee
- **Wells Fargo Active Cash**: 2% everything, no annual fee
- **Amazon Prime Rewards Visa**: 5% Amazon & Whole Foods, 2% dining & gas, 1% everything else, no annual fee

### Subcategory Specialization
- **Amazon**: Amazon Prime card (5%)
- **Whole Foods**: Amazon Prime card (5%)
- **Hotels**: Chase Sapphire Reserve (10x), Capital One Venture X (5x)
- **Car Rental**: Chase Sapphire Reserve (10x), Capital One Venture X (5x)  
- **Airfare**: Chase Sapphire Reserve (5x), Amex Platinum (5x)

*Premium cards include detailed benefits data for accurate personal valuation*

## 🔮 Future Enhancements

### ✅ Phase 2: User Accounts (COMPLETED)
- [x] NextAuth.js authentication (demo system implemented, easily extensible)
- [x] Save spending preferences (reward type, point values, subcategories)
- [x] Track owned cards (visual management interface)
- [x] User profile management with real-time syncing

### Phase 3: Enhanced Authentication & Social Providers
- [ ] Google OAuth integration
- [ ] GitHub and Discord OAuth
- [ ] Email magic links
- [ ] Account deletion and data export

### Phase 4: Advanced Optimization Features
- [ ] Multiple card strategies (optimal 2-3 card combinations)
- [ ] Category optimization across multiple cards
- [ ] Signup bonus tracking and reminders
- [ ] Annual fee renewal notifications
- [ ] Spending goal recommendations

### Phase 5: Data & Analytics
- [ ] More credit cards (50+ cards)
- [ ] Business credit cards
- [ ] Spending analytics dashboard
- [ ] Market rate comparisons
- [ ] Historical reward tracking

## 🛠️ Development

### Current Status
✅ **Fully Functional**: Homepage, dashboard, calculations, dark mode  
✅ **Authentication System**: NextAuth.js v5 with demo mode and session management
✅ **User Profiles**: Save preferences, manage owned cards, real-time syncing
✅ **Unified Navigation**: Consistent header design across all pages
✅ **Subcategory System**: Complete merchant-specific optimization with 10 subcategories
✅ **Advanced Rewards Logic**: Subcategory priority with category fallback system
✅ **Card Customization**: Per-card benefit and point value customization
✅ **Owned Cards Exclusion**: Never recommend cards users already have
✅ **Accurate Card Data**: Updated benefits with realistic valuations and proper display formatting
✅ **API Working**: Categories, subcategories, recommendations, user management with proper error handling  
✅ **UI Complete**: Modern design with responsive layout and subcategory toggle
✅ **Type Safe**: Comprehensive TypeScript interfaces  
✅ **Admin Tools**: Complete admin API for managing cards and benefits

### Scripts
```bash
npm run dev        # Start development server with Turbopack
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run db:seed    # Seed database with credit cards
npx prisma studio  # Open database admin interface
```

### Project Structure
```
src/
├── app/
│   ├── page.tsx              # Homepage
│   ├── dashboard/page.tsx    # Main app interface
│   ├── profile/page.tsx      # User profile and settings
│   ├── auth/                 # Authentication pages
│   │   ├── signin/page.tsx   # Sign in page
│   │   └── error/page.tsx    # Auth error page
│   ├── api/                  # API routes
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth.js endpoint
│   │   ├── user/             # User management APIs
│   │   │   ├── preferences/route.ts     # Save/load user preferences
│   │   │   └── cards/route.ts           # Owned cards management
│   │   └── admin/            # Admin API endpoints
│   └── layout.tsx            # Root layout with SessionProvider
├── components/
│   ├── ui/                   # Reusable UI components
│   ├── Header.tsx            # Unified navigation header
│   ├── UserMenu.tsx          # User dropdown menu
│   ├── SessionProvider.tsx   # NextAuth session wrapper
│   ├── SpendingForm.tsx      # Main form component
│   ├── ThemeProvider.tsx     # Dark mode context
│   └── ThemeToggle.tsx       # Theme switch button
└── lib/
    ├── auth.ts               # NextAuth.js configuration
    ├── prisma.ts             # Database connection
    ├── utils.ts              # Utility functions
    └── recommendation-engine.ts # Core algorithm
```

## 🔧 Admin Tools

This project includes comprehensive admin tools for managing the credit card database:

### Available Tools
- **Admin API Endpoints**: RESTful API for programmatic management
- **Prisma Studio**: Visual database interface
- **Seed File Management**: Version-controlled data setup

### Quick Admin Tasks
```bash
# List all cards
curl -s http://localhost:3001/api/admin/cards | jq '.data[].name'

# Add a new card
curl -X POST http://localhost:3001/api/admin/cards \
  -H "Content-Type: application/json" \
  -d '{"id": "new-card", "name": "New Card", ...}'

# Open visual database manager
npx prisma studio
```

### Documentation
- **📘 Admin Guide**: See `README-ADMIN.md` for complete admin workflows and examples
- **📋 API Reference**: See `ADMIN_API.md` for technical endpoint documentation

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
