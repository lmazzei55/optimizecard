'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react'

interface PortfolioAnalysisData {
  portfolio: {
    cards: Array<{
      id: string
      name: string
      issuer: string
      annualFee: number
      categoryRewards: Record<string, number>
      flatReward: number
      welcomeBonus?: {
        amount: number
        spendRequirement: number
        timeFrame: number
      }
    }>
    totalAnnualFees: number
    totalWelcomeBonuses: number
    averageRewardRate: number
  }
  categoryAnalysis: Array<{
    category: string
    currentBestCard: string
    currentRewardRate: number
    potentialBestCard: string
    potentialRewardRate: number
    improvementPotential: number
  }>
  gaps: Array<{
    category: string
    currentCoverage: number
    recommendedCard: string
    potentialReward: number
    annualFee: number
    netBenefit: number
  }>
  metrics: {
    portfolioScore: number
    coverageScore: number
    optimizationScore: number
    diversificationScore: number
  }
}

// Cache key helper so we don't refetch every time user returns to the page
const CACHE_KEY = 'cco_portfolio_analysis'
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

export default function PortfolioAnalysis() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<PortfolioAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'loading') {
      return // Still loading authentication
    }
    
    if (status === 'unauthenticated') {
      setLoading(false)
      return // User not authenticated, don't show portfolio analysis
    }

    // User is authenticated, check cache first
    if (status === 'authenticated' && session?.user?.email) {
      // Check if we have cached data that's still fresh
      const cached = getCachedData()
      if (cached && cached.timestamp && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        console.log('📊 Using cached portfolio data')
        setData(cached.data)
        setLastFetch(cached.timestamp)
        setLoading(false)
        return
      }
      
      // No valid cache, fetch fresh data
      fetchPortfolioData()
    }
  }, [status, session])

  const getCachedData = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  }

  const setCachedData = (data: PortfolioAnalysisData) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
    } catch {
      // Ignore localStorage errors
    }
  }

  const fetchPortfolioData = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('📊 Fetching portfolio data...')
      const response = await fetch('/api/user/portfolio-analysis', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      // Check if this is fallback data due to server issues
      if (result.error && result.error.includes('temporarily unavailable')) {
        console.log('📊 Received fallback data due to server issues')
        // Try to use cached data if available
        const cached = getCachedData()
        if (cached && cached.data) {
          setData(cached.data)
          setLastFetch(cached.timestamp)
          setError('Using cached data - server temporarily unavailable')
          return
        } else {
          setError(result.error)
          return
        }
      }
      
      setData(result)
      setLastFetch(Date.now())
      setCachedData(result)
      console.log('📊 Portfolio data fetched and cached')
    } catch (err: any) {
      console.error('Portfolio analysis error:', err)
      setError(err.message || 'Failed to load portfolio analysis')
      
      // If this is not a forced refresh and we have cached data, use it
      if (!forceRefresh) {
        const cached = getCachedData()
        if (cached && cached.data) {
          console.log('📊 Using cached data due to fetch error')
          setData(cached.data)
          setLastFetch(cached.timestamp)
          setError(null) // Clear error since we have fallback data
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // Don't render anything if user is not authenticated
  if (status === 'unauthenticated') {
    return null
  }

  // Show loading state
  if (loading || status === 'loading') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Portfolio Analysis
          </CardTitle>
          <CardDescription>
            Analyzing your credit card portfolio...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading portfolio analysis...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show error state
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Portfolio Analysis
            <AlertCircle className="h-5 w-5 text-red-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">Unable to load portfolio analysis</p>
              <p className="text-sm text-red-600">{error}</p>
              <button 
                onClick={() => fetchPortfolioData(true)}
                className="mt-2 text-sm text-red-700 underline hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show empty state if no data
  if (!data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Portfolio Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600">No portfolio data available</p>
            <p className="text-sm text-gray-500 mt-2">
              Add some owned cards in your profile to see portfolio analysis
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 space-y-8">
      {/* Portfolio Overview */}
      <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3">
                📊 Your Credit Card Portfolio
              </h2>
              <div className="space-y-1">
                <p className="text-lg opacity-90">
                  {data.portfolio.cards.length} cards with ${data.portfolio.totalAnnualFees}/year in fees
                </p>
                {lastFetch && (
                  <p className="text-sm opacity-75">
                    Last updated: {new Date(lastFetch).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-3">
              <button
                onClick={() => fetchPortfolioData(true)}
                disabled={loading}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? '⟳' : '🔄'} Refresh
              </button>
              <div>
                <div className="text-4xl font-bold">{data.metrics.portfolioScore}%</div>
                <div className="text-sm opacity-80">Overall Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="bg-white/10 backdrop-blur-sm p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Coverage Metric */}
            <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-white">
                  <h3 className="font-semibold text-lg">Coverage</h3>
                  <p className="text-sm opacity-80">Categories earning rewards</p>
                </div>
                <div className="text-3xl font-bold text-white">{data.metrics.coverageScore}%</div>
              </div>
              <Progress value={data.metrics.coverageScore} className="h-2 bg-white/20" />
            </div>

            {/* Optimization Metric */}
            <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-white">
                  <h3 className="font-semibold text-lg">Optimization</h3>
                  <p className="text-sm opacity-80">Using best owned card</p>
                </div>
                <div className="text-3xl font-bold text-white">{data.metrics.optimizationScore}%</div>
              </div>
              <Progress value={data.metrics.optimizationScore} className="h-2 bg-white/20" />
            </div>

            {/* Diversification Metric */}
            <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-white">
                  <h3 className="font-semibold text-lg">Diversification</h3>
                  <p className="text-sm opacity-80">Card/issuer variety</p>
                </div>
                <div className="text-3xl font-bold text-white">{data.metrics.diversificationScore}%</div>
              </div>
              <Progress value={data.metrics.diversificationScore} className="h-2 bg-white/20" />
            </div>
          </div>

          {/* Help Text */}
          <details className="mt-6 text-white">
            <summary className="cursor-pointer select-none font-medium text-sm opacity-90 hover:opacity-100">
              ℹ️ What do these scores mean?
            </summary>
            <div className="mt-4 space-y-3 text-sm bg-white/10 rounded-lg p-4">
              <div>
                <strong>Portfolio Score:</strong> How much of the maximum possible rewards you're capturing
              </div>
              <div>
                <strong>Coverage:</strong> Percentage of your spending categories where you earn any rewards
              </div>
              <div>
                <strong>Optimization:</strong> How well you're using your best card for each category
              </div>
              <div>
                <strong>Diversification:</strong> Protection against devaluations (3+ cards = 100%)
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* Category Analysis */}
      {data.categoryAnalysis.length > 0 && (
        <Card className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 border-gray-200 dark:border-gray-600">
          <CardHeader>
            <CardTitle>Category Optimization Opportunities</CardTitle>
            <CardDescription>
              See where you could earn more rewards with your current cards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.categoryAnalysis.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{cat.category}</p>
                    <p className="text-sm text-muted-foreground">
                      Currently using: {cat.currentBestCard} ({cat.currentRewardRate}%)
                    </p>
                  </div>
                  {cat.improvementPotential > 0 && (
                    <div className="text-right">
                      <Badge variant="secondary" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +{cat.improvementPotential.toFixed(1)}%
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        with {cat.potentialBestCard}
                      </p>
                    </div>
                  )}
                  {cat.improvementPotential === 0 && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gap Analysis */}
      {data.gaps.length > 0 && (
        <Card className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 border-gray-200 dark:border-gray-600">
          <CardHeader>
            <CardTitle>Coverage Gaps</CardTitle>
            <CardDescription>
              Categories where adding a new card could significantly improve your rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.gaps.map((gap) => (
                <div key={gap.category} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <p className="font-medium">{gap.category}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Current coverage: {gap.currentCoverage}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{gap.recommendedCard}</p>
                    <p className="text-sm text-muted-foreground">
                      +${gap.netBenefit.toFixed(0)}/year net benefit
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 