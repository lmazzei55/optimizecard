# 💳 Credit Card Optimizer

A modern web application that helps users maximize their credit card rewards through personalized recommendations based on spending patterns and preferences.

![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-6.8.2-2D3748?logo=prisma)

## ✨ Features

### 🎯 Core Functionality
- **Smart Recommendations**: Mathematical algorithm analyzes spending patterns and ranks credit cards by net annual value
- **Category-Based Analysis**: Input spending across 8 categories (Dining, Travel, Gas, Groceries, etc.)
- **Dual Input Methods**: Interactive sliders for quick adjustment + precise text inputs for exact amounts
- **Reward Preference**: Choose between cashback or points-based rewards with custom point valuations
- **Real-time Calculations**: Instant updates as you adjust spending amounts
- **Detailed Breakdowns**: See category-by-category reward calculations and effective rates

### 🎨 User Experience
- **Dark/Light Mode**: Fully functional theme toggle with localStorage persistence (Tailwind CSS v4)
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern UI**: Glass morphism effects, gradients, smooth animations, and hover states
- **Visual Feedback**: Loading states, progress indicators, and clear result displays
- **Intuitive Navigation**: Clean homepage with "How It Works" guide

### 💾 Data & Performance
- **Pre-seeded Database**: 8 popular credit cards with real reward structures and current fees
- **SQLite Database**: Fast local development with easy deployment options
- **API-First Design**: Clean separation with TypeScript interfaces throughout
- **Error Handling**: Robust error boundaries and validation
- **Type Safety**: Full TypeScript implementation with proper interfaces

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

### 1. 💳 Input Your Spending
- Use intuitive sliders or precise text inputs for each spending category
- Sliders provide quick adjustment ($0-$2000+ range)
- Text inputs allow exact dollar amounts
- See real-time totals for monthly and annual spending

### 2. ⚙️ Set Preferences  
- Choose between **Cashback** 💵 or **Points** 🎯 rewards
- For points: Set your valuation (e.g., 1.2¢ per Chase UR point, 1.0¢ per Amex MR)
- Visual selection buttons with hover effects

### 3. 🏆 Get Recommendations
- Click "Get My Recommendations" to see mathematically ranked results
- View detailed breakdowns: net annual value, total rewards, annual fees
- See category-by-category reward calculations
- Understand effective reward rates for your spending patterns
- Discover signup bonus opportunities

## 🏗️ Technical Architecture

### Frontend
- **Framework**: Next.js 15 with App Router and Turbopack
- **Styling**: Tailwind CSS v4 with class-based dark mode configuration
- **UI Components**: Custom-built components with Radix UI primitives
- **State Management**: React hooks with proper TypeScript interfaces
- **Theme System**: localStorage persistence with SSR-safe mounting

### Backend
- **API Routes**: Next.js API routes with proper error handling
- **Database**: Prisma ORM with SQLite (development)
- **Recommendation Engine**: Mathematical algorithm with category-specific calculations
- **Type Safety**: Comprehensive TypeScript interfaces for all data structures

### Dark Mode Implementation
```css
/* Tailwind CSS v4 Configuration */
@variant dark (&:is(.dark *));  /* Enable class-based dark mode */

/* Theme classes applied via JavaScript */
document.documentElement.classList.add('dark')
```

### Database Schema
```
SpendingCategory → CategoryReward → CreditCard
├── id, name, description     ├── categoryId, rewardRate     ├── name, issuer, fees
└── category mappings         └── reward multipliers         └── base rewards
```

## 💡 Algorithm Details

The recommendation engine calculates net annual value through:

1. **Base Rewards**: Applies each card's base reward rate (1-2%) to all spending
2. **Category Multipliers**: Applies enhanced rates (2-4x) for matching categories  
3. **Point Valuations**: Converts points to cash value based on user-defined rates
4. **Annual Fee Deduction**: Subtracts annual fees from total rewards
5. **Category Limits**: Respects quarterly/annual spending caps where applicable
6. **Ranking**: Sorts by highest net annual value for optimal recommendations

### Example Calculation
```typescript
// For $500/month dining on Chase Sapphire Preferred
const baseReward = 500 * 12 * 0.01           // $60 (1% base)
const categoryBonus = 500 * 12 * 0.03        // $180 (3x dining)
const pointValue = 180 * 1.25                // $225 (1.25¢/point)
const netValue = 225 - 95                    // $130 (minus annual fee)
```

## 🃏 Included Credit Cards

- **Chase Sapphire Preferred**: 3x dining & travel, 1x everything else ($95 AF)
- **Chase Sapphire Reserve**: 3x dining & travel, 1x everything else ($550 AF)  
- **Chase Freedom Unlimited**: 1.5x everything, no annual fee
- **Capital One Venture X**: 2x everything, 5x travel booked through portal ($395 AF)
- **American Express Gold**: 4x dining & groceries, 1x everything else ($250 AF)
- **Citi Double Cash**: 2% everything (1% purchase + 1% payment), no annual fee
- **Discover it Cash Back**: 5% rotating categories, 1% everything else, no annual fee
- **Wells Fargo Active Cash**: 2% everything, no annual fee

## 🔮 Future Enhancements

### Phase 2: User Accounts
- [ ] NextAuth.js authentication (Google, email)
- [ ] Save spending preferences
- [ ] Track owned cards
- [ ] Recommendation history

### Phase 3: Advanced Features
- [ ] Multiple card strategies
- [ ] Category optimization across cards
- [ ] Signup bonus tracking
- [ ] Annual fee reminders

### Phase 4: Data & Analytics
- [ ] More credit cards (50+ cards)
- [ ] Business credit cards
- [ ] Spending analytics dashboard
- [ ] Market rate comparisons

## 🛠️ Development

### Current Status
✅ **Fully Functional**: Homepage, dashboard, calculations, dark mode  
✅ **API Working**: Categories, recommendations with proper error handling  
✅ **UI Complete**: Modern design with responsive layout  
✅ **Type Safe**: Comprehensive TypeScript interfaces  

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
│   └── api/                  # API routes
├── components/
│   ├── ui/                   # Reusable UI components
│   ├── SpendingForm.tsx      # Main form component
│   ├── ThemeProvider.tsx     # Dark mode context
│   └── ThemeToggle.tsx       # Theme switch button
└── lib/
    ├── prisma.ts             # Database connection
    ├── utils.ts              # Utility functions
    └── recommendation-engine.ts # Core algorithm
```

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
