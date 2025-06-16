'use client'

import React, { useState } from 'react'
import { MultiCardStrategy } from '@/lib/multi-card-engine'
import { formatCurrency } from '@/lib/utils'

interface MultiCardStrategiesProps {
  userSpending: any[]
  benefitValuations?: any[]
  rewardPreference: 'cashback' | 'points' | 'best_overall'
  onError?: (error: string) => void
  onUpgradePrompt?: () => void
}

export function MultiCardStrategies({ userSpending, benefitValuations, rewardPreference, onError, onUpgradePrompt }: MultiCardStrategiesProps) {
  const [strategies, setStrategies] = useState<MultiCardStrategy[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStrategies = async () => {
    if (!userSpending || userSpending.length === 0) {
      setError('Please add spending categories first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/multi-card-strategies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          userSpending,
          benefitValuations: benefitValuations || [],
          rewardPreference
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 403 || response.status === 401) {
          // Free tier or unauthenticated users should see upgrade prompt
          onUpgradePrompt?.()
          return
        } else {
          setError(errorData.error || 'Failed to fetch strategies')
        }
        return
      }

      const data = await response.json()
      setStrategies(data.strategies || [])
    } catch (err) {
      setError('Network error occurred')
      console.error('Error fetching strategies:', err)
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Premium Feature Required</h3>
              <p className="text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
            🎯 Multi-Card Strategies
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Optimize 2-3 card combinations for maximum rewards
          </p>
        </div>
        <button
          onClick={fetchStrategies}
          disabled={loading || userSpending.length === 0}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold rounded-full shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Calculating...</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>Generate Strategies</span>
            </>
          )}
        </button>
      </div>

      {strategies.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl mb-8 shadow-xl">
            <span className="text-4xl">🎯</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to optimize your card portfolio?
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Click "Generate Strategies" to discover optimal 2-3 card combinations that maximize your rewards across all spending categories.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
              <div className="text-3xl mb-3">📊</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Smart Analysis</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">AI-powered optimization across all your spending categories</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
              <div className="text-3xl mb-3">💳</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Card Combinations</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Find the perfect 2-3 card setup for maximum rewards</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
              <div className="text-3xl mb-3">🎯</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Category Allocation</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">See exactly which card to use for each purchase</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {strategies.map((strategy, index) => (
            <div key={index} className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
              {/* Strategy Header */}
              <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                      <span className="text-2xl font-bold">#{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{strategy.strategyName}</h3>
                      <p className="text-lg opacity-90">{strategy.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{formatCurrency(strategy.netAnnualValue)}</div>
                    <div className="text-lg opacity-90">net annual value</div>
                    <div className="text-sm opacity-75 mt-2">
                      {formatCurrency(strategy.totalAnnualValue)} rewards - {formatCurrency(strategy.totalAnnualFees)} fees
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategy Content */}
              <div className="p-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Recommended Cards */}
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                      💳 Recommended Cards
                    </h4>
                    <div className="space-y-4">
                      {strategy.cards.map((cardRec, cardIndex) => (
                        <div key={cardIndex} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h5 className="text-lg font-bold text-gray-900 dark:text-white">{cardRec.card.cardName}</h5>
                              <p className="text-gray-600 dark:text-gray-300">{cardRec.card.issuer}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                                  {cardRec.card.rewardType === 'cashback' ? '💵 Cashback' : '🎯 Points'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(cardRec.categoryValue)}/year
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                Annual Fee: {formatCurrency(cardRec.card.annualFee)}
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Best for:</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{cardRec.recommendedCategories.join(', ')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category Allocations */}
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                      🎯 Which Card to Use When
                    </h4>
                    <div className="space-y-3">
                      {strategy.categoryAllocations.map((allocation, allocIndex) => {
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
                        const icon = categoryIcons[allocation.categoryName] || '💳';

                        return (
                          <div key={allocIndex} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                <span className="text-xl">{icon}</span>
                                <div>
                                  <span className="font-semibold text-gray-900 dark:text-white">{allocation.categoryName}</span>
                                  <div className="text-sm text-gray-600 dark:text-gray-300">
                                    {formatCurrency(allocation.monthlySpend)}/month
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-blue-600 dark:text-blue-400">{allocation.bestCard}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                  {allocation.rewardRate}x = {formatCurrency(allocation.annualValue)}/year
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 