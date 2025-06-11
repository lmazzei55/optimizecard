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
    try {
      const response = await fetch('/api/warmup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Warmup completed successfully:', data)
        return true
      } else {
        console.warn('⚠️ Warmup failed with status:', response.status)
        return false
      }
    } catch (error) {
      console.error('❌ Warmup error:', error)
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