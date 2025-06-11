'use client'

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/Header"
import Link from "next/link"

interface CreditCard {
  id: string
  name: string
  issuer: string
  annualFee: number
  rewardType: string
}

export default function Profile() {
  const { data: session, status, update } = useSession()
  const [rewardPreference, setRewardPreference] = useState<'cashback' | 'points' | 'best_overall'>('cashback')
  const [pointValue, setPointValue] = useState(0.01)
  const [enableSubCategories, setEnableSubCategories] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  
  // Owned cards state
  const [allCards, setAllCards] = useState<CreditCard[]>([])
  const [ownedCardIds, setOwnedCardIds] = useState<string[]>([])
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [isUpdatingCards, setIsUpdatingCards] = useState(false)

  useEffect(() => {
    if (session?.user) {
      setRewardPreference(session.user.rewardPreference as any || 'cashback')
      setPointValue(session.user.pointValue || 0.01)
      setEnableSubCategories(session.user.enableSubCategories || false)
    }
  }, [session])

  // Fetch all cards and owned cards
  useEffect(() => {
    const fetchCards = async () => {
      if (!session?.user?.id) return
      
      try {
        const response = await fetch('/api/user/cards')
        if (response.ok) {
          const data = await response.json()
          setAllCards(data.allCards)
          setOwnedCardIds(data.ownedCardIds)
        } else if (response.status === 503) {
          console.warn('⚠️ Database temporarily unavailable - cards will load when available')
          // Keep trying to load cards, but don't show error to user
        } else {
          console.error('Failed to fetch cards, status:', response.status)
        }
      } catch (error) {
        console.error('Error fetching cards:', error)
      } finally {
        setIsLoadingCards(false)
      }
    }

    fetchCards()
  }, [session?.user?.id])

  const handleUpdateCards = async () => {
    if (!session?.user?.id) return

    setIsUpdatingCards(true)
    try {
      const response = await fetch('/api/user/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownedCardIds }),
      })

      if (response.ok) {
        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 3000)
      } else if (response.status === 503) {
        console.warn('⚠️ Database temporarily unavailable - please try again later')
        // Could show a user-friendly message here
      } else {
        console.error('Failed to update cards, status:', response.status)
      }
    } catch (error) {
      console.error('Error updating owned cards:', error)
    } finally {
      setIsUpdatingCards(false)
    }
  }

  const toggleCard = (cardId: string) => {
    setOwnedCardIds(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    )
  }

  const handleSave = async () => {
    if (!session?.user?.id) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardPreference,
          pointValue,
          enableSubCategories,
        }),
      })

      if (response.ok) {
        // Update the session with new preferences instead of reloading
        await update({
          rewardPreference,
          pointValue,
          enableSubCategories,
        })
        
        // Signal that preferences were updated for other components
        localStorage.setItem('preferences-updated', Date.now().toString())
        
        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 3000)
      } else if (response.status === 503) {
        console.warn('⚠️ Database temporarily unavailable - preferences not saved')
        // Could show a user-friendly message here
      } else {
        console.error('Failed to save preferences, status:', response.status)
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to access your profile
          </h1>
          <Link
            href="/auth/signin"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-3xl">⚙️</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Profile Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Customize your preferences for personalized recommendations
            </p>
          </div>

          {/* User Info */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Account Information
            </h2>
            <div className="flex items-center space-x-4">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                  {session.user?.name?.[0] || session.user?.email?.[0] || "U"}
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {session.user?.name || "User"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {session.user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Reward Preferences
            </h2>

            <div className="space-y-6">
              {/* Reward Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Preferred Reward Type
                </label>
                <div className="grid grid-cols-3 gap-3">
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
                      <div className="font-semibold">Points</div>
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
                    </div>
                  </button>
                </div>
              </div>

              {/* Point Value */}
              {(rewardPreference === 'points' || rewardPreference === 'best_overall') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Point Valuation (dollars per point)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      min="0.005"
                      max="0.05"
                      step="0.001"
                      value={pointValue}
                      onChange={(e) => setPointValue(parseFloat(e.target.value) || 0.01)}
                      className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ${pointValue.toFixed(3)} per point
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Examples: Chase UR ~$0.012, Amex MR ~$0.010, Airline miles ~$0.015
                  </p>
                </div>
              )}

              {/* Subcategories */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={enableSubCategories}
                    onChange={(e) => setEnableSubCategories(e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Enable Subcategories
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Get more precise recommendations with merchant-specific categories (Amazon, Whole Foods, etc.)
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isSaved && (
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <div>
                      <span className="text-sm text-green-600 dark:text-green-400">
                        Preferences saved successfully!
                      </span>
                      <Link 
                        href="/dashboard"
                        className="block text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                      >
                        → Go to Dashboard to see changes
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            </div>
          </div>

          {/* Owned Cards Section */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Your Credit Cards
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Select the credit cards you currently own to get personalized recommendations and avoid duplicate suggestions.
            </p>

            {isLoadingCards ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading cards...</span>
              </div>
            ) : (
              <>
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {allCards.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => toggleCard(card.id)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        ownedCardIds.includes(card.id)
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              ownedCardIds.includes(card.id)
                                ? 'border-green-500 bg-green-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {ownedCardIds.includes(card.id) && (
                                <span className="text-white text-sm">✓</span>
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {card.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {card.issuer} • {card.rewardType} • ${card.annualFee} AF
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {ownedCardIds.length} card{ownedCardIds.length !== 1 ? 's' : ''} selected
                    {isSaved && (
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-green-500 text-xs">✓</span>
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Cards updated!
                        </span>
                        <Link 
                          href="/dashboard"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          → See recommendations
                        </Link>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleUpdateCards}
                    disabled={isUpdatingCards}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isUpdatingCards ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </div>
                    ) : (
                      'Update Cards'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  )
} 