'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface SubscriptionData {
  tier: 'free' | 'premium'
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  currentPeriodEnd?: string
  currentPeriodStart?: string
  trialEnd?: string
  autoCreated?: boolean
  fallback?: boolean
}

interface UseSubscriptionReturn {
  subscription: SubscriptionData | null
  loading: boolean
  error: string | null
  isPremium: boolean
  isAuthenticated: boolean
  refreshSubscription: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const { data: session, status } = useSession()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = async () => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      setSubscription(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/user/subscription')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch subscription')
      }
      
      // Handle fallback responses gracefully
      if (data.fallback) {
        console.warn('⚠️ Using fallback subscription data:', data)
        setError(data.error || 'Database temporarily unavailable')
        // For fallback, try to get subscription from localStorage or user state
        const cachedSubscription = localStorage.getItem('subscriptionTier')
        if (cachedSubscription === 'premium') {
          console.log('🔄 Using cached premium subscription from localStorage')
          setSubscription({ 
            tier: 'premium', 
            status: 'active',
            fallback: true 
          })
          return
        }
      }
      
      setSubscription(data)
    } catch (err: any) {
      console.error('Subscription fetch error:', err)
      setError(err.message)
      // Fallback to free tier for unauthenticated errors
      setSubscription({ tier: 'free', status: 'active' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [status, session])

  const isPremium = subscription?.tier === 'premium' && 
                   (subscription?.status === 'active' || subscription?.status === 'trialing')
  
  const isAuthenticated = status === 'authenticated'

  return {
    subscription,
    loading,
    error,
    isPremium,
    isAuthenticated,
    refreshSubscription: fetchSubscription
  }
} 