"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { formatCurrency } from "@/lib/utils"
import { BenefitsForm } from "@/components/BenefitsForm"

interface SpendingCategory {
  id: string
  name: string
  description: string
}

interface UserSpending {
  categoryId: string
  categoryName: string
  monthlySpend: number
}

interface BenefitValuation {
  benefitId: string
  personalValue: number
}

interface CategoryBreakdown {
  categoryName: string
  monthlySpend: number
  rewardRate: number
  monthlyValue: number
  annualValue: number
}

interface BenefitsBreakdown {
  benefitName: string
  officialValue: number
  personalValue: number
  category: string
}

interface SignupBonus {
  amount: number
  requiredSpend: number
  timeframe: number
}

interface CardRecommendation {
  cardId: string
  cardName: string
  issuer: string
  annualFee: number
  rewardType: 'cashback' | 'points'
  totalAnnualValue: number
  benefitsValue: number
  netAnnualValue: number
  categoryBreakdown: CategoryBreakdown[]
  benefitsBreakdown: BenefitsBreakdown[]
  signupBonus?: SignupBonus
}

export function SpendingForm() {
  const [categories, setCategories] = useState<SpendingCategory[]>([])
  const [spending, setSpending] = useState<UserSpending[]>([])
  const [rewardPreference, setRewardPreference] = useState<'cashback' | 'points'>('cashback')
  const [pointValue, setPointValue] = useState(0.01)
  const [benefitValuations, setBenefitValuations] = useState<BenefitValuation[]>([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [recommendations, setRecommendations] = useState<CardRecommendation[]>([])

  // Fetch spending categories
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data)
      
      // Initialize spending with all categories at $0
      setSpending(data.map((cat: SpendingCategory) => ({
        categoryId: cat.id,
        categoryName: cat.name,
        monthlySpend: 0
      })))
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setLoading(false)
    }
  }

  const updateSpending = (categoryId: string, amount: number) => {
    setSpending(prev => prev.map(s => 
      s.categoryId === categoryId 
        ? { ...s, monthlySpend: amount }
        : s
    ))
  }

  const handleBenefitValuationsChange = (valuations: BenefitValuation[]) => {
    setBenefitValuations(valuations)
  }

  const calculateRecommendations = async () => {
    setCalculating(true)
    try {
      const activeSpending = spending.filter(s => s.monthlySpend > 0)
      
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userSpending: activeSpending,
          rewardPreference,
          pointValue: rewardPreference === 'points' ? pointValue : 0.01,
          benefitValuations
        })
      })
      
      const data = await response.json()
      setRecommendations(data)
    } catch (error) {
      console.error('Error calculating recommendations:', error)
    } finally {
      setCalculating(false)
    }
  }

  const totalMonthlySpend = spending.reduce((sum, s) => sum + s.monthlySpend, 0)
  const totalBenefitsValue = benefitValuations.reduce((sum, val) => sum + val.personalValue, 0)

  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Spending Input */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
          💳 Monthly Spending by Category
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {categories.map((category) => {
            const currentSpending = spending.find(s => s.categoryId === category.id)
            const amount = currentSpending?.monthlySpend || 0
            
            return (
              <div key={category.id} className="space-y-4 p-6 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-start">
                  <div>
                    <label className="block text-lg font-semibold text-gray-900 dark:text-white">
                      {category.name}
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{category.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(amount)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">per month</p>
                  </div>
                </div>

                {/* Slider */}
                <div className="space-y-3">
                  <Slider
                    value={amount}
                    onValueChange={(value) => updateSpending(category.id, value)}
                    min={0}
                    max={2000}
                    step={25}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>$0</span>
                    <span>$1000</span>
                    <span>$2000+</span>
                  </div>
                </div>

                {/* Text Input */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Exact:</span>
                  <input
                    type="number"
                    min="0"
                    step="25"
                    value={amount || ''}
                    onChange={(e) => updateSpending(category.id, parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="0"
                  />
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-blue-200 dark:border-gray-600">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Total Monthly Spending: {formatCurrency(totalMonthlySpend)}
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Annual Spending: {formatCurrency(totalMonthlySpend * 12)}
            </p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
          ⚙️ Reward Preferences
        </h2>
        
        <div className="space-y-8">
          <div>
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
              What type of rewards do you prefer?
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setRewardPreference('cashback')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  rewardPreference === 'cashback'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">💵</div>
                  <div className="font-semibold">Cashback</div>
                  <div className="text-sm opacity-75">Direct cash rewards</div>
                </div>
              </button>
              
              <button
                onClick={() => setRewardPreference('points')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  rewardPreference === 'points'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="font-semibold">Points/Miles</div>
                  <div className="text-sm opacity-75">Travel & transfer partners</div>
                </div>
              </button>
            </div>
          </div>

          {rewardPreference === 'points' && (
            <div>
              <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
                How much do you value each point/mile?
              </label>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-20">Value:</span>
                  <input
                    type="number"
                    min="0.005"
                    max="0.05"
                    step="0.001"
                    value={pointValue}
                    onChange={(e) => setPointValue(parseFloat(e.target.value) || 0.01)}
                    className="flex-1 max-w-32 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">cents per point</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Examples: Chase Ultimate Rewards ~1.2¢, Amex Membership Rewards ~1.0¢, Airline miles ~1.5¢
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Benefits Form */}
      <BenefitsForm onBenefitValuationsChange={handleBenefitValuationsChange} />

      {/* Calculate Button */}
      <div className="text-center">
        <Button
          onClick={calculateRecommendations}
          disabled={totalMonthlySpend === 0 || calculating}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-xl font-semibold rounded-full shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {calculating ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Calculating...</span>
            </div>
          ) : (
            '🎯 Get My Recommendations'
          )}
        </Button>
        {totalBenefitsValue > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Including {formatCurrency(totalBenefitsValue)} in personal benefits value
          </p>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
            🏆 Your Personalized Credit Card Recommendations
          </h2>
          
          <div className="space-y-6">
            {recommendations.map((rec, index) => (
              <div key={rec.cardId} className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{rec.cardName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{rec.issuer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(rec.netAnnualValue)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">net annual value</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Annual Rewards</p>
                    <p className="text-green-600 dark:text-green-400">{formatCurrency(rec.totalAnnualValue)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Benefits Value</p>
                    <p className="text-blue-600 dark:text-blue-400">{formatCurrency(rec.benefitsValue)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Annual Fee</p>
                    <p className="text-red-600 dark:text-red-400">{formatCurrency(rec.annualFee)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Effective Rate</p>
                    <p className="text-blue-600 dark:text-blue-400">{((rec.netAnnualValue / (totalMonthlySpend * 12)) * 100).toFixed(1)}%</p>
                  </div>
                </div>

                {rec.categoryBreakdown && rec.categoryBreakdown.length > 0 && (
                  <div className="mb-4">
                    <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Spending Rewards:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      {rec.categoryBreakdown.map((breakdown, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-700 rounded p-2">
                          <p className="font-medium text-gray-700 dark:text-gray-300">{breakdown.categoryName}</p>
                          <p className="text-green-600 dark:text-green-400">{formatCurrency(breakdown.annualValue)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {rec.benefitsBreakdown && rec.benefitsBreakdown.length > 0 && rec.benefitsValue > 0 && (
                  <div className="mb-4">
                    <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Benefits You Value:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {rec.benefitsBreakdown
                        .filter(benefit => benefit.personalValue > 0)
                        .map((benefit, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-700 rounded p-2 flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">{benefit.benefitName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Official: {formatCurrency(benefit.officialValue)}
                            </p>
                          </div>
                          <p className="text-blue-600 dark:text-blue-400 font-semibold">
                            {formatCurrency(benefit.personalValue)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {rec.signupBonus && (
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700">
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                      🎁 Signup Bonus: {formatCurrency(rec.signupBonus.amount)} 
                      <span className="block text-xs opacity-75 mt-1">
                        Spend {formatCurrency(rec.signupBonus.requiredSpend)} in {rec.signupBonus.timeframe} months
                      </span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 