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

export default function PortfolioAnalysis() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<PortfolioAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only fetch if user is authenticated
    if (status === 'loading') {
      return // Still loading authentication
    }
    
    if (status === 'unauthenticated') {
      setLoading(false)
      return // User not authenticated, don't show portfolio analysis
    }

    // User is authenticated, fetch portfolio data
    if (status === 'authenticated' && session?.user?.email) {
      fetchPortfolioData()
    }
  }, [status, session])

  const fetchPortfolioData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/user/portfolio-analysis')
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Please sign in to view your portfolio analysis')
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Portfolio analysis error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load portfolio analysis')
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
                onClick={fetchPortfolioData}
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
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Credit Card Portfolio</CardTitle>
          <CardDescription>
            {data.portfolio.cards.length} cards with ${data.portfolio.totalAnnualFees}/year in fees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Portfolio Score</p>
              <div className="flex items-center gap-2">
                <Progress value={data.metrics.portfolioScore} className="flex-1" />
                <span className="text-sm font-medium">{data.metrics.portfolioScore}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Coverage</p>
              <div className="flex items-center gap-2">
                <Progress value={data.metrics.coverageScore} className="flex-1" />
                <span className="text-sm font-medium">{data.metrics.coverageScore}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Optimization</p>
              <div className="flex items-center gap-2">
                <Progress value={data.metrics.optimizationScore} className="flex-1" />
                <span className="text-sm font-medium">{data.metrics.optimizationScore}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Diversification</p>
              <div className="flex items-center gap-2">
                <Progress value={data.metrics.diversificationScore} className="flex-1" />
                <span className="text-sm font-medium">{data.metrics.diversificationScore}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Analysis */}
      {data.categoryAnalysis.length > 0 && (
        <Card>
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
        <Card>
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