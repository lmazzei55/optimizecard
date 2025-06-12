"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { formatCurrency } from "@/lib/utils"
import { CardCustomizationModal } from "@/components/CardCustomizationModal"
import { MultiCardStrategies } from './MultiCardStrategies'
import { UpgradePrompt } from './UpgradePrompt'
import { warmupManager } from '@/lib/warmup-manager'

interface SpendingCategory {
  id: string
  name: string
  description: string
  subCategories?: SubCategory[]
}

interface SubCategory {
  id: string
  name: string
  description: string
  parentCategoryId: string
}

interface UserSpending {
  categoryId?: string
  subCategoryId?: string
  categoryName: string
  monthlySpend: number
}

interface BenefitValuation {
  benefitId: string
  personalValue: number
}

interface CategoryBreakdown {
  categoryName: string
  monthlySpend: number
  rewardRate: number
  monthlyValue: number
  annualValue: number
}

interface BenefitsBreakdown {
  benefitName: string
  officialValue: number
  personalValue: number
  category: string
}

interface SignupBonus {
  amount: number
  requiredSpend: number
  timeframe: number
}

interface CardRecommendation {
  cardId: string
  cardName: string
  issuer: string
  annualFee: number
  rewardType: 'cashback' | 'points'
  applicationUrl?: string
  totalAnnualValue: number
  benefitsValue: number
  netAnnualValue: number
  categoryBreakdown: CategoryBreakdown[]
  benefitsBreakdown: BenefitsBreakdown[]
  signupBonus?: SignupBonus
}

interface CardCustomization {
  pointValue?: number
  benefitValues: Record<string, number>
  enabledBenefits: Record<string, boolean>
}

export function SpendingForm() {
  const { data: session, status, update: updateSession } = useSession()
  const [categories, setCategories] = useState<SpendingCategory[]>([])
  const [spending, setSpending] = useState<UserSpending[]>([])
  const [rewardPreference, setRewardPreference] = useState<'cashback' | 'points' | 'best_overall'>('cashback')
  const [pointValue, setPointValue] = useState(0.01)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [recommendations, setRecommendations] = useState<CardRecommendation[]>([])
  
  // Enhanced error handling
  const [error, setError] = useState<string | null>(null)
  const [isWarming, setIsWarming] = useState(false)
  const [systemReady, setSystemReady] = useState(false)
  
  // Subcategory support
  const [enableSubcategories, setEnableSubcategories] = useState(false)
  
  // Card customization modal state
  const [customizationOpen, setCustomizationOpen] = useState(false)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [cardCustomizations, setCardCustomizations] = useState<{
    [cardId: string]: CardCustomization
  }>({})

  // Upgrade prompt state
  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false)
  const [upgradePromptFeature, setUpgradePromptFeature] = useState('')
  const [upgradePromptDescription, setUpgradePromptDescription] = useState('')
  const [userSubscriptionTier, setUserSubscriptionTier] = useState<'free' | 'premium' | null>(null)

  // Track if we've loaded initial data to prevent conflicts
  const [initialDataLoaded, setInitialDataLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Enhanced warmup system with global state management
  const warmupAPIs = async () => {
    setIsWarming(true)
    setError(null)
    
    try {
      // Use global warmup manager to prevent duplicate warmups
      const isWarmed = await warmupManager.warmupIfNeeded()
      
      if (isWarmed) {
        setSystemReady(true)
        console.log('✅ System is ready for use')
      } else {
        console.warn('⚠️ System warmup failed, but allowing app to continue...')
        // Don't block the app if warmup fails - let users try anyway
        setSystemReady(true) // Set to true to allow functionality
        setError('⚠️ System is starting up. If you experience issues, please wait a moment and try again.')
      }
    } catch (error) {
      console.error('❌ Warmup error:', error)
      // Don't block the app - let users try anyway
      setSystemReady(true)
      setError('⚠️ System is starting up. Some features may be slower than usual.')
    } finally {
      setIsWarming(false)
    }
  }

  // Auto-warmup on component mount (only if not already warmed)
  useEffect(() => {
    if (isMounted) {
      // Check if system is already warmed before starting warmup
      const warmupStatus = warmupManager.getWarmupStatus()
      
      if (warmupStatus.isWarmed) {
        console.log('🔥 System already warmed, setting ready state')
        setSystemReady(true)
        setIsWarming(false)
      } else if (warmupStatus.isInProgress) {
        console.log('⏳ Warmup in progress, waiting for completion')
        setIsWarming(true)
        // Wait for existing warmup to complete
        warmupManager.getCurrentWarmupPromise()?.then((result) => {
          if (result) {
            setSystemReady(true)
          } else {
            // Even if warmup failed, allow the app to function
            setSystemReady(true)
            setError('⚠️ System is starting up. Some features may be slower than usual.')
          }
          setIsWarming(false)
        }).catch(() => {
          // Handle promise rejection gracefully
          setSystemReady(true)
          setError('⚠️ System is starting up. Some features may be slower than usual.')
          setIsWarming(false)
        })
      } else {
        console.log('🚀 Starting initial warmup')
        warmupAPIs()
      }
    }
  }, [isMounted])

  // Handle hydration by waiting for mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load user preferences from session with localStorage backup and subscription validation
  useEffect(() => {
    if (!isMounted) return // Wait for hydration
    
    if (session?.user) {
      let newRewardPreference = session.user.rewardPreference as any || 'cashback'
      const newPointValue = session.user.pointValue || 0.01
      const newEnableSubcategories = session.user.enableSubCategories || false
      
      // CRITICAL FIX: Only validate against subscription tier if it has been loaded
      // This prevents race condition where tier is still 'free' (default) while loading
      if (userSubscriptionTier !== null && userSubscriptionTier === 'free' && (newRewardPreference === 'points' || newRewardPreference === 'best_overall')) {
        console.warn(`⚠️ User has ${newRewardPreference} preference but free tier - resetting to cashback`)
        newRewardPreference = 'cashback'
        // Update the database to fix the invalid state
        fetch('/api/user/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rewardPreference: 'cashback' }),
        }).catch(error => console.error('Failed to reset invalid preference:', error))
      } else if (userSubscriptionTier === null) {
        // If subscription tier is still loading, don't validate yet - just load the preference
        console.log('ℹ️ Subscription tier still loading, deferring preference validation')
      }
      
      // Only update if values have actually changed to avoid unnecessary re-renders
      if (rewardPreference !== newRewardPreference) {
        setRewardPreference(newRewardPreference)
        // Backup to localStorage for tab switching persistence
        localStorage.setItem('rewardPreference', newRewardPreference)
      }
      if (pointValue !== newPointValue) {
        setPointValue(newPointValue)
        localStorage.setItem('pointValue', newPointValue.toString())
      }
      if (enableSubcategories !== newEnableSubcategories) {
        setEnableSubcategories(newEnableSubcategories)
        localStorage.setItem('enableSubcategories', JSON.stringify(newEnableSubcategories))
      }
    } else if (status === 'unauthenticated') {
      // For users without a session, load from localStorage or use defaults
      let savedRewardPref = localStorage.getItem('rewardPreference') as any || 'cashback'
      const savedPointValue = parseFloat(localStorage.getItem('pointValue') || '0.01')
      const savedSubcategories = JSON.parse(localStorage.getItem('enableSubcategories') || 'false')
      
      // For unauthenticated users, always default to cashback for premium features
      if (savedRewardPref === 'points' || savedRewardPref === 'best_overall') {
        savedRewardPref = 'cashback'
        localStorage.setItem('rewardPreference', 'cashback')
      }
      
      if (rewardPreference !== savedRewardPref) {
        setRewardPreference(savedRewardPref)
      }
      if (pointValue !== savedPointValue) {
        setPointValue(savedPointValue)
      }
      if (enableSubcategories !== savedSubcategories) {
        setEnableSubcategories(savedSubcategories)
      }
    }
  }, [session, session?.user?.rewardPreference, session?.user?.pointValue, session?.user?.enableSubCategories, status, isMounted, userSubscriptionTier])

  // Check for preference updates from localStorage
  useEffect(() => {
    const checkForUpdates = async () => {
      const lastUpdate = localStorage.getItem('preferences-updated')
      if (lastUpdate) {
        const updateTime = parseInt(lastUpdate)
        const now = Date.now()
        // If preferences were updated in the last 5 seconds, refresh the session data
        if (now - updateTime < 5000) {
          localStorage.removeItem('preferences-updated')
          console.log('🔄 Preferences updated, refreshing session data...')
          
          // Use NextAuth's update function to refresh session
          try {
            await updateSession()
            console.log('✅ Session updated successfully')
          } catch (error) {
            console.error('❌ Error updating session:', error)
          }
        }
      }
    }

    // Check immediately and set up an interval
    checkForUpdates()
    const interval = setInterval(checkForUpdates, 1000)
    
    return () => clearInterval(interval)
  }, [updateSession])

  // Listen for session refresh events (for cross-tab communication)
  useEffect(() => {
    const handleSessionRefresh = async () => {
      console.log('🔄 Session refresh event received')
      try {
        await updateSession()
        console.log('✅ Session refreshed from event')
      } catch (error) {
        console.error('❌ Error refreshing session from event:', error)
      }
    }

    window.addEventListener('session-refresh', handleSessionRefresh)
    return () => window.removeEventListener('session-refresh', handleSessionRefresh)
  }, [updateSession])

  // Check user subscription tier
  useEffect(() => {
    const checkSubscriptionTier = async () => {
      // FIXED: Only check if we have a valid, authenticated session
      if (status === 'loading') {
        console.log('ℹ️ Session still loading, skipping subscription check')
        return
      }
      
      if (status === 'unauthenticated' || !session?.user?.email) {
        console.log('ℹ️ No authenticated session, using free tier')
        setUserSubscriptionTier('free') // Default to free for anonymous users
        return
      }
      
      try {
        const response = await fetch('/api/user/subscription', {
          headers: {
            'Cache-Control': 'no-cache',
          }
        })
        if (response.ok) {
          const data = await response.json()
          const newTier = data.tier || 'free'
          console.log('🔍 Subscription tier check:', newTier)
          setUserSubscriptionTier(newTier)
        } else if (response.status === 401) {
          console.warn('⚠️ Authentication error in subscription check - skipping')
          setUserSubscriptionTier('free')
          return
        } else if (response.status === 503) {
          console.warn('⚠️ Database temporarily unavailable - keeping current tier')
          // Don't change tier when database is temporarily unavailable
          return
        } else {
          console.warn('⚠️ Subscription check failed with status:', response.status)
          setUserSubscriptionTier('free')
        }
      } catch (error) {
        console.error('Error checking subscription tier:', error)
        setUserSubscriptionTier('free') // Safe default for network errors
      }
    }
    
    // FIXED: Only run if we have an authenticated session
    if (status === 'authenticated' && session?.user?.email) {
      checkSubscriptionTier()
      
      // Only set up interval if we have a valid session
      const interval = setInterval(checkSubscriptionTier, 30000)
      return () => clearInterval(interval)
    } else if (status === 'unauthenticated') {
      // For anonymous users, always set to free
      setUserSubscriptionTier('free')
    }
    // Do nothing if still loading - let it finish loading first
  }, [session, status])

  // Add a manual refresh function for subscription tier
  const refreshSubscriptionTier = async () => {
    // FIXED: Only refresh if authenticated
    if (status === 'authenticated' && session?.user?.email) {
      try {
        const response = await fetch('/api/user/subscription', {
          headers: {
            'Cache-Control': 'no-cache',
          }
        })
        if (response.ok) {
          const data = await response.json()
          const newTier = data.tier || 'free'
          console.log('🔄 Manual subscription tier refresh:', newTier)
          setUserSubscriptionTier(newTier)
        } else if (response.status === 401) {
          console.warn('⚠️ Authentication error in manual subscription refresh')
          setUserSubscriptionTier('free')
        } else if (response.status === 503) {
          console.warn('⚠️ Database temporarily unavailable during manual refresh')
          // Don't update tier when database is temporarily unavailable
        } else {
          console.warn('⚠️ Manual subscription refresh failed with status:', response.status)
        }
      } catch (error) {
        console.error('Error refreshing subscription tier:', error)
      }
    }
  }

  // Listen for subscription updates (you can call this after sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'subscription-updated') {
        console.log('🔄 Storage event detected - refreshing subscription')
        refreshSubscriptionTier()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [session])

  // Load subcategory preference from localStorage and session
  useEffect(() => {
    if (!isMounted) return // Wait for hydration
    
    // First check localStorage for immediate persistence
    const savedSubcategoryPref = localStorage.getItem('enableSubcategories')
    if (savedSubcategoryPref !== null) {
      setEnableSubcategories(JSON.parse(savedSubcategoryPref))
    }
    
    // Then override with user session preference if available
    if (session?.user?.enableSubCategories !== undefined) {
      setEnableSubcategories(session.user.enableSubCategories)
    }
  }, [session, isMounted])

  // Save subcategory preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('enableSubcategories', JSON.stringify(enableSubcategories))
    console.log('💾 Saved subcategory preference:', enableSubcategories)
  }, [enableSubcategories])

  // Fetch spending categories
  useEffect(() => {
    fetchCategories()
  }, [enableSubcategories])

  // Load saved spending data
  useEffect(() => {
    const loadSpendingData = async () => {
      // Skip if we've already loaded initial data or if spending array is empty
      if (initialDataLoaded || spending.length === 0 || !isMounted) return
      
      console.log('🚀 Starting data loading process...')
      let savedSpending = []
      
      // First, try to load from localStorage (session persistence)
      const localSpending = localStorage.getItem('spending-data')
      if (localSpending) {
        try {
          const parsedSpending = JSON.parse(localSpending)
          if (Array.isArray(parsedSpending)) {
            savedSpending = parsedSpending
            console.log('📂 Loaded ALL spending data from localStorage:', savedSpending)
            console.log('📂 Non-zero spending data:', savedSpending.filter((s: any) => s.monthlySpend > 0))
          }
        } catch (error) {
          console.error('Error parsing local spending data:', error)
        }
      } else {
        console.log('📂 No spending data found in localStorage')
      }

      // If user is logged in, load from their account (only if it has meaningful data)
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/user/spending')
          if (response.ok) {
            const data = await response.json()
            if (data.spending && Array.isArray(data.spending)) {
              // Only override localStorage if account data has meaningful spending (not all zeros)
              const hasNonZeroSpending = data.spending.some((item: any) => item.monthlySpend > 0)
              if (hasNonZeroSpending || savedSpending.length === 0) {
                savedSpending = data.spending
              }
            }
          } else if (response.status === 503) {
            console.warn('⚠️ Database temporarily unavailable - using localStorage data only')
            // Continue with localStorage data when database is unavailable
          } else {
            console.warn('⚠️ Failed to load user spending data, status:', response.status)
          }
        } catch (error) {
          console.error('Error loading user spending data:', error)
        }
      }

      // Merge saved spending with current category structure
      if (savedSpending.length > 0) {
        console.log('🔀 Starting merge process')
        console.log('🔀 Current spending structure:', spending)
        console.log('🔀 Saved spending to merge:', savedSpending)
        
        const mergedSpending = spending.map(currentItem => {
          const savedItem = savedSpending.find((saved: UserSpending) => {
            // Match by categoryId or subCategoryId
            if (currentItem.categoryId && saved.categoryId) {
              return currentItem.categoryId === saved.categoryId
            }
            if (currentItem.subCategoryId && saved.subCategoryId) {
              return currentItem.subCategoryId === saved.subCategoryId
            }
            // Fallback to name matching
            return currentItem.categoryName === saved.categoryName
          })
          
          const result = savedItem ? { ...currentItem, monthlySpend: savedItem.monthlySpend } : currentItem
          if (savedItem && savedItem.monthlySpend > 0) {
            console.log('🔀 Merged item:', { from: currentItem, to: result, savedItem })
          }
          return result
        })
        
        console.log('🔀 Final merged spending:', mergedSpending.filter(s => s.monthlySpend > 0))
        
        // Apply parent category summing if in subcategory mode
        const finalSpending = enableSubcategories ? updateParentCategorySums(mergedSpending) : mergedSpending
        console.log('🔀 After parent sums (if applicable):', finalSpending.filter(s => s.monthlySpend > 0))
        setSpending(finalSpending)
      }
      
      // Mark initial data as loaded
      setInitialDataLoaded(true)
    }

    // Load data when we have categories and spending array ready AND component is mounted
    if (!loading && categories.length > 0 && spending.length > 0 && isMounted) {
      loadSpendingData()
    }
  }, [loading, categories.length, spending.length, session?.user?.email, enableSubcategories, initialDataLoaded, isMounted])

  // Save spending data (debounced)
  useEffect(() => {
    const saveSpendingData = async () => {
      // Only save if we have meaningful data and initial data has been loaded
      if (!initialDataLoaded || spending.length === 0) return
      
      // Always save to localStorage for session persistence
      localStorage.setItem('spending-data', JSON.stringify(spending))
      console.log('💾 Saved spending data to localStorage:', spending.filter(s => s.monthlySpend > 0))

      // If user is logged in, also save to their account
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/user/spending', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spending })
          })
          if (response.ok) {
            console.log('💾 Saved spending data to user account')
          } else if (response.status === 503) {
            console.warn('⚠️ Database temporarily unavailable - data saved to localStorage only')
          } else {
            console.warn('⚠️ Failed to save spending data to account, status:', response.status)
          }
        } catch (error) {
          console.error('Error saving user spending data:', error)
        }
      }
    }

    // Debounce saving to avoid too many API calls
    const timeoutId = setTimeout(saveSpendingData, 1000)
    return () => clearTimeout(timeoutId)
  }, [spending, session, initialDataLoaded]) // Added initialDataLoaded dependency

  const fetchCategories = async () => {
    try {
      const endpoint = enableSubcategories ? '/api/subcategories' : '/api/categories'
      const response = await fetch(endpoint, {
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication error in fetchCategories')
          // Don't set categories if authentication fails, but don't prevent loading either
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Ensure data is an array before proceeding
      if (!Array.isArray(data)) {
        console.error('Categories API returned non-array data:', data)
        return
      }
      
      setCategories(data)
      
      // Check if we have saved data that we should preserve
      const localSpending = localStorage.getItem('spending-data')
      const hasSavedData = localSpending && JSON.parse(localSpending).length > 0
      console.log('🔍 Checking for saved data in fetchCategories:', hasSavedData)
      
      // Only initialize spending if we don't already have data AND no saved data exists
      if (spending.length === 0 && !hasSavedData) {
        console.log('🆕 Initializing fresh spending data')
        // Initialize spending based on subcategory mode
        if (enableSubcategories) {
          // Create spending entries for both categories and subcategories
          const spendingEntries: UserSpending[] = []
          
          data.forEach((cat: SpendingCategory) => {
            // Add main category
            spendingEntries.push({
              categoryId: cat.id,
              categoryName: cat.name,
              monthlySpend: 0
            })
            
            // Add subcategories if they exist
            if (cat.subCategories && cat.subCategories.length > 0) {
              cat.subCategories.forEach((sub: SubCategory) => {
                spendingEntries.push({
                  subCategoryId: sub.id,
                  categoryName: `${cat.name} → ${sub.name}`,
                  monthlySpend: 0
                })
              })
            }
          })
          
          setSpending(spendingEntries)
        } else {
          // Standard category mode
          setSpending(data.map((cat: SpendingCategory) => ({
            categoryId: cat.id,
            categoryName: cat.name,
            monthlySpend: 0
          })))
        }
      } else if (spending.length > 0) {
        console.log('🔄 Adapting existing spending data to new category structure')
        // If we have existing spending data, we need to adapt it to the new category structure
        // This handles switching between standard and subcategory modes
        let newSpendingStructure: UserSpending[] = []
        
        if (enableSubcategories) {
          // Create spending entries for both categories and subcategories
          data.forEach((cat: SpendingCategory) => {
            // Find existing parent category data
            const existingParent = spending.find(s => s.categoryId === cat.id)
            
            // Add main category (preserve existing data)
            newSpendingStructure.push({
              categoryId: cat.id,
              categoryName: cat.name,
              monthlySpend: existingParent?.monthlySpend || 0
            })
            
            // Add subcategories if they exist
            if (cat.subCategories && cat.subCategories.length > 0) {
              cat.subCategories.forEach((sub: SubCategory) => {
                // Find existing subcategory data
                const existingSub = spending.find(s => s.subCategoryId === sub.id)
                
                newSpendingStructure.push({
                  subCategoryId: sub.id,
                  categoryName: `${cat.name} → ${sub.name}`,
                  monthlySpend: existingSub?.monthlySpend || 0
                })
              })
            }
          })
        } else {
          // Standard category mode - preserve existing parent category data
          newSpendingStructure = data.map((cat: SpendingCategory) => {
            const existing = spending.find(s => s.categoryId === cat.id)
            return {
              categoryId: cat.id,
              categoryName: cat.name,
              monthlySpend: existing?.monthlySpend || 0
            }
          })
        }
        
        setSpending(newSpendingStructure)
      } else {
        console.log('⏳ Saved data exists, will be loaded by useEffect')
        // If we have saved data but no current spending, just set up empty structure
        // The saved data will be loaded by the useEffect
        if (enableSubcategories) {
          const spendingEntries: UserSpending[] = []
          data.forEach((cat: SpendingCategory) => {
            spendingEntries.push({
              categoryId: cat.id,
              categoryName: cat.name,
              monthlySpend: 0
            })
            if (cat.subCategories && cat.subCategories.length > 0) {
              cat.subCategories.forEach((sub: SubCategory) => {
                spendingEntries.push({
                  subCategoryId: sub.id,
                  categoryName: `${cat.name} → ${sub.name}`,
                  monthlySpend: 0
                })
              })
            }
          })
          setSpending(spendingEntries)
        } else {
          setSpending(data.map((cat: SpendingCategory) => ({
            categoryId: cat.id,
            categoryName: cat.name,
            monthlySpend: 0
          })))
        }
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setLoading(false)
    }
  }

  const updateSpending = (id: string, amount: number, isSubcategory: boolean = false) => {
    console.log('🖊️ User input:', { id, amount, isSubcategory })
    setSpending(prev => {
      const updated = prev.map(s => {
        const matchId = isSubcategory ? s.subCategoryId : s.categoryId
        return matchId === id 
          ? { ...s, monthlySpend: amount }
          : s
      })
      
      console.log('📝 Updated spending state:', updated.filter(s => s.monthlySpend > 0))
      
      // If we're in subcategory mode and this is a subcategory update, 
      // update the parent category to be the sum of all its subcategories
      if (enableSubcategories && isSubcategory) {
        const final = updateParentCategorySums(updated)
        console.log('🔄 After parent sum update:', final.filter(s => s.monthlySpend > 0))
        return final
      }
      
      return updated
    })
  }

  // Helper function to update parent category sums
  const updateParentCategorySums = (spendingData: UserSpending[]) => {
    return spendingData.map(item => {
      // Only update parent categories (those with categoryId, not subCategoryId)
      if (!item.categoryId || item.subCategoryId) {
        return item
      }
      
      // Find the corresponding category in our categories data
      const category = categories.find(cat => cat.id === item.categoryId)
      if (!category?.subCategories || category.subCategories.length === 0) {
        return item
      }
      
      // Sum all subcategories for this parent
      const subcategorySum = spendingData
        .filter(s => s.subCategoryId && category.subCategories!.some(sub => sub.id === s.subCategoryId))
        .reduce((sum, s) => sum + s.monthlySpend, 0)
      
      // Use MAX of current parent amount and subcategory sum
      // This allows parent to have additional spending beyond subcategories
      const newAmount = Math.max(item.monthlySpend, subcategorySum)
      
      return { ...item, monthlySpend: newAmount }
    })
  }

  const openCardCustomization = (cardId: string) => {
    setEditingCardId(cardId)
    setCustomizationOpen(true)
  }

  const closeCardCustomization = () => {
    setCustomizationOpen(false)
    setEditingCardId(null)
  }

  const updateCardCustomization = (customization: CardCustomization) => {
    if (!editingCardId) return
    
    // Update the customizations
    const updatedCustomizations = {
      ...cardCustomizations,
      [editingCardId]: customization
    }
    setCardCustomizations(updatedCustomizations)
    
    // Recalculate recommendations with per-card customizations
    recalculateWithCustomizations(updatedCustomizations)
  }

  const recalculateWithCustomizations = async (customizations: typeof cardCustomizations) => {
    setRecalculating(true)
    try {
      const activeSpending = spending.filter(s => s.monthlySpend > 0)
      
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userSpending: activeSpending,
          rewardPreference,
          pointValue: 0.01, // Default for non-customized cards
          cardCustomizations: customizations // Send per-card customizations
        })
      })
      
      const data = await response.json()
      setRecommendations(data)
    } catch (error) {
      console.error('Error recalculating recommendations:', error)
    } finally {
      setRecalculating(false)
    }
  }

  const updatePointValue = async (newValue: number) => {
    setPointValue(newValue)
    
    // Only recalculate if we have results and points/best_overall is selected
    if (recommendations.length > 0 && (rewardPreference === 'points' || rewardPreference === 'best_overall')) {
      await recalculateRecommendations(newValue)
    }
  }

  const recalculateRecommendations = async (newPointValue: number) => {
    setRecalculating(true)
    try {
      const activeSpending = spending.filter(s => s.monthlySpend > 0)
      
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userSpending: activeSpending,
          rewardPreference,
          pointValue: newPointValue
        })
      })
      
      const data = await response.json()
      setRecommendations(data)
      
      // Show upgrade prompt for free users if they got limited results
      // Only show if subscription tier has been loaded and is 'free'
      if (userSubscriptionTier === 'free' && data.length > 0) {
        // Add a small delay so user sees their results first
        setTimeout(() => {
          setUpgradePromptFeature('Premium Credit Cards')
          setUpgradePromptDescription('You\'re seeing no-annual-fee cards only. Upgrade to access premium cards like Chase Sapphire, Amex Gold/Platinum, and Capital One Venture X for potentially higher rewards.')
          setUpgradePromptOpen(true)
        }, 3000) // Show after 3 seconds
      }
      
    } catch (error) {
      console.error('Error recalculating recommendations:', error)
    } finally {
      setRecalculating(false)
    }
  }

  const calculateRecommendations = async () => {
    setCalculating(true)
    setError(null) // Clear previous errors
    
    // Validate reward preference is selected
    if (!rewardPreference) {
      setError('⚠️ Please select a reward type preference before getting recommendations.')
      setCalculating(false)
      return
    }
    
    try {
      const activeSpending = spending.filter(s => s.monthlySpend > 0)
      
      // Enhanced retry logic for cold starts and database issues
      let lastError: any
      let success = false
      const maxRetries = 4 // Increased for database issues
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🎯 Calculating recommendations (attempt ${attempt}/${maxRetries})...`)
          
          // For first attempt, try a quick warmup check if system isn't ready
          if (!systemReady && attempt === 1) {
            console.log('⏳ System not ready, attempting quick warmup...')
            try {
              // Try lightweight warmup first
              const quickWarmup = await warmupManager.warmupIfNeeded()
              if (quickWarmup) {
                setSystemReady(true)
                console.log('✅ Quick warmup successful')
              } else {
                console.warn('⚠️ Quick warmup failed, but continuing with request...')
              }
            } catch (warmupError) {
              console.warn('⚠️ Quick warmup error, but continuing:', warmupError)
            }
          }
          
          const response = await fetch('/api/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userSpending: activeSpending,
              rewardPreference,
              pointValue: 0.01 // Always use 1¢ for initial calculation
            })
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`
            
            try {
              const errorData = JSON.parse(errorText)
              if (errorData.error) {
                errorMessage = errorData.error
              }
            } catch (parseError) {
              // Use the raw text if JSON parsing fails
              if (errorText) {
                errorMessage = errorText
              }
            }
            
            throw new Error(errorMessage)
          }
          
          const data = await response.json()
          
          if (data.error) {
            throw new Error(data.error)
          }
          
          // Check if we got valid recommendations
          if (!Array.isArray(data)) {
            throw new Error('Invalid response format: expected array of recommendations')
          }
          
          if (data.length === 0) {
            // Empty results might indicate a system issue, especially on first attempts
            if (attempt < maxRetries) {
              throw new Error('No recommendations returned - system may be warming up')
            } else {
              // On final attempt, accept empty results as valid
              console.warn('⚠️ No credit card recommendations found for your spending pattern')
              setError('🔍 No credit cards match your spending pattern. Try adjusting your spending amounts or categories.')
              setRecommendations([])
              success = true
              break
            }
          } else {
            setRecommendations(data)
            success = true
            
            // Mark system as ready if we got successful results
            if (!systemReady) {
              setSystemReady(true)
              console.log('✅ System is now ready (confirmed by successful API call)')
            }
            
            // Show upgrade prompt for free users if they got limited results
            // Only show if subscription tier has been loaded and is 'free'
            if (userSubscriptionTier === 'free' && data.length > 0) {
              // Add a small delay so user sees their results first
              setTimeout(() => {
                setUpgradePromptFeature('Premium Credit Cards')
                setUpgradePromptDescription('You\'re seeing no-annual-fee cards only. Upgrade to access premium cards like Chase Sapphire, Amex Gold/Platinum, and Capital One Venture X for potentially higher rewards.')
                setUpgradePromptOpen(true)
              }, 3000) // Show after 3 seconds
            }
            
            break // Success, exit retry loop
          }
          
        } catch (error: any) {
          lastError = error
          console.warn(`❌ Recommendation attempt ${attempt} failed:`, error.message)
          
          // Enhanced retry conditions for database issues
          const isRetryable = (
            error.message.includes('500') || 
            error.message.includes('503') ||
            error.message.includes('408') || // Timeout
            error.message.includes('timeout') ||
            error.message.includes('fetch') ||
            error.message.includes('Database temporarily unavailable') ||
            error.message.includes('prepared statement') ||
            error.message.includes('connection') ||
            error.message.includes('No recommendations returned') ||
            error.message.includes('warming up') ||
            error.message.includes('Service Unavailable')
          )
          
          if (attempt < maxRetries && isRetryable) {
            // Progressive delay with longer waits for database issues
            const baseDelay = error.message.includes('Database') || error.message.includes('503') ? 3000 : 1500
            const delay = baseDelay * attempt
            console.log(`🔄 Retrying in ${delay}ms...`)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
          
          // If it's not retryable or we're out of retries, break
          break
        }
      }
      
      if (!success) {
        throw lastError || new Error('Failed to get recommendations after multiple attempts')
      }
      
    } catch (error: any) {
      console.error('Error calculating recommendations:', error)
      
      // Enhanced user-friendly error messages
      if (error.message.includes('Database temporarily unavailable') || 
          error.message.includes('prepared statement') ||
          error.message.includes('connection')) {
        setError('🔄 Database is warming up. Please wait a moment and try again.')
      } else if (error.message.includes('503') || error.message.includes('Service Unavailable')) {
        setError('🔥 System is starting up. Please try again in a few seconds.')
      } else if (error.message.includes('408') || error.message.includes('timeout')) {
        setError('⏰ Request timed out. The system may be warming up. Please try again.')
      } else if (error.message.includes('500')) {
        setError('⚠️ Server error occurred. Please try again.')
      } else if (error.message.includes('fetch')) {
        setError('🌐 Connection timeout. Please check your internet and try again.')
      } else if (error.message.includes('No recommendations returned')) {
        setError('🔍 No credit cards match your spending pattern. Try adjusting your spending amounts.')
      } else {
        setError('❌ Unable to calculate recommendations. Please try again.')
      }
    } finally {
      setCalculating(false)
    }
  }

  const totalMonthlySpend = spending.reduce((sum, s) => sum + s.monthlySpend, 0)

  // Debug logging for button state
  useEffect(() => {
    console.log('🔍 Button state debug:', {
      totalMonthlySpend,
      calculating,
      spendingLength: spending.length,
      nonZeroSpending: spending.filter(s => s.monthlySpend > 0).length,
      buttonDisabled: totalMonthlySpend === 0 || calculating
    })
  }, [totalMonthlySpend, calculating, spending.length])

  const handleRewardPreferenceChange = (newPreference: 'cashback' | 'points' | 'best_overall') => {
    // Check if user is trying to access premium features without subscription
    // Only check if subscription tier has been loaded (not null)
    if (userSubscriptionTier === 'free' && (newPreference === 'points' || newPreference === 'best_overall')) {
      setUpgradePromptFeature(newPreference === 'points' ? 'Points Optimization' : 'Best Overall Analysis')
      setUpgradePromptDescription(
        newPreference === 'points' 
          ? 'Access premium travel and points cards with advanced optimization for maximum point earning potential.'
          : 'Compare both cashback and points cards to find the absolute best option for your spending patterns.'
      )
      setUpgradePromptOpen(true)
      return
    }
    
    // If subscription tier is still loading (null), allow the change but don't validate yet
    if (userSubscriptionTier === null && (newPreference === 'points' || newPreference === 'best_overall')) {
      console.log('ℹ️ Subscription tier still loading, allowing preference change without validation')
    }
    
    setRewardPreference(newPreference)
    // Save to localStorage for persistence across tab switches
    localStorage.setItem('rewardPreference', newPreference)
  }

  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Spending Input */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
          💳 Monthly Spending by Category
        </h2>
        
        {/* Subcategory Toggle */}
        <div className="mb-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-indigo-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                🎯 Enable Subcategories
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Get more precise recommendations with specific subcategories like Amazon, Whole Foods, Hotels, etc.
              </p>
              {enableSubcategories && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                  💡 Parent categories show the higher of: your input OR sum of subcategories
                </p>
              )}
            </div>
            <button
              onClick={() => setEnableSubcategories(!enableSubcategories)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                enableSubcategories 
                  ? 'bg-blue-600' 
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  enableSubcategories ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {enableSubcategories ? (
            // Subcategory mode: group by parent category
            categories.map((category) => (
              <div key={category.id} className="space-y-4">
                {/* Parent Category Header */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-blue-200 dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                </div>
                
                {/* Main Category Spending */}
                {(() => {
                  const currentSpending = spending.find(s => s.categoryId === category.id)
                  const amount = currentSpending?.monthlySpend || 0
                  
                  return (
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <label className="block text-md font-medium text-gray-900 dark:text-white">
                            General {category.name}
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Other {category.name.toLowerCase()} not listed below</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(amount)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Slider
                          value={amount}
                          onValueChange={(value) => updateSpending(category.id, value, false)}
                          min={0}
                          max={2000}
                          step={25}
                          className="py-1"
                        />
                        <input
                          type="number"
                          min="0"
                          step="25"
                          value={amount || ''}
                          onChange={(e) => updateSpending(category.id, parseFloat(e.target.value) || 0, false)}
                          className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )
                })()}
                
                {/* Subcategories */}
                {category.subCategories && category.subCategories.map((subCategory) => {
                  const currentSpending = spending.find(s => s.subCategoryId === subCategory.id)
                  const amount = currentSpending?.monthlySpend || 0
                  
                  return (
                    <div key={subCategory.id} className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 ml-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <label className="block text-md font-medium text-gray-900 dark:text-white">
                            📍 {subCategory.name}
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{subCategory.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {formatCurrency(amount)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Slider
                          value={amount}
                          onValueChange={(value) => updateSpending(subCategory.id, value, true)}
                          min={0}
                          max={2000}
                          step={25}
                          className="py-1"
                        />
                        <input
                          type="number"
                          min="0"
                          step="25"
                          value={amount || ''}
                          onChange={(e) => updateSpending(subCategory.id, parseFloat(e.target.value) || 0, true)}
                          className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          ) : (
            // Standard category mode
            categories.map((category) => {
              const currentSpending = spending.find(s => s.categoryId === category.id)
              const amount = currentSpending?.monthlySpend || 0
              
              return (
                <div key={category.id} className="space-y-4 p-6 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-start">
                    <div>
                      <label className="block text-lg font-semibold text-gray-900 dark:text-white">
                        {category.name}
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{category.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(amount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">per month</p>
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="space-y-3">
                    <Slider
                      value={amount}
                      onValueChange={(value) => updateSpending(category.id, value, false)}
                      min={0}
                      max={2000}
                      step={25}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>$0</span>
                      <span>$1000</span>
                      <span>$2000+</span>
                    </div>
                  </div>

                  {/* Text Input */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Exact:</span>
                    <input
                      type="number"
                      min="0"
                      step="25"
                      value={amount || ''}
                      onChange={(e) => updateSpending(category.id, parseFloat(e.target.value) || 0, false)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="0"
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
        
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-blue-200 dark:border-gray-600">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Total Monthly Spending: {formatCurrency(totalMonthlySpend)}
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Annual Spending: {formatCurrency(totalMonthlySpend * 12)}
            </p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
          ⚙️ Reward Preferences
        </h2>
        
        <div className="space-y-8">
          <div>
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
              What type of rewards do you prefer?
            </label>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleRewardPreferenceChange('cashback')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  rewardPreference === 'cashback'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">💵</div>
                  <div className="font-semibold">Cashback</div>
                  <div className="text-sm opacity-75">Direct cash rewards</div>
                </div>
              </button>
              
              <button
                onClick={() => handleRewardPreferenceChange('points')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  rewardPreference === 'points'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="font-semibold">Points/Miles</div>
                  <div className="text-sm opacity-75">Travel & transfer partners</div>
                </div>
              </button>

              <button
                onClick={() => handleRewardPreferenceChange('best_overall')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  rewardPreference === 'best_overall'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-green-300 dark:hover:border-green-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🏆</div>
                  <div className="font-semibold">Best Overall</div>
                  <div className="text-sm opacity-75">Compare cash & points</div>
                </div>
              </button>
            </div>
          </div>

          {(rewardPreference === 'points' || rewardPreference === 'best_overall') && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-600">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                📊 <strong>Initial calculation will use 1¢ per point.</strong><br/>
                You'll be able to adjust point valuations for your top card recommendations after seeing the results.
              </p>
            </div>
          )}

          {/* Testing Tools (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-600">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">🧪 Testing Tools</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    localStorage.removeItem('spending-data')
                    setSpending(prev => prev.map(s => ({ ...s, monthlySpend: 0 })))
                    if (session?.user?.email) {
                      fetch('/api/user/spending', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ spending: spending.map(s => ({ ...s, monthlySpend: 0 })) })
                      })
                    }
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Clear All Spending Data
                </button>
                <button
                  onClick={() => {
                    const testSpending = spending.map((s, index) => ({ 
                      ...s, 
                      monthlySpend: [500, 300, 200, 150, 100, 75, 50, 25][index] || 0 
                    }))
                    setSpending(testSpending)
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Load Test Data
                </button>
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2">
                These buttons help test spending persistence when navigating between pages.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* System Status & Calculate Button */}
      <div className="text-center space-y-4">
        {/* System Status Indicator */}
        {isWarming && (
          <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>🔥 Warming up servers...</span>
          </div>
        )}
        
        {systemReady && !isWarming && (
          <div className="inline-flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm">
            <span>✅ System ready</span>
          </div>
        )}

        <Button
          onClick={calculateRecommendations}
          disabled={totalMonthlySpend === 0 || calculating}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-xl font-semibold rounded-full shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {calculating ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Calculating... (may take a moment)</span>
            </div>
          ) : (
            '🎯 Get My Recommendations'
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="max-w-md mx-auto mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start space-x-3">
              <span className="text-red-500 text-xl flex-shrink-0">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">
                  Calculation Failed
                </h3>
                <p className="text-red-600 dark:text-red-400 text-sm mb-3">
                  {error}
                </p>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setError(null)}
                    className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 underline"
                  >
                    Dismiss
                  </button>
                  <button 
                    onClick={calculateRecommendations}
                    disabled={calculating}
                    className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors disabled:opacity-50"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Helpful tip for first-time users */}
        {totalMonthlySpend === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            💡 Enter your monthly spending amounts above to get personalized credit card recommendations
          </p>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent mb-4">
              🏆 Your Personalized Recommendations
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Based on your {formatCurrency(totalMonthlySpend)} monthly spending across {spending.filter(s => s.monthlySpend > 0).length} categories
            </p>
            {userSubscriptionTier === 'free' && (
              <div className="mt-4 inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm">
                <span>💳</span>
                <span>Showing no-annual-fee cards only</span>
                <button
                  onClick={() => {
                    setUpgradePromptFeature('Premium Credit Cards')
                    setUpgradePromptDescription('Access premium cards like Chase Sapphire, Amex Gold/Platinum, and Capital One Venture X for potentially higher rewards.')
                    setUpgradePromptOpen(true)
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium underline ml-1"
                >
                  Upgrade for more
                </button>
              </div>
            )}
          </div>

          {/* Cards Grid */}
          <div className="space-y-6">
            {recommendations.map((rec, index) => {
              const rankColors = [
                'from-yellow-400 to-orange-500', // Gold for #1
                'from-gray-300 to-gray-500',     // Silver for #2
                'from-amber-600 to-amber-800',   // Bronze for #3
                'from-blue-400 to-blue-600',     // Blue for others
              ];
              const rankColor = rankColors[Math.min(index, 3)];
              
              return (
                <div 
                  key={rec.cardId} 
                  className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform hover:scale-105 transition-all duration-300"
                >
                  {/* Card Header */}
                  <div className="relative">
                    <div className={`bg-gradient-to-r ${rankColor} p-6 text-white`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <span className="text-3xl font-bold">#{index + 1}</span>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold">{rec.cardName}</h3>
                            <p className="text-lg opacity-90">{rec.issuer}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                                {rec.rewardType === 'cashback' ? '💵 Cashback' : '🎯 Points'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold">{formatCurrency(rec.netAnnualValue)}</div>
                          <div className="text-lg opacity-90">net annual value</div>
                          <div className="flex flex-col space-y-2 mt-3">
                            {rec.applicationUrl && (
                              <div className="space-y-2">
                                <Button
                                  onClick={() => window.open(rec.applicationUrl, '_blank')}
                                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold w-full"
                                  size="sm"
                                >
                                  🚀 Apply Now
                                </Button>
                                <div className="text-xs text-white/80 text-center">
                                  ⚠️ Affiliate Link - We may earn a commission
                                </div>
                              </div>
                            )}
                            <Button
                              onClick={() => openCardCustomization(rec.cardId)}
                              variant="outline"
                              size="sm"
                              className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                            >
                              ⚙️ Customize Card
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Value Breakdown Bar */}
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 p-4">
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(rec.totalAnnualValue)}
                          </div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Annual Rewards</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(rec.benefitsValue)}
                          </div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Benefits Value</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            -{formatCurrency(rec.annualFee)}
                          </div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Annual Fee</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {((rec.netAnnualValue / (totalMonthlySpend * 12)) * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Effective Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-6">
                    {/* Category Rewards Breakdown */}
                    {rec.categoryBreakdown && rec.categoryBreakdown.length > 0 && (
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                          💳 Earning Breakdown by Category
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {rec.categoryBreakdown.map((breakdown, idx) => {
                            const categoryIcons: { [key: string]: string } = {
                              'Dining': '🍽️',
                              'Travel': '✈️',
                              'Gas': '⛽',
                              'Groceries': '🛒',
                              'Entertainment': '🎬',
                              'Online Shopping': '🛍️',
                              'Department Stores': '🏬',
                              'General': '💳'
                            };
                            const icon = categoryIcons[breakdown.categoryName] || '💳';
                            
                            // Format reward rate properly for points vs cashback
                            const rewardDisplay = rec.rewardType === 'points' 
                              ? `${breakdown.rewardRate}x` 
                              : `${(breakdown.rewardRate * 100).toFixed(1)}%`;
                            
                            return (
                              <div 
                                key={idx} 
                                className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 rounded-2xl p-4 border border-gray-200 dark:border-gray-600 shadow-lg"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-2xl">{icon}</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {breakdown.categoryName}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                      {rewardDisplay}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {rec.rewardType === 'points' ? 'points' : 'cashback'}
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">Monthly Spend:</span>
                                    <span className="font-medium">{formatCurrency(breakdown.monthlySpend)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">Monthly Earnings:</span>
                                    <span className="font-medium text-green-600 dark:text-green-400">
                                      {formatCurrency(breakdown.monthlyValue)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                                    <span className="text-gray-900 dark:text-white">Annual Value:</span>
                                    <span className="text-green-600 dark:text-green-400">
                                      {formatCurrency(breakdown.annualValue)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Benefits Section */}
                    {rec.benefitsBreakdown && rec.benefitsBreakdown.length > 0 && rec.benefitsValue > 0 && (
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                          🎁 Benefits You Value
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {rec.benefitsBreakdown
                            .filter(benefit => benefit.personalValue > 0)
                            .map((benefit, idx) => (
                            <div 
                              key={idx} 
                              className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-700"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    {benefit.benefitName}
                                  </h5>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-300">Official Value:</span>
                                      <span className="font-medium">{formatCurrency(benefit.officialValue)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-300">Your Value:</span>
                                      <span className="font-bold text-blue-600 dark:text-blue-400">
                                        {formatCurrency(benefit.personalValue)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Signup Bonus */}
                    {rec.signupBonus && (
                      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-2xl p-6 border-2 border-yellow-300 dark:border-yellow-600">
                        <div className="flex items-center space-x-4">
                          <div className="text-4xl">🎁</div>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-yellow-800 dark:text-yellow-300 mb-2">
                              Welcome Bonus
                            </h4>
                            <div className="text-lg font-semibold text-yellow-900 dark:text-yellow-200">
                              Earn {formatCurrency(rec.signupBonus.amount)}
                            </div>
                            <div className="text-sm text-yellow-700 dark:text-yellow-300">
                              when you spend {formatCurrency(rec.signupBonus.requiredSpend)} in the first {rec.signupBonus.timeframe} months
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Multi-Card Strategies - Premium Feature */}
      {recommendations.length > 0 && (
        <MultiCardStrategies 
          userSpending={spending.filter(s => s.monthlySpend > 0).map(s => ({
            categoryName: s.categoryName,
            monthlySpend: s.monthlySpend
          }))}
          rewardPreference={rewardPreference}
          onError={(error) => {
            console.error('Multi-card strategies error:', error)
          }}
          onUpgradePrompt={() => {
            setUpgradePromptFeature('Multi-Card Strategies')
            setUpgradePromptDescription('Optimize 2-3 card combinations for maximum rewards across all categories with smart diversification and category allocation.')
            setUpgradePromptOpen(true)
          }}
        />
      )}
      
      {/* Card Customization Modal */}
      {customizationOpen && editingCardId && (
        <CardCustomizationModal
          isOpen={customizationOpen}
          onClose={closeCardCustomization}
          onSave={updateCardCustomization}
          card={{
            id: editingCardId,
            name: recommendations.find(r => r.cardId === editingCardId)?.cardName || '',
            type: recommendations.find(r => r.cardId === editingCardId)?.rewardType || 'cashback',
            benefits: recommendations.find(r => r.cardId === editingCardId)?.benefitsBreakdown?.map(b => ({
              id: b.benefitName,
              name: b.benefitName,
              value: b.officialValue
            })) || []
          }}
          currentCustomization={cardCustomizations[editingCardId]}
        />
      )}

      {/* Upgrade Prompt */}
      {upgradePromptOpen && (
        <UpgradePrompt
          isOpen={upgradePromptOpen}
          onClose={() => setUpgradePromptOpen(false)}
          feature={upgradePromptFeature}
          description={upgradePromptDescription}
        />
      )}
    </div>
  )
} 