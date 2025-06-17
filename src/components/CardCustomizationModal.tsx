"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

interface Benefit {
  id: string
  name: string
  value: number
}

interface CardCustomizationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (customization: CardCustomization) => void
  isLoading?: boolean
  card: {
    id: string
    name: string
    type: 'cashback' | 'points'
    benefits: Benefit[]
  }
  currentCustomization?: CardCustomization
}

export interface CardCustomization {
  pointValue?: number
  benefitValues: Record<string, number>
  enabledBenefits: Record<string, boolean>
}

export function CardCustomizationModal({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
  card,
  currentCustomization
}: CardCustomizationModalProps) {
  const [pointValue, setPointValue] = useState(0.01)
  const [benefitValues, setBenefitValues] = useState<Record<string, number>>({})
  const [enabledBenefits, setEnabledBenefits] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (isOpen) {
      console.log('🎛️ Modal opening for card:', card.id, 'benefits:', card.benefits?.length || 0)
      
      // Initialize point value
      setPointValue(currentCustomization?.pointValue || 0.01)
      
      // Initialize benefit values and enabled states
      const initialBenefitValues: Record<string, number> = {}
      const initialEnabledBenefits: Record<string, boolean> = {}
      
      if (card.benefits && card.benefits.length > 0) {
        card.benefits.forEach(benefit => {
          initialBenefitValues[benefit.id] = currentCustomization?.benefitValues[benefit.id] || benefit.value
          initialEnabledBenefits[benefit.id] = currentCustomization?.enabledBenefits[benefit.id] !== false // Default to enabled
        })
      } else {
        console.warn('⚠️ No benefits found for card:', card.id, card.name)
        // If we have previous customization data, preserve it
        if (currentCustomization?.benefitValues) {
          Object.assign(initialBenefitValues, currentCustomization.benefitValues)
        }
        if (currentCustomization?.enabledBenefits) {
          Object.assign(initialEnabledBenefits, currentCustomization.enabledBenefits)
        }
      }
      
      console.log('🎛️ Initialized with:', {
        benefitValues: Object.keys(initialBenefitValues).length,
        enabledBenefits: Object.keys(initialEnabledBenefits).length,
        pointValue
      })
      
      setBenefitValues(initialBenefitValues)
      setEnabledBenefits(initialEnabledBenefits)
    }
  }, [isOpen, card, currentCustomization])

  const handleSave = () => {
    const customization: CardCustomization = {
      benefitValues,
      enabledBenefits,
      ...(card.type === 'points' && { pointValue })
    }
    onSave(customization)
  }

  const handleBenefitValueChange = (benefitId: string, value: number) => {
    setBenefitValues(prev => ({
      ...prev,
      [benefitId]: value
    }))
  }

  const handleBenefitToggle = (benefitId: string, enabled: boolean) => {
    setEnabledBenefits(prev => ({
      ...prev,
      [benefitId]: enabled
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Customize {card.name}
              </h2>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Point Value Section - Only show for points cards */}
          {card.type === 'points' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                🎯 Point Valuation
              </h3>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-200 dark:border-purple-600">
                <div className="flex flex-col space-y-2 mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    How much do you value each point/mile?
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 dark:text-gray-400">$</span>
                    <input
                      type="number"
                      min="0.005"
                      max="0.05"
                      step="0.001"
                      value={pointValue}
                      onChange={(e) => setPointValue(parseFloat(e.target.value) || 0.01)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">per point</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Examples: Chase UR ~1.2¢, Amex MR ~1.0¢, Airline miles ~1.5¢
                </div>
              </div>
            </div>
          )}

          {/* Benefits Section */}
          {(card.benefits && card.benefits.length > 0) || (currentCustomization?.benefitValues && Object.keys(currentCustomization.benefitValues).length > 0) ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                🎁 Benefit Valuations
              </h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-600">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Adjust benefits based on your actual usage patterns.
                </p>
                
                <div className="bg-blue-100 dark:bg-blue-800/30 rounded-lg p-2 mb-3 border border-blue-300 dark:border-blue-500">
                  <p className="text-xs text-blue-800 dark:text-blue-200 flex items-start">
                    <span className="mr-1">💡</span>
                    <span>
                      <strong>Tip:</strong> If you only use $200 of a $300 travel credit, set it to $200.
                    </span>
                  </p>
                </div>
                
                <div className="space-y-3">
                  {(card.benefits || []).map((benefit) => (
                    <div key={benefit.id} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="checkbox"
                            id={`benefit-${benefit.id}`}
                            checked={enabledBenefits[benefit.id] || false}
                            onChange={(e) => handleBenefitToggle(benefit.id, e.target.checked)}
                            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <label 
                              htmlFor={`benefit-${benefit.id}`}
                              className={`font-medium cursor-pointer text-sm ${
                                enabledBenefits[benefit.id] 
                                  ? 'text-gray-900 dark:text-white' 
                                  : 'text-gray-500 dark:text-gray-400 line-through'
                              }`}
                            >
                              {benefit.name}
                            </label>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Official: ${benefit.value.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600 dark:text-gray-400 text-sm">$</span>
                          <input
                            type="number"
                            value={benefitValues[benefit.id] || 0}
                            onChange={(e) => handleBenefitValueChange(benefit.id, parseFloat(e.target.value) || 0)}
                            disabled={!enabledBenefits[benefit.id]}
                            step="1"
                            min="0"
                            max="1000"
                            className={`w-16 px-2 py-1 border rounded text-right text-sm ${
                              enabledBenefits[benefit.id]
                                ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-white'
                                : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!card.benefits || card.benefits.length === 0) && currentCustomization?.benefitValues && (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <p className="text-sm">Previous benefit customizations preserved.</p>
                      <p className="text-xs mt-1">Click "Save Changes" to apply your existing settings.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-600">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                ⚠️ No benefits data available for this card at the moment.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-600 flex justify-end space-x-2">
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="text-gray-600 border-gray-300 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </div>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 