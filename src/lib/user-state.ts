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
  private currentEmail?: string // Store current email for sync operations
  
  constructor() {
    // Only add event listeners in browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.state.isOnline = true
        this.retryCount = 0
        this.notifyListeners()
        this.syncWithServer(this.currentEmail)
      })
      
      window.addEventListener('offline', () => {
        this.state.isOnline = false
        this.notifyListeners()
      })
    }
  }

  // CRITICAL: Enhanced preference loading with authentication check
  async loadPreferences(email?: string): Promise<UserPreferences> {
    this.state.isLoading = true
    this.notifyListeners()
    
    // If no email provided, skip API call and use localStorage only
    if (!email) {
      console.log('📂 UserState: No email provided, using localStorage only')
      this.state.isLoading = false
      this.notifyListeners()
      return this.loadFromLocalStorage()
    }
    
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
      } else if (response.status === 401) {
        console.log('🔓 UserState: Not authenticated, using localStorage only')
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

  // CRITICAL: Enhanced preference saving with authentication check
  async savePreferences(preferences: Partial<UserPreferences>): Promise<boolean> {
    // Update local state immediately for responsive UI
    Object.assign(this.state, preferences)
    this.state.lastUpdated = Date.now()
    this.saveToLocalStorage()
    this.notifyListeners()
    
    console.log('💾 UserState: Preferences updated locally:', preferences)
    
    // Skip API call if user is not authenticated
    if (!this.currentEmail) {
      console.log('🔓 UserState: Not authenticated, preferences saved locally only')
      return true
    }
    
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
        } else if (response.status === 401) {
          console.log('🔓 UserState: Authentication lost, preferences saved locally only')
          return true // Return true since local save succeeded
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
    return true // Return true since local save succeeded
  }

  // Enhanced subscription loading with improved fallback mechanisms
  async loadSubscriptionTier(email?: string): Promise<'free' | 'premium'> {
    // Skip API call if user is not authenticated
    if (!email) {
      console.log('🔓 UserState: No email provided, defaulting to free tier')
      this.state.subscriptionTier = 'free'
      this.notifyListeners()
      return 'free'
    }
    
    try {
      const response = await fetch('/api/user/subscription')
      
      if (response.ok) {
        const data = await response.json()
        
        // CRITICAL: If API returns a definitive tier (not fallback), use it
        if (!data.fallback && data.tier) {
          this.state.subscriptionTier = data.tier
          this.state.lastUpdated = Date.now()
          this.notifyListeners()
          console.log('✅ UserState: Subscription tier loaded:', data.tier)
          return data.tier
        } else if (data.fallback) {
          // Enhanced fallback logic - check if Stripe verification succeeded
          if (data.stripeVerified && data.tier === 'premium') {
            console.log('🎯 UserState: Database unavailable but Stripe verified premium status')
            this.state.subscriptionTier = 'premium'
            this.state.lastUpdated = Date.now()
            this.notifyListeners()
            return 'premium'
          }
          
          // Check cached premium status for resilience
          const premiumCache = this.getCachedPremiumStatus(email)
          if (premiumCache) {
            console.log('🛡️ UserState: Using cached premium status during database issues')
            this.state.subscriptionTier = 'premium'
            this.notifyListeners()
            return 'premium'
          }
          
          // Use fallback tier if no cached premium status
          console.log('⚠️ UserState: Using fallback tier, no cached premium status')
          this.state.subscriptionTier = data.tier || 'free'
          this.notifyListeners()
          return data.tier || 'free'
        }
      } else if (response.status === 401) {
        // Not authenticated - default to free tier
        console.log('🔓 UserState: Not authenticated, defaulting to free tier')
        this.state.subscriptionTier = 'free'
        this.notifyListeners()
        return 'free'
      } else if (response.status === 503) {
        // Database unavailable - check cached premium status
        const premiumCache = this.getCachedPremiumStatus(email)
        if (premiumCache) {
          console.log('🛡️ UserState: Database unavailable, using cached premium status')
          this.state.subscriptionTier = 'premium'
          this.notifyListeners()
          return 'premium'
        } else {
          console.log('⚠️ UserState: Database unavailable, no cached premium status, defaulting to free')
          this.state.subscriptionTier = 'free'
          this.notifyListeners()
          return 'free'
        }
      }
    } catch (error) {
      console.error('❌ UserState: Error loading subscription:', error)
      
      // Check cached premium status during network errors
      const premiumCache = this.getCachedPremiumStatus(email)
      if (premiumCache) {
        console.log('🛡️ UserState: Network error, using cached premium status')
        this.state.subscriptionTier = 'premium'
        this.notifyListeners()
        return 'premium'
      }
    }

    // Default to free tier
    console.log('🔄 UserState: Defaulting to free tier')
    this.state.subscriptionTier = 'free'
    this.notifyListeners()
    return 'free'
  }

  // Helper method to check cached premium status
  private getCachedPremiumStatus(email: string): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      const cached = localStorage.getItem('premiumStatusCache')
      if (cached) {
        const cacheData = JSON.parse(cached)
        const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000) // 4 hour cache validity
        
        // Check if cache is valid and for the same user
        if (cacheData.tier === 'premium' && 
            cacheData.email === email && 
            cacheData.cachedAt > fourHoursAgo) {
          console.log('📋 UserState: Found valid cached premium status')
          return true
        } else if (cacheData.cachedAt <= fourHoursAgo) {
          console.log('⏰ UserState: Cached premium status expired, clearing')
          localStorage.removeItem('premiumStatusCache')
        }
      }
    } catch (error) {
      console.warn('⚠️ UserState: Error reading premium cache:', error)
    }
    
    return false
  }

  // Enhanced local storage operations with premium status caching
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
      
      // Enhanced premium status caching for resilience
      if (this.state.subscriptionTier === 'premium') {
        localStorage.setItem('premiumStatusCache', JSON.stringify({
          tier: 'premium',
          cachedAt: Date.now(),
          email: this.currentEmail
        }))
        console.log('🛡️ UserState: Cached premium status for resilience')
      } else if (this.state.subscriptionTier === 'free') {
        // Only clear premium cache if we have a definitive 'free' status
        localStorage.removeItem('premiumStatusCache')
      }
      
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
  private async syncWithServer(email?: string): Promise<void> {
    if (!this.state.isOnline) return

    try {
      await this.loadPreferences(email)
      await this.loadSubscriptionTier(email)
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
    
    // Store email for future sync operations
    this.currentEmail = email
    
    // Load preferences first
    await this.loadPreferences(email)
    
    // Only load subscription tier if user is authenticated
    if (email) {
      await this.loadSubscriptionTier(email)
    } else {
      console.log('🔓 UserState: No email provided, skipping subscription check')
      this.state.subscriptionTier = 'free'
      this.notifyListeners()
    }
    
    console.log('✅ UserState: Initialized with state:', this.getState())
  }
}

// Export singleton instance and types
export const userState = new UserStateManager()
export type { UserPreferences, UserStateData } 