"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { formatCurrency } from "@/lib/utils"

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

export function SpendingForm() {
  const [categories, setCategories] = useState<SpendingCategory[]>([])
  const [spending, setSpending] = useState<UserSpending[]>([])
  const [rewardPreference, setRewardPreference] = useState<'cashback' | 'points'>('cashback')
  const [pointValue, setPointValue] = useState(0.01)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [recommendations, setRecommendations] = useState<any[]>([])

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
          pointValue: rewardPreference === 'points' ? pointValue : 0.01
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
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
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
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="font-semibold">Points</div>
                  <div className="text-sm opacity-75">Travel & transfer points</div>
                </div>
              </button>
            </div>
          </div>

          {rewardPreference === 'points' && (
            <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
              <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
                How much do you value 1 point?
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Slider
                    value={pointValue * 100}
                    onValueChange={(value) => setPointValue(value / 100)}
                    min={0.5}
                    max={3}
                    step={0.1}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>0.5¢</span>
                    <span>1.5¢</span>
                    <span>3.0¢</span>
                  </div>
                </div>
                <div className="text-right">
                  <input
                    type="number"
                    min="0.5"
                    max="5"
                    step="0.1"
                    value={pointValue * 100}
                    onChange={(e) => setPointValue((parseFloat(e.target.value) || 1) / 100)}
                    className="w-20 px-3 py-2 bg-white dark:bg-gray-700 border border-purple-300 dark:border-purple-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">¢</span>
                </div>
              </div>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
                💡 Tip: Chase UR = 1.25¢, Amex MR = 1¢, Capital One = 1¢
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Calculate Button */}
      <div className="text-center">
        <Button
          onClick={calculateRecommendations}
          disabled={calculating || totalMonthlySpend === 0}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-xl font-semibold rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
        >
          {calculating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Calculating...
            </>
          ) : (
            '🚀 Get Recommendations'
          )}
        </Button>
        
        {totalMonthlySpend === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Add some spending to get started
          </p>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
            🏆 Recommended Credit Cards
          </h2>
          
          <div className="space-y-6">
            {recommendations.slice(0, 5).map((rec, index) => (
              <div
                key={rec.cardId}
                className={`p-6 rounded-2xl border-2 transition-all duration-200 ${
                  index === 0 
                    ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-lg' 
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/50 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                      {index === 0 && <span className="mr-2 text-2xl">🏆</span>}
                      {rec.cardName}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">{rec.issuer}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                        {rec.rewardType === 'cashback' ? '💵 Cashback' : '🎯 Points'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Annual Fee: {formatCurrency(rec.annualFee)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(rec.netAnnualValue)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Net Annual Value</p>
                  </div>
                </div>
                
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
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              💡 Rankings based on your spending patterns and preferences
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 