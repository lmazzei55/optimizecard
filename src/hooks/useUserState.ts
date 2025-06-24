'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { userState, type UserStateData, type UserPreferences } from '../lib/user-state'

export function useUserState() {
  const { data: session, status } = useSession()
  const [state, setState] = useState<UserStateData>(userState.getState())
  const [isInitialized, setIsInitialized] = useState(false)

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = userState.subscribe(setState)
    return unsubscribe
  }, [])

  // Initialize state when session is ready
  useEffect(() => {
    if (status === 'loading') return // Wait for session to load

    const initializeState = async () => {
      console.log('🚀 Initializing user state, authenticated:', !!session?.user?.email)
      await userState.initialize(session?.user?.email || undefined)
      setIsInitialized(true)
    }

    if (!isInitialized) {
      initializeState()
    }
  }, [session, status, isInitialized])

  // One-time fix: Reset subcategories default to false
  useEffect(() => {
    const hasResetSubcategories = localStorage.getItem('subcategoriesDefaultReset_v3')
    if (!hasResetSubcategories && isInitialized) {
      console.log('🔧 Forcing subcategories default to false (v3)')
      // Force reset to false regardless of current value
      userState.updatePreferences({ enableSubCategories: false })
      localStorage.setItem('subcategoriesDefaultReset_v3', 'true')
      console.log('✅ Reset subcategories default to false (v3)')
    }
  }, [isInitialized])

  // Helper functions for components
  const updateRewardPreference = async (newPreference: 'cashback' | 'points' | 'best_overall') => {
    // Check if user can access premium features
    if ((newPreference === 'points' || newPreference === 'best_overall') && state.subscriptionTier !== 'premium') {
      console.warn('❌ Premium subscription required for:', newPreference)
      return { success: false, requiresUpgrade: true }
    }

    userState.updatePreferences({ rewardPreference: newPreference })
    return { success: true, requiresUpgrade: false }
  }

  const updatePointValue = async (newValue: number) => {
    if (newValue < 0.005 || newValue > 0.05) {
      console.error('❌ Invalid point value:', newValue)
      return false
    }

    userState.updatePreferences({ pointValue: newValue })
    return true
  }

  const updateSubcategoryPreference = async (enabled: boolean) => {
    userState.updatePreferences({ enableSubCategories: enabled })
    return true
  }

  const refreshState = async () => {
    console.log('🔄 Manually refreshing user state')
    await userState.initialize(session?.user?.email || undefined)
  }

  const validatePreferenceChange = (newPreference: 'cashback' | 'points' | 'best_overall') => {
    if ((newPreference === 'points' || newPreference === 'best_overall') && state.subscriptionTier !== 'premium') {
      return { allowed: false, requiresUpgrade: true }
    }
    return { allowed: true, requiresUpgrade: false }
  }

  return {
    // State - using the new structure
    preferences: {
      rewardPreference: state.rewardPreference,
      pointValue: state.pointValue,
      enableSubCategories: state.enableSubCategories
    },
    subscriptionTier: state.subscriptionTier,
    ownedCardIds: [], // This will be handled separately
    isLoading: state.isLoading || !isInitialized,
    lastSyncTime: state.lastUpdated,

    // Computed values
    isAuthenticated: !!session?.user?.email,
    canAccessPremium: state.subscriptionTier === 'premium',

    // Actions
    updateRewardPreference,
    updatePointValue,
    updateSubcategoryPreference,
    updateSubscriptionTier: async (tier: 'free' | 'premium') => {
      // This would typically be handled by webhook/admin
      console.log('Subscription tier update requested:', tier)
      return true
    },
    refreshState,

    // Validation
    validatePreferenceChange,

    // New methods from UserStateManager
    updatePreferences: (prefs: Partial<UserPreferences>) => {
      userState.updatePreferences(prefs)
    }
  }
} 