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
        
        // Initialize all benefit valuations to 0
        const allBenefits = data.data.benefits
        const initialValuations = allBenefits.map((benefit: CardBenefit) => ({
          benefitId: benefit.id,
          personalValue: 0
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
    return benefitValuations.find(val => val.benefitId === benefitId)?.personalValue || 0
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
      <p className="text-gray-600 dark:text-gray-300 text-center mb-8 max-w-3xl mx-auto">
        How much can you personally utilize each benefit? For example, if a card offers $300 travel credit but you only travel $200/year, set your personal value to $200.
      </p>
      
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
                            <div className="flex-1 mr-4">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {benefit.name}
                              </h4>
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
                            <div className="text-right min-w-[100px]">
                              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {formatCurrency(personalValue)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">your value</p>
                            </div>
                          </div>

                          {/* Slider */}
                          <div className="space-y-3">
                            <Slider
                              value={personalValue}
                              onValueChange={(value) => updateBenefitValuation(benefit.id, value)}
                              min={0}
                              max={Math.max(benefit.annualValue * 1.2, 500)} // Allow 20% over official value or $500 min
                              step={10}
                              className="py-2"
                            />
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>$0</span>
                              <span>{formatCurrency(benefit.annualValue)}</span>
                              <span>{formatCurrency(Math.max(benefit.annualValue * 1.2, 500))}</span>
                            </div>
                          </div>

                          {/* Text Input */}
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Exact:</span>
                            <input
                              type="number"
                              min="0"
                              step="10"
                              value={personalValue || ''}
                              onChange={(e) => updateBenefitValuation(benefit.id, parseFloat(e.target.value) || 0)}
                              className="flex-1 max-w-32 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              placeholder="0"
                            />
                          </div>
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
            Total Benefits Value: {formatCurrency(benefitValuations.reduce((sum, val) => sum + val.personalValue, 0))}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            This will be added to your card recommendations
          </p>
        </div>
      </div>
    </div>
  )
} 