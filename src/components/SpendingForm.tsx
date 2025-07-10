"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { InfoTooltip } from "@/components/ui/InfoTooltip"
import { formatCurrency } from "@/lib/utils"
import { CardCustomizationModal } from "@/components/CardCustomizationModal"
import { MultiCardStrategies } from './MultiCardStrategies'
import { UpgradePrompt } from './UpgradePrompt'
import { warmupManager } from '@/lib/warmup-manager'
import { RecommendationItem } from './RecommendationItem'
import { useRouter } from 'next/navigation'
import { useUserState } from '@/hooks/useUserState'

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

// Category tooltip content mapping
const categoryTooltips: Record<string, string[]> = {
  'Transportation': ['Ride-share & taxis', 'Public transit', 'Parking fees', 'Tolls'],
  'Travel': ['Flights & airlines', 'Hotels & lodging', 'Car rentals', 'Vacation expenses'],
  'Dining': ['Restaurants', 'Food delivery', 'Coffee shops', 'Bars & nightlife'],
  'Groceries': ['Supermarkets', 'Food shopping', 'Grocery stores', 'Meal planning'],
  'Gas': ['Fuel stations', 'Gas purchases', 'Vehicle fuel'],
  'Shopping': ['Retail stores', 'Online shopping', 'Clothing', 'General merchandise'],
  'Entertainment': ['Movies & theaters', 'Concerts & events', 'Streaming services', 'Games & hobbies'],
  'Other': ['Miscellaneous expenses', 'Items not listed above']
}

export function SpendingForm() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [categories, setCategories] = useState<SpendingCategory[]>([])
  const [spending, setSpending] = useState<UserSpending[]>([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [recommendations, setRecommendations] = useState<CardRecommendation[]>([])
  
  // Enhanced error handling
  const [error, setError] = useState<string | null>(null)
  const [isWarming, setIsWarming] = useState(false)
  const [systemReady, setSystemReady] = useState(false)
  
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
  
  // Category modal state
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)
  
  // Zero input feedback state
  const [showZeroInputFeedback, setShowZeroInputFeedback] = useState(false)
  
  // Temporary display state for zero inputs
  const [tempZeroInputs, setTempZeroInputs] = useState<{[key: string]: boolean}>({})
  
  // Refs to track timeouts for cleanup
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (expandedCategoryId) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [expandedCategoryId])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current)
    }
  }, [])

  // Track if we've loaded initial data to prevent conflicts
  const [initialDataLoaded, setInitialDataLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const fetchCategoriesInProgress = useRef(false)

  // Use centralized state management - eliminates ALL conflicts
  const userState = useUserState()
  const { rewardPreference, pointValue, enableSubCategories: enableSubcategories } = userState.preferences
  const { subscriptionTier: userSubscriptionTier } = userState

  // Debug: Log when enableSubcategories changes
  useEffect(() => {
    console.log('🎯 enableSubcategories changed to:', enableSubcategories)
    console.log('🎯 Current categories count:', categories.length)
    console.log('🎯 Categories have subCategories:', categories.map(c => ({ name: c.name, hasSubCategories: !!c.subCategories })))
  }, [enableSubcategories])

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

  // All preference and subscription management is now handled by useUserState hook

  // Fetch spending categories
  useEffect(() => {
    // Only fetch categories if initial data hasn't been loaded yet
    // This prevents fetchCategories from overwriting merged spending data
    if (!initialDataLoaded) {
      fetchCategories()
    } else {
      console.log('🔒 useEffect: Skipping fetchCategories because initialDataLoaded is true')
    }
  }, [enableSubcategories]) // Removed initialDataLoaded dependency to prevent re-triggering after data loads

  // Load saved spending data
  useEffect(() => {
    const loadSpendingData = async () => {
      // Skip if we've already loaded initial data or if spending array is empty
      if (initialDataLoaded || spending.length === 0 || !isMounted) return
      
      console.log('🚀 Starting data loading process...')
      let savedSpending = []
      
      // First, try to load from recommendation input (most recent navigation from results)
      const recommendationInput = localStorage.getItem('cc-recommendation-input')
      if (recommendationInput) {
        try {
          const payload = JSON.parse(recommendationInput)
          if (payload.userSpending && Array.isArray(payload.userSpending) && payload.userSpending.length > 0) {
            console.log('📂 Loading spending data from recommendation input:', payload.userSpending.length, 'items')
            console.log('🔍 Sample payload data:', payload.userSpending.slice(0, 2))
            
            // Convert recommendation input format to standard spending format
            savedSpending = payload.userSpending.map((item: any) => ({
              categoryId: item.categoryId,
              subCategoryId: item.subCategoryId,
              categoryName: item.categoryName,
              monthlySpend: item.monthlySpend
            }))
            console.log('📂 Converted recommendation input to spending format:', savedSpending.filter((s: any) => s.monthlySpend > 0))
          }
        } catch (error) {
          console.error('Error parsing recommendation input:', error)
        }
      }
      
      // Fallback to regular spending-data if no recommendation input found
      if (savedSpending.length === 0) {
        const localSpending = localStorage.getItem('spending-data')
        if (localSpending) {
          try {
            const parsedSpending = JSON.parse(localSpending)
            if (Array.isArray(parsedSpending)) {
              savedSpending = parsedSpending
              console.log('📂 Loaded spending data from localStorage:', savedSpending.filter((s: any) => s.monthlySpend > 0))
            }
          } catch (error) {
            console.error('Error parsing local spending data:', error)
          }
        } else {
          console.log('📂 No spending data found in localStorage')
        }
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
        console.log('✅ loadSpendingData: Successfully set spending with', finalSpending.filter(s => s.monthlySpend > 0).length, 'non-zero items')
      }
      
      // Mark initial data as loaded
      setInitialDataLoaded(true)
      console.log('🔒 loadSpendingData: Marked initialDataLoaded as true')
    }

    // Load data when we have categories and spending array ready AND component is mounted
    if (!loading && categories.length > 0 && spending.length > 0 && isMounted) {
      loadSpendingData()
    }
  }, [loading, categories.length, spending.length, session?.user?.email, enableSubcategories, initialDataLoaded, isMounted])

  // Save spending data (debounced)
  useEffect(() => {
    const saveSpendingData = async () => {
      console.log('💾 saveSpendingData: Called with initialDataLoaded:', initialDataLoaded, 'spending.length:', spending.length, 'nonZero:', spending.filter(s => s.monthlySpend > 0).length)
      
      // Only save if we have meaningful data and initial data has been loaded
      if (!initialDataLoaded || spending.length === 0) {
        console.log('💾 saveSpendingData: Skipping save - initialDataLoaded:', initialDataLoaded, 'spending.length:', spending.length)
        return
      }
      
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
    console.log('🔄 fetchCategories: Starting with initialDataLoaded:', initialDataLoaded, 'spending.length:', spending.length, 'nonZero:', spending.filter(s => s.monthlySpend > 0).length)
    
    // Prevent concurrent calls
    if (fetchCategoriesInProgress.current) {
      console.log('🔒 fetchCategories: Already in progress, skipping to prevent race condition')
      return
    }
    
    // If we have data already loaded with non-zero spending, don't overwrite it
    if (initialDataLoaded && spending.some(s => s.monthlySpend > 0)) {
      console.log('🔒 fetchCategories: Data already loaded with spending, skipping to avoid overwrite')
      return
    }
    
    // If we already have a spending structure and categories, don't recreate it unless necessary
    if (spending.length > 0 && categories.length > 0 && !loading) {
      console.log('🔒 fetchCategories: Structure already exists, skipping to avoid data loss')
      setLoading(false)
      return
    }
    
    fetchCategoriesInProgress.current = true
    try {
      const endpoint = enableSubcategories ? '/api/subcategories' : '/api/categories'
      console.log('🌐 fetchCategories: Using endpoint:', endpoint, 'enableSubcategories:', enableSubcategories)
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
        if (response.status === 503) {
          console.warn('⚠️ Database temporarily unavailable, using fallback categories')
          // Use minimal fallback categories when database is unavailable
          const fallbackCategories = [
            { id: '1', name: 'Dining', description: 'Restaurants and food' },
            { id: '2', name: 'Travel', description: 'Travel and transportation' },
            { id: '3', name: 'Gas', description: 'Gas stations' },
            { id: '4', name: 'Groceries', description: 'Grocery stores' },
            { id: '5', name: 'Entertainment', description: 'Entertainment and recreation' },
            { id: '6', name: 'Shopping', description: 'Online and retail shopping' },
            { id: '7', name: 'Other', description: 'Other purchases' }
          ]
          setCategories(fallbackCategories)
          setError('⚠️ Using basic categories - database temporarily unavailable')
          setLoading(false)
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
      
      // Debug: Log categories with subcategory info
      console.log('📋 Categories loaded:', data.length, 'categories')
      data.forEach((cat: any) => {
        console.log(`📂 ${cat.name}: ${cat.subCategories?.length || 0} subcategories`)
        if (cat.subCategories?.length > 0) {
          console.log(`  ↳ Subcategories: ${cat.subCategories.map((sub: any) => sub.name).join(', ')}`)
        }
      })
      
      // Check if we have saved data that we should preserve
      const localSpending = localStorage.getItem('spending-data')
      const recommendationInput = localStorage.getItem('cc-recommendation-input')
      
      let hasSavedSpendingData = false
      let hasRecommendationInputData = false
      
      // Check local spending data
      if (localSpending) {
        try {
          const parsed = JSON.parse(localSpending)
          hasSavedSpendingData = Array.isArray(parsed) && parsed.length > 0
        } catch (error) {
          console.warn('Error parsing local spending data:', error)
        }
      }
      
      // Check recommendation input data
      if (recommendationInput) {
        try {
          const parsed = JSON.parse(recommendationInput)
          hasRecommendationInputData = parsed.userSpending && Array.isArray(parsed.userSpending) && parsed.userSpending.length > 0
        } catch (error) {
          console.warn('Error parsing recommendation input data:', error)
        }
      }
      
      const hasSavedData = hasSavedSpendingData || hasRecommendationInputData
      console.log('🔍 Checking for saved data in fetchCategories:', {
        hasSavedData,
        hasSavedSpendingData,
        hasRecommendationInputData,
        localSpendingExists: !!localSpending,
        recommendationInputExists: !!recommendationInput
      })
      
      // Always initialize spending structure if we don't have one - merge process will handle saved data
      if (spending.length === 0 && !initialDataLoaded) {
        console.log('🆕 Initializing spending structure (saved data will be merged if exists)')
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
          console.log('🆕 fetchCategories: Set subcategory spending structure with', spendingEntries.length, 'items')
        } else {
          // Standard category mode
          const freshSpending = data.map((cat: SpendingCategory) => ({
            categoryId: cat.id,
            categoryName: cat.name,
            monthlySpend: 0
          }))
          setSpending(freshSpending)
          console.log('🆕 fetchCategories: Set category spending structure with', freshSpending.length, 'items')
        }
      } else if (spending.length > 0 && !initialDataLoaded) {
        console.log('🔄 Adapting existing spending data to new category structure')
        // If we have existing spending data, we need to adapt it to the new category structure
        // This handles switching between standard and subcategory modes
        // IMPORTANT: Only do this if initial data hasn't been loaded yet
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
        console.log('🔄 fetchCategories: Set adapted spending structure with', newSpendingStructure.filter(s => s.monthlySpend > 0).length, 'non-zero items')
      } else if (spending.length > 0 && initialDataLoaded) {
        console.log('🔒 fetchCategories: Initial data already loaded, preserving current spending data')
      } else {
        console.log('⏳ Saved data exists, will be loaded by useEffect')
        // Always create the spending structure if we don't have one - the merge process will handle preserving saved data
        if (spending.length === 0 && !initialDataLoaded) {
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
            console.log('⏳ fetchCategories: Set empty subcategory structure for data loading with', spendingEntries.length, 'items')
          } else {
            const emptySpending = data.map((cat: SpendingCategory) => ({
              categoryId: cat.id,
              categoryName: cat.name,
              monthlySpend: 0
            }))
            setSpending(emptySpending)
            console.log('⏳ fetchCategories: Set empty category structure for data loading with', emptySpending.length, 'items')
          }
        } else {
          console.log('🔒 fetchCategories: Skipping structure creation - spending.length:', spending.length, 'initialDataLoaded:', initialDataLoaded)
        }
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setLoading(false)
    } finally {
      fetchCategoriesInProgress.current = false
    }
  }

  // Handle input changes with zero value feedback
  const handleInputChange = useCallback((value: string, id: string, isSubcategory: boolean = false) => {
    console.log('🔍 handleInputChange called with:', { value, id, isSubcategory })
    
    // Allow empty string to clear the field
    if (value === '') {
      console.log('📝 Empty value, clearing field')
      setTempZeroInputs(prev => ({ ...prev, [id]: false }))
      updateSpending(id, 0, isSubcategory)
      return
    }
    
    // Only allow numbers and one decimal point
    const numericRegex = /^\d*\.?\d*$/
    const isValidFormat = numericRegex.test(value)
    console.log('🔍 Regex test:', { value, isValidFormat, regex: numericRegex.toString() })
    
    if (!isValidFormat) {
      console.log('❌ Invalid format, rejecting input')
      return // Don't update if invalid characters
    }
    
    const numValue = parseFloat(value) || 0
    console.log('🔢 Parsed number value:', numValue)
    
    // Show feedback if user enters 0, then clear the field after a brief delay
    if (value === '0' || value === '0.00') {
      console.log('💡 Zero detected, showing feedback')
      
      // Clear any existing timeouts first
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current)
      
      setShowZeroInputFeedback(true)
      setTempZeroInputs(prev => ({ ...prev, [id]: true }))
      
      // Hide feedback after 5 seconds (increased from 4)
      feedbackTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Hiding feedback after timeout')
        setShowZeroInputFeedback(false)
      }, 5000)
      
      // Clear the temp display and field after 2 seconds (increased from 1.5)
      clearTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Clearing temp zero display')
        setTempZeroInputs(prev => ({ ...prev, [id]: false }))
        updateSpending(id, 0, isSubcategory)
      }, 2000)
    } else {
      // For non-zero values, clear temp state and update normally
      setTempZeroInputs(prev => ({ ...prev, [id]: false }))
      updateSpending(id, numValue, isSubcategory)
    }
  }, [])

  const updateSpending = (id: string, amount: number, isSubcategory: boolean = false) => {
    console.log('🖊️ User input:', { id, amount, isSubcategory })
    console.log('🖊️ Current spending state before update:', spending.filter(s => s.monthlySpend > 0))
    
    setSpending(prev => {
      const updated = prev.map(s => {
        const matchId = isSubcategory ? s.subCategoryId : s.categoryId
        const matches = matchId === id
        if (matches) {
          console.log('🎯 Found matching spending item:', { 
            categoryName: s.categoryName, 
            oldAmount: s.monthlySpend, 
            newAmount: amount,
            isSubcategory,
            matchId
          })
        }
        return matches 
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
    await userState.updatePointValue(newValue)
    
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
    setError(null)
    
    try {
      const activeSpending = spending.filter(s => s.monthlySpend > 0)
      
      if (activeSpending.length === 0) {
        setError('Please enter your spending amounts to get recommendations.')
        return
      }

      // Save spending data for persistence
      localStorage.setItem('spending-data', JSON.stringify(spending))
      
      // Transform spending data to the format expected by the API
      const apiSpending = activeSpending.map(spending => ({
        categoryName: spending.categoryName,
        monthlySpend: spending.monthlySpend
      }))

      console.log('🚀 Sending to API:', {
        userSpending: apiSpending,
        rewardPreference,
        pointValue,
        cardCustomizations
      })

      // Call the recommendations API
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userSpending: apiSpending,
          rewardPreference,
          pointValue,
          cardCustomizations,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`API Error: ${response.status} - ${errorData}`)
      }

      const data = await response.json()
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('No recommendations found for your spending pattern.')
      }

      // Store recommendations and navigate to results
      setRecommendations(data)
      localStorage.setItem('cc-recommendations', JSON.stringify(data))
      
      // Store complete input payload for results page to use
      const inputPayload = {
        userSpending: activeSpending, // Store the full spending data with categories
        rewardPreference,
        pointValue,
        cardCustomizations
      }
      localStorage.setItem('cc-recommendation-input', JSON.stringify(inputPayload))
      
      // Navigate to results page
      router.push('/results')
      
    } catch (error) {
      console.error('Error calculating recommendations:', error)
      setError(error instanceof Error ? error.message : 'Failed to calculate recommendations. Please try again.')
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

  const handleRewardPreferenceChange = async (newPreference: 'cashback' | 'points' | 'best_overall') => {
    console.log('🎯 REWARD PREFERENCE CLICK DEBUG:', {
      newPreference,
      sessionExists: !!session,
      sessionUserEmail: session?.user?.email,
      sessionStatus: status,
      userSubscriptionTier,
      upgradePromptOpen,
      upgradePromptFeature
    })
    
    // Check if user is trying to access premium features without subscription
    // For non-authenticated users OR free tier users, show upgrade prompt
    const isAuthenticated = !!session?.user?.email
    const isPremiumFeature = newPreference === 'points' || newPreference === 'best_overall'
    
    console.log('🎯 PREMIUM FEATURE CHECK:', {
      isPremiumFeature,
      isAuthenticated,
      userSubscriptionTier,
      shouldBlock: isPremiumFeature && (!isAuthenticated || userSubscriptionTier === 'free')
    })
    
    if (isPremiumFeature && (!isAuthenticated || userSubscriptionTier === 'free')) {
      console.log('🚫 BLOCKING PREMIUM FEATURE - SHOWING UPGRADE PROMPT')
      
      const featureName = newPreference === 'points' ? 'Points Optimization' : 'Best Overall Analysis'
      const description = newPreference === 'points' 
        ? 'Access premium travel and points cards with advanced optimization for maximum point earning potential.'
        : 'Compare both cashback and points cards to find the absolute best option for your spending patterns.'
      
      console.log('🚫 Setting upgrade prompt state:', {
        featureName,
        description,
        aboutToSetOpen: true
      })
      
      setUpgradePromptFeature(featureName)
      setUpgradePromptDescription(description)
      setUpgradePromptOpen(true)
      
      console.log('🚫 Upgrade prompt state set, returning early')
      return
    }
    
    console.log('🎯 SpendingForm: Allowing preference change to:', newPreference)
    const result = await userState.updateRewardPreference(newPreference)
    
    if (!result.success) {
      console.error('🎯 SpendingForm: Failed to save preference')
    } else {
      console.log('🎯 SpendingForm: Preference saved successfully')
    }
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
      {/* Full Width Header Section */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center justify-between mb-0">
          <div className="flex items-center flex-1">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
                💳 Monthly Spending by Category
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Enter your average monthly spending for each category
              </p>
            </div>
          </div>
          
          {/* How to get started info box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-600 max-w-lg ml-8 flex items-center">
            <div className="flex items-start space-x-3">
              <span className="text-blue-500 text-xl flex-shrink-0">💡</span>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How to get started:</h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Enter your <strong>monthly</strong> spending amounts in each category</li>
                  <li>• Use estimates - they don't need to be exact</li>
                  <li>• Focus on your largest spending categories first</li>
                  <li>• We'll calculate your annual totals and find the best cards for you</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-8xl mx-auto">
        {/* Left Side - Categories Grid (3/4 width) */}
        <div className="lg:col-span-3">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
        
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enableSubcategories ? (
            // Subcategory mode: uniform height cards with scrollable subcategories
                  (() => {
                    console.log('🔍 Rendering SUBCATEGORY mode with', categories.length, 'categories')
                    console.log('🔍 Categories have subcategories:', categories.map(c => ({ name: c.name, hasSubCategories: !!c.subCategories, count: c.subCategories?.length || 0 })))
                    return categories.map((category) => (
                      <div key={category.id} className="h-[24rem] bg-gray-50/50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 p-4 flex flex-col relative group hover:scale-105 hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => setExpandedCategoryId(category.id)}>
                        {/* Hover Tooltip */}
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-4 py-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-72 text-center">
                          Click to view all {category.subCategories?.length || 0} subcategories
                        </div>
                        
                        <div className="flex flex-col h-full">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <label className="block text-lg font-semibold text-gray-900 dark:text-white">
                    {category.name}
                              </label>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{category.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {formatCurrency((() => {
                                  const currentSpending = spending.find(s => s.categoryId === category.id)
                                  return currentSpending?.monthlySpend || 0
                                })())}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">per month</p>
                            </div>
                </div>
                
                          {/* General Category Input */}
                {(() => {
                  const currentSpending = spending.find(s => s.categoryId === category.id)
                  const amount = currentSpending?.monthlySpend || 0
                  
                  return (
                              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-600">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-900 dark:text-white">
                            General {category.name}
                          </label>
                          <InfoTooltip 
                            content={categoryTooltips[category.name] || ['Spending in this category']}
                            position="top"
                            iconClassName="w-3 h-3"
                            ariaLabel={`Information about ${category.name} spending category`}
                          />
                        </div>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                        Other {category.name.toLowerCase()} not listed below
                      </p>
                      
                      <div className="space-y-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={tempZeroInputs[category.id] ? '0' : (amount || '')}
                          onChange={(e) => handleInputChange(e.target.value, category.id, false)}
                                    onClick={(e) => e.stopPropagation()}
                          className="w-full px-2 py-1 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Monthly amount ($)"
                        />
                      </div>
                    </div>
                  )
                })()}
                
                          {/* Subcategories - Scrollable Area with Modal Trigger */}
                {category.subCategories && category.subCategories.length > 0 && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center flex-1">
                        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                        <span className="px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Subcategories
                        </span>
                        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                      </div>
                    </div>
                    
                              <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent relative max-h-32">
                                <div className="grid gap-2 grid-cols-1 pb-2">
                                {category.subCategories.slice(0, 3).map((subCategory) => {
                        const currentSpending = spending.find(s => s.subCategoryId === subCategory.id)
                        const amount = currentSpending?.monthlySpend || 0
                        
                        return (
                                    <div key={subCategory.id} className="p-2 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500">
                                      <div className="flex justify-between items-center mb-1">
                              <div className="flex-1 min-w-0">
                                          <label className="text-xs font-medium text-gray-900 dark:text-white block truncate">
                                  📍 {subCategory.name}
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {subCategory.description}
                                </p>
                              </div>
                                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 ml-2">
                                {formatCurrency(amount)}
                              </span>
                            </div>
                            
                                      <div className="space-y-1">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={tempZeroInputs[subCategory.id] ? '0' : (amount || '')}
                                onChange={(e) => handleInputChange(e.target.value, subCategory.id, true)}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-full px-2 py-1 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                                          placeholder="Monthly amount ($)"
                              />
                            </div>
                          </div>
                        )
                                              })}
                      </div>
                                
                                {/* Show more button if there are more than 3 subcategories */}
                                {category.subCategories.length > 3 && (
                                  <div className="mt-2 text-center">
                                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium pointer-events-none">
                                      View all {category.subCategories.length} subcategories →
                                    </div>
                                  </div>
                      )}
                    </div>
                  </div>
                )}
                        </div>
              </div>
            ))
                  })()
          ) : (
            // Standard category mode
            categories.map((category) => {
                    console.log('🔍 Rendering STANDARD mode for category:', category.name, 'hasSubCategories:', !!category.subCategories)
              const currentSpending = spending.find(s => s.categoryId === category.id)
              const amount = currentSpending?.monthlySpend || 0
              
              return (
                      <div key={category.id} className="space-y-3 p-5 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="block text-lg font-semibold text-gray-900 dark:text-white">
                          {category.name}
                        </label>
                        <InfoTooltip 
                          content={categoryTooltips[category.name] || ['Spending in this category']}
                          position="top"
                          ariaLabel={`Information about ${category.name} spending category`}
                        />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{category.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(amount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">per month</p>
                    </div>
                  </div>

                  {/* Text Input */}
                        <div className="space-y-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Exact amount:</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={tempZeroInputs[category.id] ? '0' : (amount || '')}
                      onChange={(e) => handleInputChange(e.target.value, category.id, false)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Monthly amount ($)"
                    />
                  </div>
                </div>
              )
            })
          )}
            </div>
          </div>
        </div>
        
        {/* Right Sidebar - Controls & Summary (1/4 width) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Total Spending Display */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sticky top-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
              💰 Total Spending
            </h3>
            <div className="text-center space-y-3">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalMonthlySpend)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">per month</p>
              <p className="text-xl font-semibold text-gray-600 dark:text-gray-300">
                {formatCurrency(totalMonthlySpend * 12)} annually
              </p>
            </div>
          </div>

          {/* Subcategories Toggle */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Subcategories</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Get more precise recommendations with specific subcategories like Amazon, Whole Foods, Hotels, etc.
              </p>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSubcategories}
                  onChange={(e) => {
                    console.log('🔄 Subcategory toggle changed to:', e.target.checked)
                    console.log('📊 Current categories data:', categories.map(c => ({ 
                      name: c.name, 
                      hasSubCategories: !!c.subCategories, 
                      subCategoryCount: c.subCategories?.length || 0 
                    })))
                    
                    // Update the preference first
                    userState.updateSubcategoryPreference(e.target.checked)
                    
                    // Clear categories and spending to force a complete refresh
                    setCategories([])
                    setSpending([])
                    setLoading(true)
                    setInitialDataLoaded(false) // Reset to allow new data structure
                    
                    // Small delay to ensure state has updated, then refetch
                    setTimeout(() => {
                      fetchCategories()
                    }, 200)
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                  {enableSubcategories ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>

          {/* Spending Insights */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">💡 Quick Insights</h3>
              
              {totalMonthlySpend > 0 ? (
                <div className="space-y-3">
                  {(() => {
                    // Calculate top spending categories
                    const categoryTotals = categories.map(cat => {
                      const categorySpending = spending.find(s => s.categoryId === cat.id)?.monthlySpend || 0
                      const subcategorySpending = enableSubcategories ? 
                        spending.filter(s => s.subCategoryId && cat.subCategories?.some(sub => sub.id === s.subCategoryId))
                          .reduce((sum, s) => sum + s.monthlySpend, 0) : 0
                      return {
                        name: cat.name,
                        total: Math.max(categorySpending, subcategorySpending)
                      }
                    }).filter(cat => cat.total > 0).sort((a, b) => b.total - a.total)

                    const topCategory = categoryTotals[0]
                    const secondCategory = categoryTotals[1]
                    
                    return (
                      <>
                        {topCategory && (
                          <div className="text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Top category:</span>
                            <div className="font-semibold text-blue-600 dark:text-blue-400">
                              {topCategory.name} ({formatCurrency(topCategory.total)})
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {((topCategory.total / totalMonthlySpend) * 100).toFixed(0)}% of total spending
                            </div>
                          </div>
                        )}
                        
                        {secondCategory && (
                          <div className="text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Second highest:</span>
                            <div className="font-semibold text-purple-600 dark:text-purple-400">
                              {secondCategory.name} ({formatCurrency(secondCategory.total)})
                            </div>
                          </div>
                        )}
                        
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-semibold">{categoryTotals.length}</span> categories with spending
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Average: {formatCurrency(totalMonthlySpend / Math.max(categoryTotals.length, 1))} per category
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>💭 Enter your spending amounts above to see personalized insights and recommendations.</p>
                  <p className="mt-2 text-xs">Tip: Start with your largest spending categories first!</p>
                </div>
              )}
            </div>
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
                className={`p-4 rounded-xl border-2 transition-all duration-200 relative group ${
                  rewardPreference === 'cashback'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-500'
                }`}
              >
                {/* Hover Tooltip */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-96 text-center whitespace-nowrap">
                  Get cash back directly - simple and straightforward
                </div>
                
                <div className="text-center">
                  <div className="text-2xl mb-2">💵</div>
                  <div className="font-semibold">Cashback</div>
                  <div className="text-sm opacity-75">Direct cash rewards</div>
                </div>
              </button>
              
              <button
                onClick={() => handleRewardPreferenceChange('points')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 relative group ${
                  rewardPreference === 'points'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-500'
                }`}
              >
                {/* Hover Tooltip */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-96 text-center whitespace-nowrap">
                  Earn points/miles for travel, hotels, or transfer to airline partners
                </div>
                
                <div className="text-center">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="font-semibold">Points/Miles</div>
                  <div className="text-sm opacity-75">Travel & transfer partners</div>
                  {userSubscriptionTier !== 'premium' && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      PRO
                    </div>
                  )}
                </div>
              </button>

              <button
                onClick={() => handleRewardPreferenceChange('best_overall')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 relative group ${
                  rewardPreference === 'best_overall'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-green-300 dark:hover:border-green-500'
                }`}
              >
                {/* Hover Tooltip */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-96 text-center whitespace-nowrap">
                  Compare both cash and points value to find the highest total return
                </div>
                
                <div className="text-center">
                  <div className="text-2xl mb-2">🏆</div>
                  <div className="font-semibold">Best Overall</div>
                  <div className="text-sm opacity-75">Compare cash & points</div>
                  {userSubscriptionTier !== 'premium' && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      PRO
                    </div>
                  )}
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
        </div>
      </div>

      {/* System Status & Calculate Button */}
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <Button
            onClick={totalMonthlySpend === 0 ? undefined : calculateRecommendations}
            aria-disabled={totalMonthlySpend === 0 || calculating}
            aria-describedby={totalMonthlySpend === 0 ? 'cta-helper-text' : undefined}
            className={`px-12 py-4 text-xl font-semibold rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 ${
              totalMonthlySpend === 0 || calculating
                ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed opacity-75 grayscale'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transform hover:scale-105'
            }`}
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
          
          {/* Helper text for disabled state */}
          {totalMonthlySpend === 0 && !calculating && (
            <p 
              id="cta-helper-text"
              className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 max-w-md mx-auto"
              role="status"
              aria-live="polite"
            >
              💡 Enter at least one monthly amount to get recommendations
            </p>
          )}

          {/* Zero input feedback */}
          {showZeroInputFeedback && (
            <div className="max-w-lg mx-auto mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 border border-amber-200 dark:border-amber-700 rounded-xl shadow-lg animate-fade-in">
              <div className="flex items-start space-x-3">
                <span className="text-amber-600 dark:text-amber-400 text-xl flex-shrink-0">💡</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                    No need to enter $0
                  </h3>
                  <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                    Simply leave categories blank if you don't spend money there. Empty fields and $0 amounts are treated the same way.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

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

      </div>

      {/* Category Expansion Modal */}
      {expandedCategoryId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            {(() => {
              const expandedCategory = categories.find(cat => cat.id === expandedCategoryId)
        if (!expandedCategory) return null
        
        return (
                <>
              {/* Modal Header */}
                  <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center">
                  <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {expandedCategory.name} Subcategories
                    </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {expandedCategory.description}
                        </p>
                  </div>
                  <button
                    onClick={() => setExpandedCategoryId(null)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-bold"
                  >
                        ×
                  </button>
                </div>
              </div>

                  {/* Modal Body */}
                  <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {/* Main Category */}
                    {(() => {
                      const currentSpending = spending.find(s => s.categoryId === expandedCategory.id)
                      const amount = currentSpending?.monthlySpend || 0
                      
                      return (
                        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-600">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <label className="text-lg font-semibold text-gray-900 dark:text-white">
                        General {expandedCategory.name}
                      </label>
                      <InfoTooltip 
                        content={categoryTooltips[expandedCategory.name] || ['Spending in this category']}
                        position="top"
                        ariaLabel={`Information about ${expandedCategory.name} spending category`}
                      />
                    </div>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {formatCurrency(amount)}
                    </span>
                  </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Other {expandedCategory.name.toLowerCase()} not listed below
                  </p>
                  
                    <input
                      type="text"
                      inputMode="numeric"
                            value={tempZeroInputs[expandedCategory.id] ? '0' : (amount || '')}
                      onChange={(e) => handleInputChange(e.target.value, expandedCategory.id, false)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Monthly amount ($)"
                    />
                  </div>
                      )
                    })()}

                    {/* All Subcategories */}
                    <div className="grid gap-4 md:grid-cols-2">
                    {expandedCategory.subCategories?.map((subCategory) => {
                      const currentSpending = spending.find(s => s.subCategoryId === subCategory.id)
                      const amount = currentSpending?.monthlySpend || 0
                      
                      return (
                          <div key={subCategory.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex-1">
                                <label className="text-base font-medium text-gray-900 dark:text-white block">
                                📍 {subCategory.name}
                              </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {subCategory.description}
                              </p>
                            </div>
                              <span className="text-base font-bold text-purple-600 dark:text-purple-400 ml-3">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                          
                            <input
                              type="text"
                              inputMode="numeric"
                              value={tempZeroInputs[subCategory.id] ? '0' : (amount || '')}
                              onChange={(e) => handleInputChange(e.target.value, subCategory.id, true)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder="Monthly amount ($)"
                            />
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Modal Footer */}
                  <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-end">
                  <button
                    onClick={() => setExpandedCategoryId(null)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
                </>
        )
      })()}
          </div>
        </div>
      )}

      {/* Upgrade Prompt Modal */}
      <UpgradePrompt
        isOpen={upgradePromptOpen}
        onClose={() => setUpgradePromptOpen(false)}
        feature={upgradePromptFeature}
        description={upgradePromptDescription}
      />
    </div>
  )
} 