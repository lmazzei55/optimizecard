'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface SubscriptionData {
  subscriptionTier: 'free' | 'premium'
  subscriptionStatus: string
  subscriptionStartDate?: Date | null
  subscriptionEndDate?: Date | null
  trialEndDate?: Date | null
  customerId?: string | null
}

// Enhanced subscription hook with database fallback handling
export function useSubscription() {
  const { data: session, status } = useSession()
  const [subscription, setSubscription] = useState<SubscriptionData>({
    subscriptionTier: 'free',
    subscriptionStatus: 'active',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSubscription() {
      if (status === 'loading') return
      
      if (!session?.user?.email) {
        setLoading(false)
        return
      }

      try {
        // First, try to get cached subscription data
        const response = await fetch('/api/user/subscription')
        if (!response.ok) {
          throw new Error('Failed to fetch subscription')
        }

        const data = await response.json()
        
        // Check if this is a database fallback response
        if (data.fallback) {
          console.log('⚠️ Database temporarily unavailable, using cached subscription data')
          
          // Check localStorage for cached premium status
          const cached = localStorage.getItem('subscriptionTier')
          if (cached === 'premium') {
            console.log('✅ Found cached premium status, using it')
            setSubscription({
              subscriptionTier: 'premium',
              subscriptionStatus: 'active',
              customerId: null
            })
          } else {
            // No cached premium status, use fallback free tier
            setSubscription({
              subscriptionTier: 'free',
              subscriptionStatus: 'active',
              customerId: null
            })
          }
          return
        }
        
        // Enhanced verification logic - check more frequently after recent activity
        const shouldVerify = (
          (data.tier === 'free' && !data.recentlyVerified) || // Original logic
          (data.autoUpgraded) || // If auto-upgraded, verify immediately
          (!data.recentlyVerified && !data.fallback) // If no recent verification at all
        )
        
        if (shouldVerify) {
          console.log('🔍 Verifying subscription status with Stripe...', {
            tier: data.tier,
            recentlyVerified: data.recentlyVerified,
            autoUpgraded: data.autoUpgraded
          })
          
          try {
            const verifyResponse = await fetch('/api/stripe/verify-subscription')
            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json()
              
              if (verifyData.subscriptionTier !== data.tier || verifyData.updated) {
                console.log('✅ Subscription status updated!', {
                  from: data.tier,
                  to: verifyData.subscriptionTier,
                  updated: verifyData.updated
                })
                
                // Cache the premium status
                if (verifyData.subscriptionTier === 'premium') {
                  localStorage.setItem('subscriptionTier', 'premium')
                } else {
                  localStorage.removeItem('subscriptionTier')
                }
                
                // Update the subscription data with verified status
                setSubscription({
                  subscriptionTier: verifyData.subscriptionTier,
                  subscriptionStatus: verifyData.subscriptionStatus || 'active',
                  subscriptionStartDate: verifyData.subscriptionStartDate,
                  subscriptionEndDate: verifyData.subscriptionEndDate,
                  trialEndDate: verifyData.trialEndDate,
                  customerId: verifyData.customerId
                })
                
                // Force a reload if database was updated
                if (verifyData.updated) {
                  console.log('🔄 Reloading to sync all components...')
                  window.location.reload()
                }
                return
              }
            }
          } catch (verifyError) {
            console.error('Failed to verify with Stripe:', verifyError)
          }
        }
        
        // Cache the subscription tier for future fallback use
        if (data.tier === 'premium') {
          localStorage.setItem('subscriptionTier', 'premium')
        } else {
          localStorage.removeItem('subscriptionTier')
        }
        
        setSubscription({
          subscriptionTier: data.tier || 'free',
          subscriptionStatus: data.status || 'active',
          subscriptionStartDate: data.subscriptionStartDate,
          subscriptionEndDate: data.subscriptionEndDate,
          trialEndDate: data.trialEndDate,
          customerId: data.customerId
        })
      } catch (err) {
        console.error('Subscription fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load subscription')
        
        // On error, check localStorage for cached data
        const cached = localStorage.getItem('subscriptionTier')
        if (cached === 'premium') {
          console.log('✅ Using cached premium status due to fetch error')
          setSubscription(prev => ({ ...prev, subscriptionTier: 'premium' }))
        }
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [session, status])

  // Helper function to manually sync subscription
  const syncSubscription = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stripe/sync-subscription', {
        method: 'POST'
      })
      
      if (!response.ok) {
        // If sync fails, try verify endpoint
        const verifyResponse = await fetch('/api/stripe/verify-subscription')
        if (verifyResponse.ok) {
          const data = await verifyResponse.json()
          if (data.updated) {
            window.location.reload()
          }
        }
      } else {
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to sync subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    ...subscription,
    loading,
    error,
    isPremium: subscription.subscriptionTier === 'premium',
    syncSubscription
  }
} 