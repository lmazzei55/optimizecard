"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/Header"
import { Button } from '@/components/ui/button'
import { CheckoutButton } from '@/components/CheckoutButton'
import { DebugCustomerInfo } from '@/components/DebugCustomerInfo'

// Prevent static generation to avoid useSearchParams issues
export const dynamic = 'force-dynamic'

interface SubscriptionData {
  subscriptionTier: string
  subscriptionStatus: string
  subscriptionStartDate?: string
  subscriptionEndDate?: string
  trialEndDate?: string
}

function PricingContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showCanceled, setShowCanceled] = useState(false)
  const syncTriggeredRef = useRef(false)

  useEffect(() => {
    if (session?.user) {
      fetchSubscription()
    } else {
      setLoading(false)
    }
  }, [session])

  // Check for success/cancel from Stripe
  useEffect(() => {
    if (searchParams?.get('success') === 'true') {
      setShowSuccess(true)
    }
    if (searchParams?.get('canceled') === 'true') {
      setShowCanceled(true)
    }
  }, [searchParams])

  // Enhanced auto-sync subscription after successful payment or when user lands on pricing page
  useEffect(() => {
    if (session?.user && !loading && !syncTriggeredRef.current) {
      // Trigger sync if:
      // 1. Success parameter is present (just completed payment)
      // 2. User came from a recent payment (within last 5 minutes)
      // 3. Subscription data shows free but we suspect they might have just paid
      
      const shouldSync = showSuccess || 
        (subscription?.subscriptionTier === 'free' && searchParams?.get('success') !== null)
      
      if (shouldSync) {
        syncTriggeredRef.current = true
        const autoSync = async () => {
          try {
            console.log('🔄 Auto-syncing subscription status...', { showSuccess, tier: subscription?.subscriptionTier })
            setLoading(true)
            
            // Use verify endpoint which is more reliable
            const verifyResponse = await fetch('/api/stripe/verify-subscription')
            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json()
              console.log('Auto-sync verify result:', verifyData)
              
              if (verifyData.updated || verifyData.subscriptionTier === 'premium') {
                // Trigger a refresh in other components
                localStorage.setItem('subscription-updated', Date.now().toString())
                window.dispatchEvent(new StorageEvent('storage', {
                  key: 'subscription-updated',
                  newValue: Date.now().toString()
                }))
                
                // Refresh subscription data multiple times to ensure it updates
                await fetchSubscription()
                setTimeout(() => fetchSubscription(), 1000)
                setTimeout(() => fetchSubscription(), 3000)
                
                // If we found premium status and local state still says free, refetch subscription instead of full reload
                if (verifyData.subscriptionTier === 'premium' && subscription?.subscriptionTier === 'free') {
                  await fetchSubscription()
                }
              }
            }
          } catch (error) {
            console.error('Error auto-syncing subscription:', error)
          } finally {
            setLoading(false)
          }
        }
        autoSync()
      }
    }
  }, [showSuccess, session?.user, loading, subscription?.subscriptionTier, searchParams])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription')
      
      if (response.ok) {
        const data = await response.json()
        // Convert API response to expected format (handle both old and new)
        const subscriptionData: SubscriptionData = {
          subscriptionTier: data.subscriptionTier || data.tier || 'free',
          subscriptionStatus: data.subscriptionStatus || data.status || 'inactive',
          subscriptionStartDate: data.subscriptionStartDate || data.currentPeriodStart,
          subscriptionEndDate: data.subscriptionEndDate || data.currentPeriodEnd,
          trialEndDate: data.trialEndDate || data.trialEnd
        }
        console.log('📋 Pricing page subscription data:', subscriptionData)
        setSubscription(subscriptionData)
      } else {
        console.error('Failed to fetch subscription:', response.status)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
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
      console.log('Opening customer portal for user:', session?.user?.email)
      
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()
      console.log('Portal response:', data)

      if (response.ok && data.portalUrl) {
        // Redirect to Stripe customer portal
        window.location.href = data.portalUrl
      } else {
        console.error('Error creating portal session:', data.error)
        // More specific error messages
        if (data.error === 'No customer found') {
          alert('No Stripe customer found. Please contact support or try subscribing again.')
        } else if (data.error === 'Payment processing is not configured') {
          alert('Payment system is not configured. Please try again later.')
        } else {
          alert(`Failed to open billing portal: ${data.error}`)
        }
      }
    } catch (error) {
      console.error('Error opening portal:', error)
      alert('Failed to open billing portal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncSubscription = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stripe/sync-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (response.ok) {
        console.log('Sync result:', data)
        
        // Trigger a refresh in other components
        localStorage.setItem('subscription-updated', Date.now().toString())
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'subscription-updated',
          newValue: Date.now().toString()
        }))
        
        // Refresh subscription data
        await fetchSubscription()
      } else {
        console.error('Error syncing subscription:', data.error)
        alert('Failed to sync subscription. Please try again.')
      }
    } catch (error) {
      console.error('Error syncing subscription:', error)
      alert('Failed to sync subscription. Please try again.')
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
      
      <div className="container mx-auto px-6 py-16">
        {/* Success/Cancel Messages */}
        {showSuccess && (
          <div className="max-w-md mx-auto mb-8 p-6 bg-green-500/20 border border-green-500/30 rounded-lg backdrop-blur-sm">
            <h3 className="text-green-600 dark:text-green-400 font-semibold mb-2">🎉 Welcome to Premium!</h3>
            <p className="text-green-700 dark:text-green-300 text-sm">
              Your 7-day free trial has started. Enjoy unlimited access to all premium features!
            </p>
            <div className="mt-4">
              <Link href="/dashboard" className="inline-block text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 underline text-sm">
                Return to Dashboard →
              </Link>
            </div>
          </div>
        )}

        {showCanceled && (
          <div className="max-w-md mx-auto mb-8 p-6 bg-yellow-500/20 border border-yellow-500/30 rounded-lg backdrop-blur-sm">
            <h3 className="text-yellow-600 dark:text-yellow-400 font-semibold mb-2">Checkout Canceled</h3>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              No worries! You can upgrade anytime to unlock premium features.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent mb-6 leading-relaxed">
            Upgrade to Premium
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Unlock access to premium credit cards and advanced optimization features
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Free Plan */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free</h3>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">$0</div>
              <div className="text-gray-600 dark:text-gray-400">Forever</div>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <div className="bg-green-500 rounded-full p-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300">No-annual-fee credit cards</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-green-500 rounded-full p-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300">Cashback optimization</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-green-500 rounded-full p-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300">Basic subcategories</span>
              </div>
            </div>
            
            <Link href="/dashboard">
              <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white">
                Continue with Free
              </Button>
            </Link>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </div>
            
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <div className="text-4xl font-bold mb-1">$9.99</div>
              <div className="text-blue-100">per month</div>
              <div className="text-sm text-blue-100 mt-2">7-day free trial</div>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded-full p-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>All free features</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded-full p-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Premium annual fee cards</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded-full p-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Points & travel optimization</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded-full p-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Multi-card strategies</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded-full p-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Advanced benefit customization</span>
              </div>
            </div>
            
            {isPremium ? (
              <div className="space-y-4">
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
                  <div className="text-green-300 font-semibold">✅ Active Premium</div>
                  <div className="text-green-200 text-sm">
                    {subscription?.subscriptionStatus === 'trialing' ? 'Free trial active' : 'Full access enabled'}
                  </div>
                </div>
                <Button 
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30"
                >
                  Manage Subscription
                </Button>
              </div>
            ) : (
              <CheckoutButton className="w-full">
                Start 7-Day Free Trial
              </CheckoutButton>
            )}
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center">
          <Link href="/dashboard">
            <button className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 text-gray-900 dark:text-white px-8 py-3 rounded-full font-semibold shadow-lg transform hover:scale-105 transition-all duration-200">
              ← Back to Dashboard
            </button>
          </Link>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What's the difference between free and premium cards?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Free tier includes no-annual-fee cards like Chase Freedom Unlimited and Citi Double Cash. Premium unlocks cards like Chase Sapphire, Amex Gold/Platinum, and Capital One Venture X.
              </p>
            </div>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Yes! You can cancel your subscription at any time. You'll retain premium access until the end of your billing period.
              </p>
            </div>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                How does the 7-day free trial work?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                You get full access to all premium features for 7 days. If you don't cancel before the trial ends, you'll be charged $9.99/month.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Debug Component (development only) */}
      {/* <DebugCustomerInfo /> */}
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PricingContent />
    </Suspense>
  )
} 