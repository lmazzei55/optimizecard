// Centralized User State Management
// This replaces the complex session/localStorage preference handling

interface UserPreferences {
  rewardPreference: 'cashback' | 'points' | 'best_overall'
  pointValue: number
  enableSubCategories: boolean
}

interface UserState {
  preferences: UserPreferences
  subscriptionTier: 'free' | 'premium' | null
  ownedCardIds: string[]
  isLoading: boolean
}

// Global state
let userState: UserState = {
  preferences: {
    rewardPreference: 'cashback',
    pointValue: 0.01,
    enableSubCategories: false
  },
  subscriptionTier: null,
  ownedCardIds: [],
  isLoading: false
}

// Event system for state changes
type StateListener = (state: UserState) => void
const listeners: StateListener[] = []

export function subscribeToUserState(listener: StateListener) {
  listeners.push(listener)
  return () => {
    const index = listeners.indexOf(listener)
    if (index > -1) listeners.splice(index, 1)
  }
}

function notifyListeners() {
  listeners.forEach(listener => listener({ ...userState }))
}

// Load user state from API (single source of truth)
export async function loadUserState(email?: string): Promise<UserState> {
  if (!email) {
    console.log('🔍 UserState: No email provided, using defaults')
    return userState
  }

  userState.isLoading = true
  notifyListeners()

  try {
    // Load all user data in parallel
    const [preferencesRes, subscriptionRes, cardsRes] = await Promise.all([
      fetch('/api/user/preferences', { headers: { 'Cache-Control': 'no-cache' } }),
      fetch('/api/user/subscription', { headers: { 'Cache-Control': 'no-cache' } }),
      fetch('/api/user/cards', { headers: { 'Cache-Control': 'no-cache' } })
    ])

    // Process preferences
    if (preferencesRes.ok) {
      const prefData = await preferencesRes.json()
      userState.preferences = {
        rewardPreference: prefData.rewardPreference || 'cashback',
        pointValue: prefData.pointValue || 0.01,
        enableSubCategories: prefData.enableSubCategories || false
      }
      console.log('✅ UserState: Preferences loaded:', userState.preferences)
    } else {
      console.warn('⚠️ UserState: Failed to load preferences, using defaults')
    }

    // Process subscription
    if (subscriptionRes.ok) {
      const subData = await subscriptionRes.json()
      userState.subscriptionTier = subData.tier || 'free'
      console.log('✅ UserState: Subscription loaded:', userState.subscriptionTier)
    } else {
      console.warn('⚠️ UserState: Failed to load subscription, defaulting to free')
      userState.subscriptionTier = 'free'
    }

    // Process cards
    if (cardsRes.ok) {
      const cardData = await cardsRes.json()
      userState.ownedCardIds = cardData.ownedCardIds || []
      console.log('✅ UserState: Cards loaded:', userState.ownedCardIds.length, 'owned cards')
    } else {
      console.warn('⚠️ UserState: Failed to load cards')
    }

  } catch (error) {
    console.error('❌ UserState: Error loading state:', error)
    // Use defaults on error
    userState.subscriptionTier = 'free'
  } finally {
    userState.isLoading = false
    notifyListeners()
  }

  return userState
}

// Save preferences to API and update state
export async function saveUserPreferences(preferences: Partial<UserPreferences>): Promise<boolean> {
  try {
    const response = await fetch('/api/user/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences)
    })

    if (response.ok) {
      // Update local state
      userState.preferences = { ...userState.preferences, ...preferences }
      notifyListeners()
      console.log('✅ UserState: Preferences saved:', preferences)
      return true
    } else {
      console.error('❌ UserState: Failed to save preferences, status:', response.status)
      return false
    }
  } catch (error) {
    console.error('❌ UserState: Error saving preferences:', error)
    return false
  }
}

// Save owned cards
export async function saveOwnedCards(ownedCardIds: string[]): Promise<boolean> {
  try {
    const response = await fetch('/api/user/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownedCardIds })
    })

    if (response.ok) {
      userState.ownedCardIds = ownedCardIds
      notifyListeners()
      console.log('✅ UserState: Cards saved:', ownedCardIds.length, 'cards')
      return true
    } else {
      console.error('❌ UserState: Failed to save cards, status:', response.status)
      return false
    }
  } catch (error) {
    console.error('❌ UserState: Error saving cards:', error)
    return false
  }
}

// Get current state (synchronous)
export function getUserState(): UserState {
  return { ...userState }
}

// Check if user can access premium features
export function canAccessPremiumFeatures(): boolean {
  return userState.subscriptionTier === 'premium'
}

// Validate preference change
export function validatePreferenceChange(newPreference: 'cashback' | 'points' | 'best_overall'): {
  allowed: boolean
  requiresUpgrade: boolean
} {
  if (newPreference === 'cashback') {
    return { allowed: true, requiresUpgrade: false }
  }

  const isPremium = canAccessPremiumFeatures()
  return {
    allowed: isPremium,
    requiresUpgrade: !isPremium
  }
} 