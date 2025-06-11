// Global warmup state manager to prevent unnecessary API calls across navigation
class WarmupManager {
  private static instance: WarmupManager
  private warmupState: {
    isWarmed: boolean
    lastWarmupTime: number
    warmupPromise: Promise<boolean> | null
  } = {
    isWarmed: false,
    lastWarmupTime: 0,
    warmupPromise: null
  }

  private constructor() {}

  static getInstance(): WarmupManager {
    if (!WarmupManager.instance) {
      WarmupManager.instance = new WarmupManager()
    }
    return WarmupManager.instance
  }

  // Check if system is already warmed up (within last 5 minutes)
  isSystemWarmed(): boolean {
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000
    return this.warmupState.isWarmed && (now - this.warmupState.lastWarmupTime) < fiveMinutes
  }

  // Get current warmup promise if one is in progress
  getCurrentWarmupPromise(): Promise<boolean> | null {
    return this.warmupState.warmupPromise
  }

  // Perform warmup if needed
  async warmupIfNeeded(): Promise<boolean> {
    // If already warmed up recently, return immediately
    if (this.isSystemWarmed()) {
      console.log('🔥 System already warmed up, skipping warmup')
      return true
    }

    // If warmup is already in progress, return the existing promise
    if (this.warmupState.warmupPromise) {
      console.log('⏳ Warmup already in progress, waiting for completion')
      return this.warmupState.warmupPromise
    }

    // Start new warmup
    console.log('🚀 Starting system warmup...')
    this.warmupState.warmupPromise = this.performWarmup()
    
    try {
      const result = await this.warmupState.warmupPromise
      this.warmupState.isWarmed = result
      this.warmupState.lastWarmupTime = Date.now()
      return result
    } finally {
      this.warmupState.warmupPromise = null
    }
  }

  private async performWarmup(): Promise<boolean> {
    const WARMUP_TIMEOUT = 20000 // 20 seconds timeout
    
    try {
      console.log('🔥 Starting warmup with 20s timeout...')
      
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.warn('⏰ Warmup timeout reached, aborting...')
        controller.abort()
      }, WARMUP_TIMEOUT)

      const response = await fetch('/api/warmup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Warmup completed successfully:', data)
        
        // Even if some operations failed, consider it successful if we got a response
        if (data.status === 'success' || data.status === 'partial') {
          return true
        } else {
          console.warn('⚠️ Warmup completed but with issues:', data)
          return false
        }
      } else if (response.status === 207) {
        // Multi-status (partial success)
        const data = await response.json()
        console.log('⚠️ Warmup partially successful:', data)
        return true // Accept partial success
      } else {
        console.warn('⚠️ Warmup failed with status:', response.status)
        
        // For 503 errors, try a lightweight warmup
        if (response.status === 503) {
          console.log('🔄 Attempting lightweight warmup...')
          return await this.performLightweightWarmup()
        }
        
        return false
      }
    } catch (error: any) {
      console.error('❌ Warmup error:', error)
      
      // If it's a timeout or abort error, try lightweight warmup
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        console.log('🔄 Warmup timed out, attempting lightweight warmup...')
        return await this.performLightweightWarmup()
      }
      
      return false
    }
  }

  // Lightweight warmup that just tests basic connectivity
  private async performLightweightWarmup(): Promise<boolean> {
    try {
      console.log('🚀 Starting lightweight warmup...')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      // Just test the categories endpoint which should be fast
      const response = await fetch('/api/categories', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          console.log('✅ Lightweight warmup successful - categories loaded')
          return true
        }
      }
      
      console.warn('⚠️ Lightweight warmup failed')
      return false
    } catch (error) {
      console.error('❌ Lightweight warmup error:', error)
      return false
    }
  }

  // Force reset warmup state (useful for testing or manual refresh)
  resetWarmupState(): void {
    this.warmupState.isWarmed = false
    this.warmupState.lastWarmupTime = 0
    this.warmupState.warmupPromise = null
    console.log('🔄 Warmup state reset')
  }

  // Get warmup status for UI display
  getWarmupStatus(): {
    isWarmed: boolean
    lastWarmupTime: number
    isInProgress: boolean
  } {
    return {
      isWarmed: this.warmupState.isWarmed,
      lastWarmupTime: this.warmupState.lastWarmupTime,
      isInProgress: this.warmupState.warmupPromise !== null
    }
  }
}

export const warmupManager = WarmupManager.getInstance() 