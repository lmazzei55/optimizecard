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
- **Reward Preference**: Choose between cashback or points-based rewards
- **Point Valuation**: Customize how much you value points for accurate calculations
- **Real-time Calculations**: Instant updates as you adjust spending amounts

### 🎨 User Experience
- **Intuitive Sliders**: Easy-to-use sliders with precise text input options
- **Dark/Light Mode**: Beautiful theme toggle with system preference detection
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern UI**: Glass morphism effects, gradients, and smooth animations
- **Visual Feedback**: Loading states, hover effects, and clear result displays

### 💾 Data & Performance
- **Pre-seeded Database**: 8 popular credit cards with real reward structures
- **SQLite Database**: Fast local development with easy deployment options
- **API-First Design**: Clean separation between frontend and backend
- **TypeScript**: Full type safety throughout the application

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
- Use intuitive sliders or precise text inputs
- Set monthly spending for each category
- See real-time totals for monthly and annual spending

### 2. ⚙️ Set Preferences  
- Choose between **Cashback** 💵 or **Points** 🎯
- For points: Set your valuation (e.g., 1.25¢ per Chase UR point)
- Visual buttons make selection easy

### 3. 🚀 Get Recommendations
- Click "Get Recommendations" to see ranked results
- Winner gets 🏆 trophy and premium highlighting
- View signup bonuses, annual fees, and net values
- Understand why each card was recommended

## 🏗️ Technical Architecture

### Frontend
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4 with custom components
- **UI Components**: Custom-built with Radix UI primitives
- **State Management**: React hooks for local state
- **Type Safety**: Full TypeScript implementation

### Backend
- **API Routes**: Next.js API routes for serverless functions
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (prod)
- **Recommendation Engine**: Custom mathematical algorithm
- **Data Validation**: Runtime type checking and sanitization

### Database Schema
```
Users ← UserSpendingCategory → SpendingCategory
Users ← UserCard → CreditCard → CategoryReward → SpendingCategory
```

## 💡 Algorithm Details

The recommendation engine calculates net annual value by:

1. **Base Rewards**: Applies card's base reward rate to all spending
2. **Category Bonuses**: Uses enhanced rates for specific categories
3. **Point Valuations**: Converts points to cash value based on user preferences
4. **Annual Fees**: Subtracts fees from total rewards
5. **Signup Bonuses**: Highlights additional value opportunities
6. **Caps & Limits**: Respects quarterly/annual category limits

## 🃏 Included Credit Cards

- Chase Sapphire Preferred (3x dining, 2x travel)
- Chase Sapphire Reserve (3x dining & travel)
- Chase Freedom Unlimited (1.5% everything)
- Capital One Venture X (2% everything)
- American Express Gold (4x dining & groceries)
- Citi Double Cash (2% everything)
- Discover it Cash Back (5% rotating categories)
- Wells Fargo Active Cash (2% everything)

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

### Scripts
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run db:seed    # Seed database with cards
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
