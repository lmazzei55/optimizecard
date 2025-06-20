// Centralized User State Management
// This eliminates all conflicts between localStorage, session, and database

export interface UserPreferences {
  rewardPreference: 'cashback' | 'points' | 'best_overall'
  pointValue: number
  enableSubCategories: boolean
}

export interface UserState {
  preferences: UserPreferences
  subscriptionTier: 'free' | 'premium' | null
  ownedCardIds: string[]
  isLoading: boolean
  lastSyncTime: number
}

// Global state - single source of truth
let userState: UserState = {
  preferences: {
    rewardPreference: 'cashback',
    pointValue: 0.01,
    enableSubCategories: false
  },
  subscriptionTier: null,
  ownedCardIds: [],
  isLoading: false,
  lastSyncTime: 0
}

// Event system for state changes
type StateListener = (state: UserState) => void
const listeners: StateListener[] = []

export function subscribeToUserState(listener: StateListener): () => void {
  listeners.push(listener)
  return () => {
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }
}

function notifyListeners() {
  listeners.forEach(listener => listener({ ...userState }))
}

// Core state management functions
export function getUserState(): UserState {
  return { ...userState }
}

export function getPreferences(): UserPreferences {
  return { ...userState.preferences }
}

export function getSubscriptionTier(): 'free' | 'premium' | null {
  return userState.subscriptionTier
}

export function canAccessPremiumFeatures(): boolean {
  return userState.subscriptionTier === 'premium'
}

// CRITICAL: Single function to load state from all sources with proper priority
export async function loadUserState(session?: any): Promise<UserState> {
  console.log('🔄 Loading user state with session:', !!session?.user?.email)
  
  userState.isLoading = true
  notifyListeners()

  try {
    if (session?.user?.email) {
      // AUTHENTICATED USER: Database is source of truth
      console.log('👤 Authenticated user - loading from database')
      
      // Load preferences from database
      const prefsResponse = await fetch('/api/user/preferences', {
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (prefsResponse.ok) {
        const prefs = await prefsResponse.json()
        userState.preferences = {
          rewardPreference: prefs.rewardPreference || 'cashback',
          pointValue: prefs.pointValue || 0.01,
          enableSubCategories: prefs.enableSubCategories || false
        }
        console.log('✅ Loaded preferences from database:', userState.preferences)
      } else {
        console.warn('⚠️ Failed to load preferences from database, using defaults')
      }

      // Load subscription tier
      const subResponse = await fetch('/api/user/subscription', {
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (subResponse.ok) {
        const sub = await subResponse.json()
        userState.subscriptionTier = sub.tier || 'free'
        console.log('✅ Loaded subscription tier:', userState.subscriptionTier)
      } else {
        userState.subscriptionTier = 'free'
        console.warn('⚠️ Failed to load subscription tier, defaulting to free')
      }

      // Load owned cards
      const cardsResponse = await fetch('/api/user/cards')
      if (cardsResponse.ok) {
        const cards = await cardsResponse.json()
        userState.ownedCardIds = cards.ownedCardIds || []
        console.log('✅ Loaded owned cards:', userState.ownedCardIds.length)
      }

      // Clear any conflicting localStorage data
      localStorage.removeItem('rewardPreference')
      localStorage.removeItem('pointValue')
      localStorage.removeItem('enableSubcategories') // lowercase version
      localStorage.removeItem('enableSubCategories') // camelCase version
      
      // Store clean state in localStorage for offline persistence
      localStorage.setItem('userState', JSON.stringify({
        preferences: userState.preferences,
        subscriptionTier: userState.subscriptionTier,
        timestamp: Date.now()
      }))
      
    } else {
      // ANONYMOUS USER: Use localStorage or defaults
      console.log('👤 Anonymous user - loading from localStorage')
      
      const savedState = localStorage.getItem('userState')
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState)
          // Only use saved state if it's recent (within 1 hour)
          if (Date.now() - parsed.timestamp < 3600000) {
            userState.preferences = parsed.preferences || userState.preferences
            userState.subscriptionTier = 'free' // Anonymous users are always free
            console.log('✅ Loaded state from localStorage:', userState.preferences)
          } else {
            console.log('⏰ Saved state expired, using defaults')
          }
        } catch (error) {
          console.error('❌ Error parsing saved state:', error)
        }
      }
      
      userState.subscriptionTier = 'free'
    }

    userState.lastSyncTime = Date.now()
    userState.isLoading = false
    notifyListeners()
    
    console.log('✅ User state loaded successfully:', {
      preferences: userState.preferences,
      subscriptionTier: userState.subscriptionTier,
      isAuthenticated: !!session?.user?.email
    })
    
    return { ...userState }
    
  } catch (error) {
    console.error('❌ Error loading user state:', error)
    userState.isLoading = false
    notifyListeners()
    return { ...userState }
  }
}

// Update preferences with proper validation and persistence
export async function updatePreferences(
  newPreferences: Partial<UserPreferences>, 
  session?: any
): Promise<boolean> {
  console.log('🔄 Updating preferences:', newPreferences)
  
  // Validate premium features
  if (newPreferences.rewardPreference && 
      ['points', 'best_overall'].includes(newPreferences.rewardPreference) &&
      userState.subscriptionTier !== 'premium') {
    console.error('❌ Premium features require subscription')
    return false
  }

  // Update local state immediately for UI responsiveness
  userState.preferences = { ...userState.preferences, ...newPreferences }
  notifyListeners()

  try {
    if (session?.user?.email) {
      // Save to database for authenticated users
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences)
      })

      if (response.ok) {
        console.log('✅ Preferences saved to database')
        
        // Update localStorage cache
        localStorage.setItem('userState', JSON.stringify({
          preferences: userState.preferences,
          subscriptionTier: userState.subscriptionTier,
          timestamp: Date.now()
        }))
        
        return true
      } else {
        console.error('❌ Failed to save preferences to database')
        return false
      }
    } else {
      // Save to localStorage for anonymous users
      localStorage.setItem('userState', JSON.stringify({
        preferences: userState.preferences,
        subscriptionTier: 'free',
        timestamp: Date.now()
      }))
      console.log('✅ Preferences saved to localStorage')
      return true
    }
  } catch (error) {
    console.error('❌ Error updating preferences:', error)
    return false
  }
}

// Update subscription tier
export function updateSubscriptionTier(tier: 'free' | 'premium'): void {
  userState.subscriptionTier = tier
  notifyListeners()
  
  // Update localStorage cache
  const savedState = localStorage.getItem('userState')
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState)
      parsed.subscriptionTier = tier
      parsed.timestamp = Date.now()
      localStorage.setItem('userState', JSON.stringify(parsed))
    } catch (error) {
      console.error('❌ Error updating subscription tier in localStorage:', error)
    }
  }
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

// Clear all state (for logout)
export function clearUserState(): void {
  userState = {
    preferences: {
      rewardPreference: 'cashback',
      pointValue: 0.01,
      enableSubCategories: false
    },
    subscriptionTier: null,
    ownedCardIds: [],
    isLoading: false,
    lastSyncTime: 0
  }
  
  // Clear all localStorage
  localStorage.removeItem('userState')
  localStorage.removeItem('rewardPreference')
  localStorage.removeItem('pointValue')
  localStorage.removeItem('enableSubcategories')
  localStorage.removeItem('enableSubCategories')
  localStorage.removeItem('preferences-updated')
  
  notifyListeners()
  console.log('🧹 User state cleared')
}

// Force refresh from database (for manual sync)
export async function refreshUserState(session?: any): Promise<void> {
  console.log('🔄 Force refreshing user state')
  await loadUserState(session)
} 