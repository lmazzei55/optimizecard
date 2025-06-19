'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  loadUserState, 
  getUserState, 
  subscribeToUserState,
  saveUserPreferences,
  saveOwnedCards,
  validatePreferenceChange,
  canAccessPremiumFeatures
} from '@/lib/user-state'

interface UserState {
  preferences: {
    rewardPreference: 'cashback' | 'points' | 'best_overall'
    pointValue: number
    enableSubCategories: boolean
  }
  subscriptionTier: 'free' | 'premium' | null
  ownedCardIds: string[]
  isLoading: boolean
}

export function useUserState() {
  const { data: session, status } = useSession()
  const [state, setState] = useState<UserState>(getUserState())

  // Load user state when session is available
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      console.log('🔄 useUserState: Loading state for user:', session.user.email)
      loadUserState(session.user.email)
    } else if (status === 'unauthenticated') {
      console.log('🔄 useUserState: User unauthenticated, using defaults')
      // Reset to defaults for unauthenticated users
      setState({
        preferences: {
          rewardPreference: 'cashback',
          pointValue: 0.01,
          enableSubCategories: false
        },
        subscriptionTier: 'free',
        ownedCardIds: [],
        isLoading: false
      })
    }
  }, [session?.user?.email, status])

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = subscribeToUserState((newState) => {
      setState(newState)
    })

    return unsubscribe
  }, [])

  // Helper functions
  const updatePreference = async (key: keyof UserState['preferences'], value: any): Promise<boolean> => {
    if (key === 'rewardPreference') {
      const validation = validatePreferenceChange(value)
      if (!validation.allowed) {
        console.warn('🚫 useUserState: Premium feature requires upgrade:', value)
        return false
      }
    }

    const success = await saveUserPreferences({ [key]: value })
    return success
  }

  const updateOwnedCards = async (cardIds: string[]): Promise<boolean> => {
    const success = await saveOwnedCards(cardIds)
    return success
  }

  const canUsePremiumFeatures = (): boolean => {
    return canAccessPremiumFeatures()
  }

  return {
    // State
    ...state,
    isAuthenticated: status === 'authenticated',
    
    // Actions
    updatePreference,
    updateOwnedCards,
    canUsePremiumFeatures,
    
    // Validation
    validatePreferenceChange
  }
} 