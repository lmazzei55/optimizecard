interface UserPreferences {
  rewardPreference: 'cashback' | 'points' | 'best_overall'
  pointValue: number
  enableSubCategories: boolean
}

interface UserStateData extends UserPreferences {
  subscriptionTier: 'free' | 'premium' | null
  lastUpdated: number
  isOnline: boolean
  isLoading: boolean
}

class UserStateManager {
  private state: UserStateData = {
    rewardPreference: 'cashback',
    pointValue: 0.01,
    enableSubCategories: false,
    subscriptionTier: null,
    lastUpdated: 0,
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    isLoading: false
  }
  
  private listeners: Set<(state: UserStateData) => void> = new Set()
  private retryCount = 0
  private maxRetries = 3
  private retryDelay = 2000
  
  constructor() {
    // Only add event listeners in browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.state.isOnline = true
        this.retryCount = 0
        this.notifyListeners()
        this.syncWithServer()
      })
      
      window.addEventListener('offline', () => {
        this.state.isOnline = false
        this.notifyListeners()
      })
    }
  }

  // CRITICAL: Enhanced preference loading with fallback strategy
  async loadPreferences(email?: string): Promise<UserPreferences> {
    this.state.isLoading = true
    this.notifyListeners()
    
    try {
      const response = await fetch('/api/user/preferences')
      
      if (response.ok) {
        const data = await response.json()
        
        // CRITICAL: Only update state if we got real data (not fallback)
        if (!data.fallback) {
          this.state.rewardPreference = data.rewardPreference
          this.state.pointValue = data.pointValue
          this.state.enableSubCategories = data.enableSubCategories
          this.state.lastUpdated = Date.now()
          this.retryCount = 0
          
          this.saveToLocalStorage()
          this.notifyListeners()
          
          console.log('✅ UserState: Loaded fresh preferences from API:', data)
          return data
        } else {
          console.warn('⚠️ UserState: API returned fallback data, using cached/localStorage')
        }
      } else if (response.status === 503) {
        console.warn('⚠️ UserState: Database temporarily unavailable, using cached data')
      } else {
        console.error('❌ UserState: API error:', response.status)
      }
    } catch (error) {
      console.error('❌ UserState: Network error loading preferences:', error)
    } finally {
      this.state.isLoading = false
      this.notifyListeners()
    }

    return this.loadFromLocalStorage()
  }

  // CRITICAL: Enhanced preference saving with retry logic
  async savePreferences(preferences: Partial<UserPreferences>): Promise<boolean> {
    // Update local state immediately for responsive UI
    Object.assign(this.state, preferences)
    this.state.lastUpdated = Date.now()
    this.saveToLocalStorage()
    this.notifyListeners()
    
    console.log('💾 UserState: Preferences updated locally:', preferences)
    
    // If offline, just save locally and return
    if (!this.state.isOnline) {
      console.log('📴 UserState: Offline, preferences saved locally only')
      return true
    }

    // Try to save to server with retry logic
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch('/api/user/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(preferences),
        })

        if (response.ok) {
          console.log('✅ UserState: Preferences saved to server successfully')
          this.retryCount = 0
          return true
        } else if (response.status === 503) {
          console.warn(`⚠️ UserState: Database unavailable (attempt ${attempt}/${this.maxRetries})`)
          if (attempt < this.maxRetries) {
            await this.delay(this.retryDelay * attempt)
            continue
          }
        } else if (response.status === 403) {
          console.error('❌ UserState: Premium subscription required')
          return false
        } else {
          console.error('❌ UserState: Server error:', response.status)
          return false
        }
      } catch (error) {
        console.error(`❌ UserState: Network error (attempt ${attempt}/${this.maxRetries}):`, error)
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt)
          continue
        }
      }
    }

    console.warn('⚠️ UserState: Failed to save to server after retries, kept local changes')
    return false
  }

  // CRITICAL: Enhanced subscription loading with premium status protection
  async loadSubscriptionTier(): Promise<'free' | 'premium'> {
    try {
      const response = await fetch('/api/user/subscription')
      
      if (response.ok) {
        const data = await response.json()
        
        // CRITICAL: Protect premium status - don't downgrade due to temporary issues
        if (data.tier === 'premium' || (!data.fallback && data.tier)) {
          this.state.subscriptionTier = data.tier
          this.notifyListeners()
          console.log('✅ UserState: Subscription tier loaded:', data.tier)
          return data.tier
        } else if (data.fallback) {
          // If it's a fallback response, keep current tier if it's premium
          if (this.state.subscriptionTier === 'premium') {
            console.log('🛡️ UserState: Protecting premium status during database issues')
            return 'premium'
          }
        }
      } else if (response.status === 503) {
        // Database unavailable - protect premium status
        if (this.state.subscriptionTier === 'premium') {
          console.log('🛡️ UserState: Database unavailable, protecting premium status')
          return 'premium'
        }
      }
    } catch (error) {
      console.error('❌ UserState: Error loading subscription:', error)
      // Protect premium status during network issues
      if (this.state.subscriptionTier === 'premium') {
        console.log('🛡️ UserState: Network error, protecting premium status')
        return 'premium'
      }
    }

    // Default to free only if we've never detected premium
    const defaultTier = this.state.subscriptionTier || 'free'
    this.state.subscriptionTier = defaultTier
    this.notifyListeners()
    return defaultTier
  }

  // Enhanced local storage operations
  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') return
    
    try {
      const dataToSave = {
        rewardPreference: this.state.rewardPreference,
        pointValue: this.state.pointValue,
        enableSubCategories: this.state.enableSubCategories,
        subscriptionTier: this.state.subscriptionTier,
        lastUpdated: this.state.lastUpdated
      }
      localStorage.setItem('userState', JSON.stringify(dataToSave))
      
      // Also save individual items for backward compatibility
      localStorage.setItem('rewardPreference', this.state.rewardPreference)
      localStorage.setItem('pointValue', this.state.pointValue.toString())
      localStorage.setItem('enableSubCategories', JSON.stringify(this.state.enableSubCategories))
      
      console.log('💾 UserState: Saved to localStorage:', dataToSave)
    } catch (error) {
      console.warn('⚠️ UserState: Failed to save to localStorage:', error)
    }
  }

  private loadFromLocalStorage(): UserPreferences {
    if (typeof window === 'undefined') {
      return {
        rewardPreference: 'cashback',
        pointValue: 0.01,
        enableSubCategories: false
      }
    }
    
    try {
      const saved = localStorage.getItem('userState')
      if (saved) {
        const data = JSON.parse(saved)
        
        // Update state with saved data
        this.state.rewardPreference = data.rewardPreference || 'cashback'
        this.state.pointValue = data.pointValue || 0.01
        this.state.enableSubCategories = data.enableSubCategories || false
        this.state.subscriptionTier = data.subscriptionTier || this.state.subscriptionTier
        this.state.lastUpdated = data.lastUpdated || 0
        
        console.log('📂 UserState: Loaded from localStorage:', data)
        this.notifyListeners()
        
        return {
          rewardPreference: this.state.rewardPreference,
          pointValue: this.state.pointValue,
          enableSubCategories: this.state.enableSubCategories
        }
      }
    } catch (error) {
      console.warn('⚠️ UserState: Failed to load from localStorage:', error)
    }

    // Return defaults if localStorage failed
    return {
      rewardPreference: 'cashback',
      pointValue: 0.01,
      enableSubCategories: false
    }
  }

  // Sync with server when connection is restored
  private async syncWithServer(): Promise<void> {
    if (!this.state.isOnline) return

    try {
      await this.loadPreferences()
      await this.loadSubscriptionTier()
      console.log('🔄 UserState: Synced with server after reconnection')
    } catch (error) {
      console.warn('⚠️ UserState: Failed to sync with server:', error)
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.state })
      } catch (error) {
        console.error('❌ UserState: Error in listener:', error)
      }
    })
  }

  // Public API methods
  updatePreferences(preferences: Partial<UserPreferences>): void {
    this.savePreferences(preferences)
  }

  getState(): UserStateData {
    return { ...this.state }
  }

  subscribe(listener: (state: UserStateData) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Initialize the state manager
  async initialize(email?: string): Promise<void> {
    console.log('🚀 UserState: Initializing...')
    
    // Load preferences and subscription tier in parallel
    await Promise.all([
      this.loadPreferences(email),
      this.loadSubscriptionTier()
    ])
    
    console.log('✅ UserState: Initialized with state:', this.getState())
  }
}

// Export singleton instance and types
export const userState = new UserStateManager()
export type { UserPreferences, UserStateData } 