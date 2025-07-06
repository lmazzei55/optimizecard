import type { Metadata } from 'next'
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Header } from "@/components/Header"
import Link from "next/link"

export const metadata: Metadata = {
  title: 'Credit Card Optimizer - Find Your Perfect Rewards Card',
  description: 'Get personalized credit card recommendations based on your spending patterns. Our AI analyzes your expenses to find cards that maximize your rewards and benefits.',
  keywords: 'credit card optimizer, best credit cards, credit card rewards, cashback cards, points cards, credit card comparison',
  robots: 'index, follow',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Credit Card Optimizer - Find Your Perfect Rewards Card',
    description: 'Get personalized credit card recommendations based on your spending patterns.',
    url: '/',
    type: 'website',
  }
}

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Credit Card Optimizer",
  "description": "AI-powered credit card recommendation service that analyzes spending patterns to suggest optimal rewards cards",
  "url": "https://www.optimizecard.com",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web Browser",
  "offers": [
    {
      "@type": "Offer",
      "name": "Free Tier",
      "description": "Basic credit card recommendations",
      "price": "0",
      "priceCurrency": "USD"
    },
    {
      "@type": "Offer", 
      "name": "Premium Tier",
      "description": "Advanced recommendations including premium cards",
      "price": "9.99",
      "priceCurrency": "USD",
      "billingIncrement": "P1M"
    }
  ],
  "provider": {
    "@type": "Organization",
    "name": "Credit Card Optimizer",
    "url": "https://www.optimizecard.com"
  },
  "featureList": [
    "Personalized credit card recommendations",
    "Spending pattern analysis", 
    "Rewards optimization",
    "Benefits valuation",
    "Multi-card strategies"
  ],
  "screenshot": "https://www.optimizecard.com/screenshot.png",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "150",
    "bestRating": "5"
  }
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
        <Header />

        <main className="min-h-screen relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-purple-100/20 to-pink-100/20 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20"></div>
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-200/30 dark:from-blue-800/30 dark:to-purple-800/30 rounded-full blur-3xl -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/30 dark:from-purple-800/30 dark:to-pink-800/30 rounded-full blur-3xl translate-x-32 translate-y-32"></div>
          
          <div className="container mx-auto px-4 py-16 relative z-10">
            <div className="max-w-6xl mx-auto">
              {/* Hero Section */}
              <div className="text-center mb-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl mb-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <span className="text-2xl">💳</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                  Turn everyday spending into $700+<span className="align-super text-base md:text-lg">*</span> in extra rewards each year
                </h1>
                <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-4xl mx-auto mb-6">
                  <span className="px-4 py-2 text-base md:text-xl font-medium rounded-full border border-white/30 text-white/90 bg-white/5 backdrop-blur-sm">
                    Find the single card that pays you most today
                  </span>
                  <span className="px-4 py-2 text-base md:text-xl font-medium rounded-full border border-white/30 text-white/90 bg-white/5 backdrop-blur-sm">
                    Map every purchase category to the best card already in your wallet
                  </span>
                  <span className="px-4 py-2 text-base md:text-xl font-medium rounded-full border border-white/30 text-white/90 bg-white/5 backdrop-blur-sm">
                    Discover new cards that can boost your annual rewards even higher
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-6">*Based on U.S. Bureau of Labor Statistics Consumer Expenditure Survey average card-eligible spend (~$2.5 k/month). Baseline = 1 % cash-back; Optimized = minimum 2–3 % blended reward rate with our recommended cards.</p>
                <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl p-4 mb-8 max-w-2xl mx-auto backdrop-blur-sm">
                  <div className="flex items-center justify-center space-x-2 text-blue-700 dark:text-blue-300">
                    <span className="text-xl">🔒</span>
                    <span className="font-medium">100% Private – No personal information required</span>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-2 text-center">
                    We only ask for spending estimates to calculate your best rewards. No names, addresses, or financial data needed.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  <div className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 border border-green-200 dark:border-green-700">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Category-Specific Analysis</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 border border-blue-200 dark:border-blue-700">
                    <span className="text-blue-500">✓</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Multi-Card Strategies</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 border border-purple-200 dark:border-purple-700">
                    <span className="text-purple-500">✓</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mathematical Precision</span>
                  </div>
                </div>
              </div>

              {/* How It Works Section */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 mb-16 border border-white/30 dark:border-gray-700/30">
                <div className="text-center mb-8 md:mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent mb-4">
                    How It Works
                  </h2>
                  <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                  <div className="text-center group">
                    <div className="relative mb-6 md:mb-8">
                      <div className="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-3xl w-20 h-20 md:w-24 md:h-24 flex items-center justify-center mx-auto shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <span className="text-3xl md:text-4xl">📊</span>
                      </div>
                      <div className="absolute -top-2 -right-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                        <span className="text-lg font-bold text-white">1</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg md:text-xl">Enter Monthly Spending</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">Enter how much you spend each <strong>month</strong> in categories like dining, groceries, and travel. We'll show both monthly and <strong>annual</strong> totals to help you see the bigger picture.</p>
                  </div>
                  
                  <div className="text-center group">
                    <div className="relative mb-6 md:mb-8">
                      <div className="bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 rounded-3xl w-20 h-20 md:w-24 md:h-24 flex items-center justify-center mx-auto shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <span className="text-3xl md:text-4xl">⚙️</span>
                      </div>
                      <div className="absolute -top-2 -right-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                        <span className="text-lg font-bold text-white">2</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg md:text-xl">Choose Reward Type</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">Select whether you prefer <strong>cashback</strong> (direct money back), <strong>points/miles</strong> (for travel), or let us find the <strong>best overall</strong> value by comparing both options.</p>
                  </div>
                  
                  <div className="text-center group">
                    <div className="relative mb-6 md:mb-8">
                      <div className="bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 rounded-3xl w-20 h-20 md:w-24 md:h-24 flex items-center justify-center mx-auto shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <span className="text-3xl md:text-4xl">🏆</span>
                      </div>
                      <div className="absolute -top-2 -right-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                        <span className="text-lg font-bold text-white">3</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg md:text-xl">Get Personalized Rankings</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">See exactly which cards earn you the most money for each category and overall. Get single-card recommendations plus <strong>multi-card strategies</strong> that optimize 2-3 cards for maximum rewards across all spending.</p>
                  </div>
                </div>
              </div>

              {/* Secondary CTA Section (hidden on small screens) */}
              <div className="text-center mb-16 hidden md:block">
                <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 rounded-3xl p-6 md:p-8 mb-8 border border-blue-200/50 dark:border-blue-700/50">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Ready to optimize your rewards?
                  </h3>
                  <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                    Join thousands of users who have maximized their credit card rewards with our intelligent recommendations.
                  </p>
                  <Link href="/dashboard">
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-12 md:px-16 py-4 md:py-6 text-lg md:text-xl font-bold rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300 border-0">
                      🚀 Get Started Now
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 dark:border-gray-700/30 text-center group hover:shadow-xl transition-all duration-300">
                  <div className="text-3xl mb-4">🎯</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Category Analysis</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Find the best card for each spending category</p>
                </div>
                
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 dark:border-gray-700/30 text-center group hover:shadow-xl transition-all duration-300">
                  <div className="text-3xl mb-4">💳</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Multi-Card Strategies</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Optimize 2-3 card combinations for maximum rewards</p>
                </div>
                
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 dark:border-gray-700/30 text-center group hover:shadow-xl transition-all duration-300">
                  <div className="text-3xl mb-4">📊</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Mathematical Precision</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Exact calculations for optimal reward maximization</p>
                </div>
                
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 dark:border-gray-700/30 text-center group hover:shadow-xl transition-all duration-300">
                  <div className="text-3xl mb-4">👤</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Account Features</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Track owned cards and get expanded recommendations</p>
                </div>
              </div>
              
              {/* Demo Section */}
              <div className="text-center">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto border border-green-200/50 dark:border-green-700/50 shadow-xl">
                  <div className="text-4xl mb-4">💸</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Example Annual Value:</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{formatCurrency(1234.56)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Based on optimized card selection</p>
                </div>
              </div>
            </div>
          </div>
          {/* Floating CTA Button (Option B) */}
          <Link href="/dashboard" className="fixed bottom-6 right-6 z-50">
            <Button
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-br from-pink-600 to-blue-600 hover:from-pink-700 hover:to-blue-700 text-white font-semibold shadow-xl transform hover:scale-105 transition-transform duration-300 animate-bounce hover:animate-none"
            >
              🚀 <span>Get Started</span>
            </Button>
          </Link>
        </main>
      </div>
    </>
  )
}
