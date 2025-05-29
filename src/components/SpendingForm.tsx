"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
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
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Spending Input */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Monthly Spending by Category
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {categories.map((category) => {
            const currentSpending = spending.find(s => s.categoryId === category.id)
            return (
              <div key={category.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {category.name}
                </label>
                <p className="text-xs text-gray-500">{category.description}</p>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={currentSpending?.monthlySpend || 0}
                  onChange={(e) => updateSpending(category.id, parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            )
          })}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold text-blue-900">
            Total Monthly Spending: {formatCurrency(totalMonthlySpend)}
          </p>
          <p className="text-sm text-blue-700">
            Annual Spending: {formatCurrency(totalMonthlySpend * 12)}
          </p>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Reward Preferences
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What type of rewards do you prefer?
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="cashback"
                  checked={rewardPreference === 'cashback'}
                  onChange={(e) => setRewardPreference(e.target.value as 'cashback')}
                  className="mr-2"
                />
                Cashback
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="points"
                  checked={rewardPreference === 'points'}
                  onChange={(e) => setRewardPreference(e.target.value as 'points')}
                  className="mr-2"
                />
                Points
              </label>
            </div>
          </div>

          {rewardPreference === 'points' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How much do you value 1 point? (in cents)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={pointValue * 100}
                onChange={(e) => setPointValue((parseFloat(e.target.value) || 1) / 100)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1.0"
              />
              <span className="ml-2 text-sm text-gray-500">cents per point</span>
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
        >
          {calculating ? 'Calculating...' : 'Get Recommendations'}
        </Button>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Recommended Credit Cards
          </h2>
          
          <div className="space-y-6">
            {recommendations.slice(0, 5).map((rec, index) => (
              <div
                key={rec.cardId}
                className={`p-6 rounded-lg border-2 ${
                  index === 0 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {index === 0 && '🏆 '}{rec.cardName}
                    </h3>
                    <p className="text-gray-600">{rec.issuer}</p>
                    <p className="text-sm text-gray-500">
                      Annual Fee: {formatCurrency(rec.annualFee)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(rec.netAnnualValue)}
                    </p>
                    <p className="text-sm text-gray-500">Net Annual Value</p>
                  </div>
                </div>
                
                {rec.signupBonus && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">
                      🎁 Signup Bonus: {formatCurrency(rec.signupBonus.amount)} 
                      (spend {formatCurrency(rec.signupBonus.requiredSpend)} in {rec.signupBonus.timeframe} months)
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