'use client'

import { useEffect, useState } from 'react'
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
  const [analysis, setAnalysis] = useState<PortfolioAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPortfolioAnalysis()
  }, [])

  const fetchPortfolioAnalysis = async () => {
    try {
      const response = await fetch('/api/user/portfolio-analysis')
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio analysis')
      }
      const data = await response.json()
      setAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !analysis) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Credit Card Portfolio</CardTitle>
          <CardDescription>
            {analysis.portfolio.cards.length} cards with ${analysis.portfolio.totalAnnualFees}/year in fees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Portfolio Score</p>
              <div className="flex items-center gap-2">
                <Progress value={analysis.metrics.portfolioScore} className="flex-1" />
                <span className="text-sm font-medium">{analysis.metrics.portfolioScore}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Coverage</p>
              <div className="flex items-center gap-2">
                <Progress value={analysis.metrics.coverageScore} className="flex-1" />
                <span className="text-sm font-medium">{analysis.metrics.coverageScore}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Optimization</p>
              <div className="flex items-center gap-2">
                <Progress value={analysis.metrics.optimizationScore} className="flex-1" />
                <span className="text-sm font-medium">{analysis.metrics.optimizationScore}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Diversification</p>
              <div className="flex items-center gap-2">
                <Progress value={analysis.metrics.diversificationScore} className="flex-1" />
                <span className="text-sm font-medium">{analysis.metrics.diversificationScore}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Analysis */}
      {analysis.categoryAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category Optimization Opportunities</CardTitle>
            <CardDescription>
              See where you could earn more rewards with your current cards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.categoryAnalysis.map((cat) => (
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
      {analysis.gaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Coverage Gaps</CardTitle>
            <CardDescription>
              Categories where adding a new card could significantly improve your rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.gaps.map((gap) => (
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