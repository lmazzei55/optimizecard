'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CardRecommendation } from '@/lib/recommendation-engine'
import { RecommendationItem } from '@/components/RecommendationItem'
import { MultiCardStrategies } from '@/components/MultiCardStrategies'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/Header'
import { CardCustomizationModal } from '@/components/CardCustomizationModal'
import PortfolioAnalysis from '@/components/PortfolioAnalysis'

interface CalculationPreferences {
  includeAnnualFees: boolean
  includeBenefits: boolean
  includeSignupBonuses: boolean
  calculationMode: 'rewards_only' | 'comprehensive' | 'net_value'
}

export default function ResultsPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [customizationLoading, setCustomizationLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<CardRecommendation[]>([])
  const [sortKey, setSortKey] = useState<'name' | 'value'>('value')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filterType, setFilterType] = useState<'all' | 'cashback' | 'points'>('all')
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [cardCustomizations, setCardCustomizations] = useState<Record<string, any>>({})
  const [basePayload, setBasePayload] = useState<any | null>(null)
  
  // Add calculation preferences state
  const [calculationPreferences, setCalculationPreferences] = useState<CalculationPreferences>({
    includeAnnualFees: true,
    includeBenefits: true,
    includeSignupBonuses: true,
    calculationMode: 'comprehensive'
  })

  // Load initial payload & recommendations
  useEffect(() => {
    const payloadRaw = localStorage.getItem('cc-recommendation-input')
    if (!payloadRaw) {
      router.replace('/')
      return
    }
    const payload = JSON.parse(payloadRaw)
    setBasePayload(payload)

    ;(async () => {
      try {
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userSpending: payload.userSpending || [],
            rewardPreference: payload.rewardPreference || 'cashback',
            pointValue: payload.pointValue ?? 0.01,
            cardCustomizations: payload.cardCustomizations || {},
            calculationPreferences // Include calculation preferences
          })
        })
        const data = await res.json()
        setRecommendations(data)
        setCardCustomizations(payload.cardCustomizations || {})
      } catch (err) {
        console.error('Failed to load recommendations', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  // Auto-recalculate when calculation preferences change
  useEffect(() => {
    if (basePayload && recommendations.length > 0) {
      console.log('🔄 Calculation preferences changed, recalculating...')
      recalculateWithNewPreferences()
    }
  }, [calculationPreferences.calculationMode, calculationPreferences.includeAnnualFees, calculationPreferences.includeBenefits, calculationPreferences.includeSignupBonuses])

  // Function to recalculate with new preferences
  const recalculateWithNewPreferences = async () => {
    if (!basePayload) return
    
    setCustomizationLoading(true)
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          userSpending: basePayload.userSpending || [],
          rewardPreference: basePayload.rewardPreference || 'cashback',
          pointValue: basePayload.pointValue ?? 0.01,
          cardCustomizations: cardCustomizations,
          calculationPreferences,
          timestamp: Date.now()
        })
      })
      
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setRecommendations(data)
        console.log('✅ Updated recommendations based on new calculation preferences')
      }
    } catch (err) {
      console.error('Failed to recalculate with new preferences', err)
    } finally {
      setCustomizationLoading(false)
    }
  }

  // Derived, filtered + sorted list
  const processed = recommendations
    .filter((r) => filterType === 'all' || r.rewardType === filterType)
    .sort((a, b) => {
      if (sortKey === 'name') {
        return sortDir === 'asc'
          ? a.cardName.localeCompare(b.cardName)
          : b.cardName.localeCompare(a.cardName)
      }
      return sortDir === 'asc' ? a.netAnnualValue - b.netAnnualValue : b.netAnnualValue - a.netAnnualValue
    })

  // Modal helpers
  const openCustomization = (id: string) => setEditingCardId(id)
  const closeCustomization = () => setEditingCardId(null)

  const handleSaveCustomization = (cust: any) => {
    if (!editingCardId) return

    console.log('🔧 Saving customization for card:', editingCardId, cust)
    console.log('🔧 Current card customizations before update:', cardCustomizations)
    console.log('🔧 New customization data:', cust)

    const updated = { ...cardCustomizations, [editingCardId]: cust }
    setCardCustomizations(updated)
    
    console.log('🔧 Updated customizations:', updated)

    // Persist into localStorage so future navs use it
    const latestPayload = JSON.parse(localStorage.getItem('cc-recommendation-input') || '{}')
    const newPayload = { ...latestPayload, cardCustomizations: updated }
    localStorage.setItem('cc-recommendation-input', JSON.stringify(newPayload))
    setBasePayload(newPayload)

    console.log('🔄 Re-fetching with payload:', {
      userSpending: newPayload.userSpending?.length || 0,
      rewardPreference: newPayload.rewardPreference,
      customizations: Object.keys(updated).length
    })

    // Re-fetch recommendations with updated customizations
    setCustomizationLoading(true)
    fetch('/api/recommendations', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        userSpending: newPayload.userSpending || [],
        rewardPreference: newPayload.rewardPreference || 'cashback',
        pointValue: newPayload.pointValue ?? 0.01,
        cardCustomizations: updated,
        calculationPreferences, // Include current calculation preferences
        timestamp: Date.now() // Add timestamp to prevent caching
      })
    })
      .then(async (r) => {
        const responseText = await r.text()
        console.log('🔧 Raw API response:', responseText)
        
        if (!r.ok) {
          throw new Error(`API request failed with status ${r.status}: ${responseText}`)
        }
        
        try {
          return JSON.parse(responseText)
        } catch (parseError) {
          console.error('🔧 Failed to parse JSON response:', parseError, 'Response:', responseText)
          throw new Error('Invalid JSON response from API')
        }
      })
      .then((d) => {
        console.log('✅ Received updated recommendations:', d?.length || 0, 'cards')
        console.log('🔧 Full recommendation data:', d)
        
        if (Array.isArray(d) && d.length > 0) {
          console.log('🔧 Setting new recommendations and closing modal')
          setRecommendations(d)
          closeCustomization()
        } else {
          console.warn('⚠️ Received empty or invalid recommendations:', d)
          console.log('🔧 Keeping current recommendations and closing modal anyway')
          closeCustomization()
        }
      })
      .catch((err) => {
        console.error('Recalc error', err)
        closeCustomization()
      })
      .finally(() => setCustomizationLoading(false))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto" />
          <p className="text-lg">Loading your recommendations…</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Banner */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-xl text-white shadow-lg mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Your Recommendations</h1>
            <p className="text-sm text-white/80">{recommendations.length} cards ranked by net annual value</p>
          </div>
          <Button
            variant="outline"
            className="bg-white text-blue-700 hover:bg-gray-100"
            onClick={() => router.push('/dashboard')}
          >
            ✏️ Edit Spending
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Ranking Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sticky top-4">
              <div className="flex items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  🎛️ Ranking Filters
                  {customizationLoading && (
                    <div className="ml-3 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-200 dark:border-gray-600 pb-2">
                    Card Types
                  </h3>
                  
                  {/* Card Type Filters */}
                  <div className="space-y-2">
                    {(['all', 'cashback', 'points'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setFilterType(t)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filterType === t 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        {t === 'all' ? '🏆 All Cards' : t === 'cashback' ? '💵 Cashback Only' : '🎯 Points Only'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-200 dark:border-gray-600 pb-2">
                    Include in Rankings
                  </h3>
                  
                  {/* Annual Fees Toggle */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">💳</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">Annual Fees</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Subtract card costs</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={calculationPreferences.includeAnnualFees}
                        onChange={(e) => setCalculationPreferences(prev => ({ 
                          ...prev, 
                          includeAnnualFees: e.target.checked,
                          calculationMode: 'comprehensive'
                        }))}
                        disabled={customizationLoading}
                        className="sr-only peer"
                      />
                      <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-sm peer-checked:bg-blue-600 peer-checked:border-blue-600 flex items-center justify-center transition-colors">
                        {calculationPreferences.includeAnnualFees && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Card Benefits Toggle */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">✈️</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">Card Benefits</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Travel credits, etc.</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={calculationPreferences.includeBenefits}
                        onChange={(e) => setCalculationPreferences(prev => ({ 
                          ...prev, 
                          includeBenefits: e.target.checked,
                          calculationMode: 'comprehensive'
                        }))}
                        disabled={customizationLoading}
                        className="sr-only peer"
                      />
                      <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-sm peer-checked:bg-blue-600 peer-checked:border-blue-600 flex items-center justify-center transition-colors">
                        {calculationPreferences.includeBenefits && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Signup Bonuses Toggle */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">🎁</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">Signup Bonuses</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Welcome offers</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={calculationPreferences.includeSignupBonuses}
                        onChange={(e) => setCalculationPreferences(prev => ({ 
                          ...prev, 
                          includeSignupBonuses: e.target.checked,
                          calculationMode: 'comprehensive'
                        }))}
                        disabled={customizationLoading}
                        className="sr-only peer"
                      />
                      <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-sm peer-checked:bg-blue-600 peer-checked:border-blue-600 flex items-center justify-center transition-colors">
                        {calculationPreferences.includeSignupBonuses && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Current Calculation Status */}
                <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-600">
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600 dark:text-blue-400 text-sm">📊</span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                        {!calculationPreferences.includeAnnualFees && !calculationPreferences.includeBenefits && !calculationPreferences.includeSignupBonuses
                          ? 'Pure Rewards'
                          : calculationPreferences.includeAnnualFees && calculationPreferences.includeBenefits && calculationPreferences.includeSignupBonuses
                          ? 'Complete Analysis'
                          : calculationPreferences.includeAnnualFees && !calculationPreferences.includeBenefits && !calculationPreferences.includeSignupBonuses
                          ? 'Net Value'
                          : 'Custom Calculation'
                        }
                      </h4>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {!calculationPreferences.includeAnnualFees && !calculationPreferences.includeBenefits && !calculationPreferences.includeSignupBonuses && 
                          'Pure reward earnings only'
                        }
                        {calculationPreferences.includeAnnualFees && !calculationPreferences.includeBenefits && !calculationPreferences.includeSignupBonuses && 
                          'Rewards minus annual fees'
                        }
                        {calculationPreferences.includeAnnualFees && calculationPreferences.includeBenefits && calculationPreferences.includeSignupBonuses && 
                          'All factors included'
                        }
                        {(calculationPreferences.includeAnnualFees || calculationPreferences.includeBenefits || calculationPreferences.includeSignupBonuses) && 
                         !(calculationPreferences.includeAnnualFees && calculationPreferences.includeBenefits && calculationPreferences.includeSignupBonuses) &&
                         !(calculationPreferences.includeAnnualFees && !calculationPreferences.includeBenefits && !calculationPreferences.includeSignupBonuses) &&
                          'Based on selected filters'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Controls */}
            <div className="flex items-center justify-end gap-4">
              <div className="space-x-2 text-sm">
                <span>Sort by:</span>
                <button
                  onClick={() => {
                    setSortKey('value')
                    setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                  }}
                  className="px-3 py-1 rounded-full border border-gray-300"
                >
                  Net Value {sortKey === 'value' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </button>
                <button
                  onClick={() => {
                    setSortKey('name')
                    setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                  }}
                  className="px-3 py-1 rounded-full border border-gray-300"
                >
                  Name {sortKey === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </button>
              </div>
            </div>

            {/* Cards List */}
            <div className="space-y-4">
              {processed.slice(0, 10).map((rec, idx) => (
                <RecommendationItem key={rec.cardId} recommendation={rec} rank={idx} onCustomize={() => openCustomization(rec.cardId)} />
              ))}
            </div>
          </div>
        </div>

        {/* Multi-Card Strategies Section */}
        <div className="mt-12">
          <MultiCardStrategies 
            userSpending={basePayload?.userSpending || []}
            benefitValuations={basePayload?.benefitValuations || []}
            rewardPreference={basePayload?.rewardPreference || 'cashback'}
            onError={(error) => console.error('Multi-card strategy error:', error)}
            onUpgradePrompt={() => router.push('/pricing')}
          />
        </div>

        {/* Portfolio Analysis Section */}
        <div className="mt-12">
          <PortfolioAnalysis />
        </div>
      </div>

      {editingCardId && (
        <CardCustomizationModal
          isOpen
          onClose={closeCustomization}
          onSave={handleSaveCustomization}
          isLoading={customizationLoading}
          card={{
            id: editingCardId,
            name: processed.find((r) => r.cardId === editingCardId)?.cardName || '',
            type: processed.find((r) => r.cardId === editingCardId)?.rewardType || 'cashback',
            benefits:
              processed
                .find((r) => r.cardId === editingCardId)
                ?.benefitsBreakdown.map((b) => ({ id: b.benefitName, name: b.benefitName, value: b.officialValue })) || []
          }}
          currentCustomization={cardCustomizations[editingCardId]}
        />
      )}
    </>
  )
}