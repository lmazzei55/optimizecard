'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  getUserState,
  loadUserState,
  updatePreferences,
  updateSubscriptionTier,
  subscribeToUserState,
  validatePreferenceChange,
  canAccessPremiumFeatures,
  type UserState,
  type UserPreferences
} from '@/lib/user-state'

export function useUserState() {
  const { data: session, status } = useSession()
  const [state, setState] = useState<UserState>(getUserState())
  const [isInitialized, setIsInitialized] = useState(false)

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = subscribeToUserState(setState)
    return unsubscribe
  }, [])

  // Initialize state when session is ready
  useEffect(() => {
    if (status === 'loading') return // Wait for session to load

    const initializeState = async () => {
      console.log('🚀 Initializing user state, authenticated:', !!session?.user?.email)
      await loadUserState(session)
      setIsInitialized(true)
    }

    if (!isInitialized) {
      initializeState()
    }
  }, [session, status, isInitialized])

  // Helper functions for components
  const updateRewardPreference = async (newPreference: 'cashback' | 'points' | 'best_overall') => {
    const validation = validatePreferenceChange(newPreference)
    
    if (!validation.allowed) {
      console.warn('❌ Preference change not allowed:', newPreference)
      return { success: false, requiresUpgrade: validation.requiresUpgrade }
    }

    const success = await updatePreferences({ rewardPreference: newPreference }, session)
    return { success, requiresUpgrade: false }
  }

  const updatePointValue = async (newValue: number) => {
    if (newValue < 0.005 || newValue > 0.05) {
      console.error('❌ Invalid point value:', newValue)
      return false
    }

    return await updatePreferences({ pointValue: newValue }, session)
  }

  const updateSubcategoryPreference = async (enabled: boolean) => {
    return await updatePreferences({ enableSubCategories: enabled }, session)
  }

  const refreshState = async () => {
    console.log('🔄 Manually refreshing user state')
    await loadUserState(session)
  }

  return {
    // State
    preferences: state.preferences,
    subscriptionTier: state.subscriptionTier,
    ownedCardIds: state.ownedCardIds,
    isLoading: state.isLoading || !isInitialized,
    lastSyncTime: state.lastSyncTime,

    // Computed values
    isAuthenticated: !!session?.user?.email,
    canAccessPremium: canAccessPremiumFeatures(),

    // Actions
    updateRewardPreference,
    updatePointValue,
    updateSubcategoryPreference,
    updateSubscriptionTier,
    refreshState,

    // Validation
    validatePreferenceChange
  }
} 