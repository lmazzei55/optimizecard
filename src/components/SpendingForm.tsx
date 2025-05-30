"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { formatCurrency } from "@/lib/utils"
import { CardCustomizationModal } from "@/components/CardCustomizationModal"

interface SpendingCategory {
  id: string
  name: string
  description: string
  subCategories?: SubCategory[]
}

interface SubCategory {
  id: string
  name: string
  description: string
  parentCategoryId: string
}

interface UserSpending {
  categoryId?: string
  subCategoryId?: string
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
  applicationUrl?: string
  totalAnnualValue: number
  benefitsValue: number
  netAnnualValue: number
  categoryBreakdown: CategoryBreakdown[]
  benefitsBreakdown: BenefitsBreakdown[]
  signupBonus?: SignupBonus
}

interface CardCustomization {
  pointValue?: number
  benefitValues: Record<string, number>
  enabledBenefits: Record<string, boolean>
}

export function SpendingForm() {
  const [categories, setCategories] = useState<SpendingCategory[]>([])
  const [spending, setSpending] = useState<UserSpending[]>([])
  const [rewardPreference, setRewardPreference] = useState<'cashback' | 'points' | 'best_overall'>('best_overall')
  const [pointValue, setPointValue] = useState(0.01)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [recommendations, setRecommendations] = useState<CardRecommendation[]>([])
  
  // Subcategory support
  const [enableSubcategories, setEnableSubcategories] = useState(false)
  
  // Card customization modal state
  const [customizationOpen, setCustomizationOpen] = useState(false)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [cardCustomizations, setCardCustomizations] = useState<{
    [cardId: string]: CardCustomization
  }>({})

  // Fetch spending categories
  useEffect(() => {
    fetchCategories()
  }, [enableSubcategories])

  const fetchCategories = async () => {
    try {
      const endpoint = enableSubcategories ? '/api/subcategories' : '/api/categories'
      const response = await fetch(endpoint)
      const data = await response.json()
      setCategories(data)
      
      // Initialize spending based on subcategory mode
      if (enableSubcategories) {
        // Create spending entries for both categories and subcategories
        const spendingEntries: UserSpending[] = []
        
        data.forEach((cat: SpendingCategory) => {
          // Add main category
          spendingEntries.push({
            categoryId: cat.id,
            categoryName: cat.name,
            monthlySpend: 0
          })
          
          // Add subcategories if they exist
          if (cat.subCategories && cat.subCategories.length > 0) {
            cat.subCategories.forEach((sub: SubCategory) => {
              spendingEntries.push({
                subCategoryId: sub.id,
                categoryName: `${cat.name} → ${sub.name}`,
                monthlySpend: 0
              })
            })
          }
        })
        
        setSpending(spendingEntries)
      } else {
        // Standard category mode
        setSpending(data.map((cat: SpendingCategory) => ({
          categoryId: cat.id,
          categoryName: cat.name,
          monthlySpend: 0
        })))
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setLoading(false)
    }
  }

  const updateSpending = (id: string, amount: number, isSubcategory: boolean = false) => {
    setSpending(prev => prev.map(s => {
      const matchId = isSubcategory ? s.subCategoryId : s.categoryId
      return matchId === id 
        ? { ...s, monthlySpend: amount }
        : s
    }))
  }

  const openCardCustomization = (cardId: string) => {
    setEditingCardId(cardId)
    setCustomizationOpen(true)
  }

  const closeCardCustomization = () => {
    setCustomizationOpen(false)
    setEditingCardId(null)
  }

  const updateCardCustomization = (customization: CardCustomization) => {
    if (!editingCardId) return
    
    // Update the customizations
    const updatedCustomizations = {
      ...cardCustomizations,
      [editingCardId]: customization
    }
    setCardCustomizations(updatedCustomizations)
    
    // Recalculate recommendations with per-card customizations
    recalculateWithCustomizations(updatedCustomizations)
  }

  const recalculateWithCustomizations = async (customizations: typeof cardCustomizations) => {
    setRecalculating(true)
    try {
      const activeSpending = spending.filter(s => s.monthlySpend > 0)
      
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userSpending: activeSpending,
          rewardPreference,
          pointValue: 0.01, // Default for non-customized cards
          cardCustomizations: customizations // Send per-card customizations
        })
      })
      
      const data = await response.json()
      setRecommendations(data)
    } catch (error) {
      console.error('Error recalculating recommendations:', error)
    } finally {
      setRecalculating(false)
    }
  }

  const updatePointValue = async (newValue: number) => {
    setPointValue(newValue)
    
    // Only recalculate if we have results and points/best_overall is selected
    if (recommendations.length > 0 && (rewardPreference === 'points' || rewardPreference === 'best_overall')) {
      await recalculateRecommendations(newValue)
    }
  }

  const recalculateRecommendations = async (newPointValue: number) => {
    setRecalculating(true)
    try {
      const activeSpending = spending.filter(s => s.monthlySpend > 0)
      
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userSpending: activeSpending,
          rewardPreference,
          pointValue: newPointValue
        })
      })
      
      const data = await response.json()
      setRecommendations(data)
    } catch (error) {
      console.error('Error recalculating recommendations:', error)
    } finally {
      setRecalculating(false)
    }
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
          pointValue: 0.01 // Always use 1¢ for initial calculation
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
        
        {/* Subcategory Toggle */}
        <div className="mb-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-indigo-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                🎯 Enable Subcategories
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Get more precise recommendations with specific subcategories like Amazon, Whole Foods, Hotels, etc.
              </p>
            </div>
            <button
              onClick={() => setEnableSubcategories(!enableSubcategories)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                enableSubcategories 
                  ? 'bg-blue-600' 
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  enableSubcategories ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {enableSubcategories ? (
            // Subcategory mode: group by parent category
            categories.map((category) => (
              <div key={category.id} className="space-y-4">
                {/* Parent Category Header */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-blue-200 dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                </div>
                
                {/* Main Category Spending */}
                {(() => {
                  const currentSpending = spending.find(s => s.categoryId === category.id)
                  const amount = currentSpending?.monthlySpend || 0
                  
                  return (
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <label className="block text-md font-medium text-gray-900 dark:text-white">
                            General {category.name}
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Other {category.name.toLowerCase()} not listed below</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(amount)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Slider
                          value={amount}
                          onValueChange={(value) => updateSpending(category.id, value, false)}
                          min={0}
                          max={2000}
                          step={25}
                          className="py-1"
                        />
                        <input
                          type="number"
                          min="0"
                          step="25"
                          value={amount || ''}
                          onChange={(e) => updateSpending(category.id, parseFloat(e.target.value) || 0, false)}
                          className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )
                })()}
                
                {/* Subcategories */}
                {category.subCategories && category.subCategories.map((subCategory) => {
                  const currentSpending = spending.find(s => s.subCategoryId === subCategory.id)
                  const amount = currentSpending?.monthlySpend || 0
                  
                  return (
                    <div key={subCategory.id} className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 ml-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <label className="block text-md font-medium text-gray-900 dark:text-white">
                            📍 {subCategory.name}
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{subCategory.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {formatCurrency(amount)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Slider
                          value={amount}
                          onValueChange={(value) => updateSpending(subCategory.id, value, true)}
                          min={0}
                          max={2000}
                          step={25}
                          className="py-1"
                        />
                        <input
                          type="number"
                          min="0"
                          step="25"
                          value={amount || ''}
                          onChange={(e) => updateSpending(subCategory.id, parseFloat(e.target.value) || 0, true)}
                          className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          ) : (
            // Standard category mode
            categories.map((category) => {
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
                      onValueChange={(value) => updateSpending(category.id, value, false)}
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
                      onChange={(e) => updateSpending(category.id, parseFloat(e.target.value) || 0, false)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="0"
                    />
                  </div>
                </div>
              )
            })
          )}
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
            <div className="grid grid-cols-3 gap-4">
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

              <button
                onClick={() => setRewardPreference('best_overall')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  rewardPreference === 'best_overall'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-green-300 dark:hover:border-green-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🏆</div>
                  <div className="font-semibold">Best Overall</div>
                  <div className="text-sm opacity-75">Compare cash & points</div>
                </div>
              </button>
            </div>
          </div>

          {(rewardPreference === 'points' || rewardPreference === 'best_overall') && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-600">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                📊 <strong>Initial calculation will use 1¢ per point.</strong><br/>
                You'll be able to adjust point valuations for your top card recommendations after seeing the results.
              </p>
            </div>
          )}
        </div>
      </div>

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
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent mb-4">
              🏆 Your Personalized Recommendations
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Based on your {formatCurrency(totalMonthlySpend)} monthly spending across {spending.filter(s => s.monthlySpend > 0).length} categories
            </p>
          </div>

          {/* Cards Grid */}
          <div className="space-y-6">
            {recommendations.map((rec, index) => {
              const rankColors = [
                'from-yellow-400 to-orange-500', // Gold for #1
                'from-gray-300 to-gray-500',     // Silver for #2
                'from-amber-600 to-amber-800',   // Bronze for #3
                'from-blue-400 to-blue-600',     // Blue for others
              ];
              const rankColor = rankColors[Math.min(index, 3)];
              
              return (
                <div 
                  key={rec.cardId} 
                  className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform hover:scale-105 transition-all duration-300"
                >
                  {/* Card Header */}
                  <div className="relative">
                    <div className={`bg-gradient-to-r ${rankColor} p-6 text-white`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <span className="text-3xl font-bold">#{index + 1}</span>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold">{rec.cardName}</h3>
                            <p className="text-lg opacity-90">{rec.issuer}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                                {rec.rewardType === 'cashback' ? '💵 Cashback' : '🎯 Points'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold">{formatCurrency(rec.netAnnualValue)}</div>
                          <div className="text-lg opacity-90">net annual value</div>
                          <div className="flex flex-col space-y-2 mt-3">
                            {rec.applicationUrl && (
                              <Button
                                onClick={() => window.open(rec.applicationUrl, '_blank')}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold"
                                size="sm"
                              >
                                🚀 Apply Now
                              </Button>
                            )}
                            <Button
                              onClick={() => openCardCustomization(rec.cardId)}
                              variant="outline"
                              size="sm"
                              className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                            >
                              ⚙️ Customize Card
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Value Breakdown Bar */}
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 p-4">
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(rec.totalAnnualValue)}
                          </div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Annual Rewards</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(rec.benefitsValue)}
                          </div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Benefits Value</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            -{formatCurrency(rec.annualFee)}
                          </div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Annual Fee</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {((rec.netAnnualValue / (totalMonthlySpend * 12)) * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Effective Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-6">
                    {/* Category Rewards Breakdown */}
                    {rec.categoryBreakdown && rec.categoryBreakdown.length > 0 && (
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                          💳 Earning Breakdown by Category
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {rec.categoryBreakdown.map((breakdown, idx) => {
                            const categoryIcons: { [key: string]: string } = {
                              'Dining': '🍽️',
                              'Travel': '✈️',
                              'Gas': '⛽',
                              'Groceries': '🛒',
                              'Entertainment': '🎬',
                              'Online Shopping': '🛍️',
                              'Department Stores': '🏬',
                              'General': '💳'
                            };
                            const icon = categoryIcons[breakdown.categoryName] || '💳';
                            
                            // Format reward rate properly for points vs cashback
                            const rewardDisplay = rec.rewardType === 'points' 
                              ? `${breakdown.rewardRate}x` 
                              : `${(breakdown.rewardRate * 100).toFixed(1)}%`;
                            
                            return (
                              <div 
                                key={idx} 
                                className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 rounded-2xl p-4 border border-gray-200 dark:border-gray-600 shadow-lg"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-2xl">{icon}</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {breakdown.categoryName}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                      {rewardDisplay}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {rec.rewardType === 'points' ? 'points' : 'cashback'}
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">Monthly Spend:</span>
                                    <span className="font-medium">{formatCurrency(breakdown.monthlySpend)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">Monthly Earnings:</span>
                                    <span className="font-medium text-green-600 dark:text-green-400">
                                      {formatCurrency(breakdown.monthlyValue)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                                    <span className="text-gray-900 dark:text-white">Annual Value:</span>
                                    <span className="text-green-600 dark:text-green-400">
                                      {formatCurrency(breakdown.annualValue)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Benefits Section */}
                    {rec.benefitsBreakdown && rec.benefitsBreakdown.length > 0 && rec.benefitsValue > 0 && (
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                          🎁 Benefits You Value
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {rec.benefitsBreakdown
                            .filter(benefit => benefit.personalValue > 0)
                            .map((benefit, idx) => (
                            <div 
                              key={idx} 
                              className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-700"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    {benefit.benefitName}
                                  </h5>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-300">Official Value:</span>
                                      <span className="font-medium">{formatCurrency(benefit.officialValue)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-300">Your Value:</span>
                                      <span className="font-bold text-blue-600 dark:text-blue-400">
                                        {formatCurrency(benefit.personalValue)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Signup Bonus */}
                    {rec.signupBonus && (
                      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-2xl p-6 border-2 border-yellow-300 dark:border-yellow-600">
                        <div className="flex items-center space-x-4">
                          <div className="text-4xl">🎁</div>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-yellow-800 dark:text-yellow-300 mb-2">
                              Welcome Bonus
                            </h4>
                            <div className="text-lg font-semibold text-yellow-900 dark:text-yellow-200">
                              Earn {formatCurrency(rec.signupBonus.amount)}
                            </div>
                            <div className="text-sm text-yellow-700 dark:text-yellow-300">
                              when you spend {formatCurrency(rec.signupBonus.requiredSpend)} in the first {rec.signupBonus.timeframe} months
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Card Customization Modal */}
      {customizationOpen && editingCardId && (
        <CardCustomizationModal
          isOpen={customizationOpen}
          onClose={closeCardCustomization}
          onSave={updateCardCustomization}
          card={{
            id: editingCardId,
            name: recommendations.find(r => r.cardId === editingCardId)?.cardName || '',
            type: recommendations.find(r => r.cardId === editingCardId)?.rewardType || 'cashback',
            benefits: recommendations.find(r => r.cardId === editingCardId)?.benefitsBreakdown?.map(b => ({
              id: b.benefitName,
              name: b.benefitName,
              value: b.officialValue
            })) || []
          }}
          currentCustomization={cardCustomizations[editingCardId]}
        />
      )}
    </div>
  )
} 