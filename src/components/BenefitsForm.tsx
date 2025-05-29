"use client"

import { useState, useEffect } from "react"
import { formatCurrency } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"

interface CardBenefit {
  id: string
  name: string
  description: string
  annualValue: number
  category: string
  isRecurring: boolean
}

interface CardWithBenefits {
  card: {
    id: string
    name: string
    issuer: string
  }
  benefits: CardBenefit[]
}

interface BenefitValuation {
  benefitId: string
  personalValue: number
}

interface BenefitsFormProps {
  onBenefitValuationsChange: (valuations: BenefitValuation[]) => void
}

export function BenefitsForm({ onBenefitValuationsChange }: BenefitsFormProps) {
  const [benefitsByCard, setBenefitsByCard] = useState<Record<string, CardWithBenefits>>({})
  const [benefitValuations, setBenefitValuations] = useState<BenefitValuation[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchBenefits()
  }, [])

  useEffect(() => {
    onBenefitValuationsChange(benefitValuations)
  }, [benefitValuations, onBenefitValuationsChange])

  const fetchBenefits = async () => {
    try {
      const response = await fetch('/api/benefits')
      const data = await response.json()
      
      if (data.success) {
        setBenefitsByCard(data.data.benefitsByCard)
        
        // Initialize all benefit valuations to their full official value
        const allBenefits = data.data.benefits
        const initialValuations = allBenefits.map((benefit: CardBenefit) => ({
          benefitId: benefit.id,
          personalValue: benefit.annualValue // Default to full value instead of 0
        }))
        setBenefitValuations(initialValuations)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching benefits:', error)
      setLoading(false)
    }
  }

  const updateBenefitValuation = (benefitId: string, personalValue: number) => {
    setBenefitValuations(prev => 
      prev.map(val => 
        val.benefitId === benefitId 
          ? { ...val, personalValue }
          : val
      )
    )
  }

  const toggleBenefitEnabled = (benefitId: string, isEnabled: boolean, officialValue: number) => {
    if (isEnabled) {
      // Enable: set to official value
      updateBenefitValuation(benefitId, officialValue)
    } else {
      // Disable: set to 0
      updateBenefitValuation(benefitId, 0)
    }
  }

  const isBenefitEnabled = (benefitId: string): boolean => {
    return getBenefitValuation(benefitId) > 0
  }

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        newSet.add(cardId)
      }
      return newSet
    })
  }

  const getBenefitValuation = (benefitId: string): number => {
    const valuation = benefitValuations.find(val => val.benefitId === benefitId)
    if (valuation !== undefined) {
      return valuation.personalValue
    }
    
    // If no valuation found, find the benefit and return its official value as default
    const allBenefits = Object.values(benefitsByCard).flatMap(cardData => cardData.benefits)
    const benefit = allBenefits.find(b => b.id === benefitId)
    return benefit?.annualValue || 0
  }

  const getCardTotalBenefitsValue = (cardId: string): number => {
    const cardData = benefitsByCard[cardId]
    if (!cardData) return 0
    
    return cardData.benefits.reduce((total, benefit) => {
      return total + getBenefitValuation(benefit.id)
    }, 0)
  }

  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading benefits...</p>
        </div>
      </div>
    )
  }

  const cardsWithBenefits = Object.values(benefitsByCard).filter(cardData => cardData.benefits.length > 0)

  if (cardsWithBenefits.length === 0) {
    return null
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
      <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
        🎁 Card Benefits Valuation
      </h2>
      <div className="text-center mb-8 max-w-4xl mx-auto">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          How much can you personally utilize each benefit? We've pre-filled each benefit at its full official value, 
          but you should adjust these based on your actual usage patterns.
        </p>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            💡 <strong>Tip:</strong> For example, if a card offers $300 travel credit but you only spend $200/year on travel, 
            adjust your personal value to $200. If you never use Priority Pass lounges, set that value to $0.
          </p>
        </div>
      </div>
      
      <div className="space-y-6">
        {cardsWithBenefits.map((cardData) => {
          const isExpanded = expandedCards.has(cardData.card.id)
          const totalValue = getCardTotalBenefitsValue(cardData.card.id)
          
          return (
            <div key={cardData.card.id} className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleCardExpansion(cardData.card.id)}
                className="w-full p-6 bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-600/50 transition-colors duration-200 text-left"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {cardData.card.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{cardData.card.issuer}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {cardData.benefits.length} benefit{cardData.benefits.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(totalValue)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">personal value</p>
                    <div className="text-2xl text-gray-400 dark:text-gray-500 mt-2">
                      {isExpanded ? '−' : '+'}
                    </div>
                  </div>
                </div>
              </button>
              
              {isExpanded && (
                <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600">
                  <div className="space-y-6">
                    {cardData.benefits.map((benefit) => {
                      const personalValue = getBenefitValuation(benefit.id)
                      
                      return (
                        <div key={benefit.id} className="space-y-4 p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start space-x-3 flex-1 mr-4">
                              <div className="flex items-center mt-1">
                                <input
                                  type="checkbox"
                                  id={`benefit-${benefit.id}`}
                                  checked={isBenefitEnabled(benefit.id)}
                                  onChange={(e) => toggleBenefitEnabled(benefit.id, e.target.checked, benefit.annualValue)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                                />
                              </div>
                              <div className="flex-1">
                                <label htmlFor={`benefit-${benefit.id}`} className="font-semibold text-gray-900 dark:text-white cursor-pointer">
                                  {benefit.name}
                                </label>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  {benefit.description}
                                </p>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                  <span>Official value: {formatCurrency(benefit.annualValue)}</span>
                                  <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded">
                                    {benefit.category}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right min-w-[100px]">
                              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {formatCurrency(personalValue)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">your value</p>
                            </div>
                          </div>

                          {/* Slider - only show when benefit is enabled */}
                          {isBenefitEnabled(benefit.id) && (
                            <div className="space-y-3">
                              <Slider
                                value={personalValue}
                                onValueChange={(value) => updateBenefitValuation(benefit.id, value)}
                                min={0}
                                max={benefit.annualValue} // Fixed: max is now just the official value
                                step={10}
                                className="py-2"
                              />
                              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>$0</span>
                                <span>{formatCurrency(benefit.annualValue / 2)}</span>
                                <span>{formatCurrency(benefit.annualValue)}</span>
                              </div>
                            </div>
                          )}

                          {/* Text Input - only show when benefit is enabled */}
                          {isBenefitEnabled(benefit.id) && (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Exact:</span>
                              <input
                                type="number"
                                min="0"
                                max={benefit.annualValue}
                                step="10"
                                value={personalValue || ''}
                                onChange={(e) => updateBenefitValuation(benefit.id, Math.min(parseFloat(e.target.value) || 0, benefit.annualValue))}
                                className="flex-1 max-w-32 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                placeholder="0"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-green-200 dark:border-gray-600">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Total Personal Benefits Value: {formatCurrency(benefitValuations.reduce((sum, val) => sum + val.personalValue, 0))}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            This represents your personal valuation of all card benefits and will be included in your recommendations
          </p>
        </div>
      </div>
    </div>
  )
} 