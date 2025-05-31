"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/Header"

interface SubscriptionData {
  subscriptionTier: string
  subscriptionStatus: string
  subscriptionStartDate?: string
  subscriptionEndDate?: string
  trialEndDate?: string
}

export default function PricingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchSubscription()
    } else {
      setLoading(false)
    }
  }, [session])

  // Check for successful upgrade from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('upgraded') === 'true' && session?.user) {
      // Wait a moment for webhook to process, then verify subscription with Stripe
      setTimeout(async () => {
        await verifySubscription()
      }, 2000)
    }
  }, [session])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.data)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const verifySubscription = async () => {
    try {
      const response = await fetch('/api/stripe/verify-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Subscription verified:', data.message)
        // Refresh subscription data
        await fetchSubscription()
        return data
      }
    } catch (error) {
      console.error('Error verifying subscription:', error)
    }
    return null
  }

  const handleUpgrade = async () => {
    // Create Stripe checkout session
    try {
      setLoading(true)
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (response.ok && data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl
      } else {
        console.error('Error creating checkout session:', data.error)
        alert('Failed to start checkout. Please try again.')
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    // Open Stripe customer portal
    try {
      setLoading(true)
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (response.ok && data.portalUrl) {
        // Redirect to Stripe customer portal
        window.location.href = data.portalUrl
      } else {
        console.error('Error creating portal session:', data.error)
        alert('Failed to open billing portal. Please try again.')
      }
    } catch (error) {
      console.error('Error opening portal:', error)
      alert('Failed to open billing portal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const isPremium = subscription?.subscriptionTier === 'premium'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Start with our free tier featuring popular no annual fee cards, or upgrade to premium for access to all premium cards and advanced features.
          </p>
        </div>

        {/* Current Status */}
        {session?.user && subscription && (
          <div className="max-w-md mx-auto mb-12">
            <div className={`p-4 rounded-xl border ${isPremium 
              ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' 
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            }`}>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{isPremium ? '👑' : '🆓'}</span>
                <div>
                  <h3 className={`font-semibold ${isPremium 
                    ? 'text-purple-800 dark:text-purple-300' 
                    : 'text-blue-800 dark:text-blue-300'
                  }`}>
                    Current Plan: {isPremium ? 'Premium' : 'Free'}
                  </h3>
                  <p className={`text-sm ${isPremium 
                    ? 'text-purple-600 dark:text-purple-400' 
                    : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {isPremium ? 'Access to all premium cards' : 'No annual fee cards only'}
                  </p>
                </div>
                <button
                  onClick={verifySubscription}
                  className="ml-auto text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1 rounded-lg transition-colors"
                  title="Refresh subscription status"
                >
                  🔄
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free</h2>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">$0</div>
              <p className="text-gray-600 dark:text-gray-400">Perfect for getting started</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <span className="text-green-500 text-xl">✓</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">12-15 Popular No Annual Fee Cards</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Chase Freedom, Citi Double Cash, Discover it, etc.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-500 text-xl">✓</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Unlimited Recommendations</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">No usage limits or restrictions</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-500 text-xl">✓</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Basic Spending Categories</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Dining, travel, gas, groceries, and more</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-500 text-xl">✓</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Subcategory Optimization</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Amazon, Whole Foods, hotels, car rental</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-500 text-xl">✓</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">User Profiles & Preferences</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Save settings and owned cards</p>
                </div>
              </div>
            </div>

            <button 
              disabled={!session?.user || subscription?.subscriptionTier === 'free'}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-semibold py-3 px-4 rounded-xl cursor-not-allowed"
            >
              {!session?.user ? 'Sign In to Get Started' : 'Current Plan'}
            </button>
          </div>

          {/* Premium Tier */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-yellow-400 text-purple-900 px-3 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Premium</h2>
              <div className="text-4xl font-bold mb-2">$9.99</div>
              <p className="text-purple-100">per month</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <span className="text-yellow-300 text-xl">✓</span>
                <div>
                  <p className="font-medium">Everything in Free, plus:</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-yellow-300 text-xl">✓</span>
                <div>
                  <p className="font-medium">All Premium Annual Fee Cards</p>
                  <p className="text-sm text-purple-100">Chase Sapphire, Amex Gold/Platinum, Capital One Venture X</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-yellow-300 text-xl">✓</span>
                <div>
                  <p className="font-medium">Advanced Benefits Optimization</p>
                  <p className="text-sm text-purple-100">Travel credits, lounge access, hotel status</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-yellow-300 text-xl">✓</span>
                <div>
                  <p className="font-medium">Multi-Card Strategies</p>
                  <p className="text-sm text-purple-100">Optimize 2-3 card combinations</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-yellow-300 text-xl">✓</span>
                <div>
                  <p className="font-medium">Business Credit Cards</p>
                  <p className="text-sm text-purple-100">Separate business spending optimization</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-yellow-300 text-xl">✓</span>
                <div>
                  <p className="font-medium">Priority Support</p>
                  <p className="text-sm text-purple-100">Email support with faster response times</p>
                </div>
              </div>
            </div>

            {session?.user ? (
              isPremium ? (
                <button 
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="w-full bg-white/20 text-white font-semibold py-3 px-4 rounded-xl hover:bg-white/30 transition-all duration-200"
                >
                  {loading ? 'Loading...' : 'Manage Subscription'}
                </button>
              ) : (
                <button 
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full bg-white text-purple-600 font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? 'Loading...' : 'Upgrade to Premium'}
                </button>
              )
            ) : (
              <Link 
                href="/auth/signin"
                className="block w-full bg-white text-purple-600 font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 text-center"
              >
                Sign In to Upgrade
              </Link>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Why are premium cards behind a paywall?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Premium cards with annual fees require sophisticated optimization of benefits like travel credits, lounge access, and hotel status. Our premium tier provides the advanced tools needed to maximize these complex reward structures.
              </p>
            </div>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! You can cancel your premium subscription at any time. You'll continue to have access to premium features until the end of your billing period, then automatically return to the free tier.
              </p>
            </div>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                What if I'm new to credit cards?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Our free tier is perfect for beginners! It includes all the popular no annual fee cards that are ideal for building credit history. You can always upgrade later when you're ready for premium cards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 