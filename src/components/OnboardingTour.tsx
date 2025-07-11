'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useUserState } from '@/hooks/useUserState'
import { createPortal } from 'react-dom'

interface TourStep {
  target: string
  title: string
  content: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  disableBeacon?: boolean
}

const tourSteps: TourStep[] = [
  {
    target: 'body',
    title: 'Welcome to Credit Card Optimizer! 🎉',
    content: (
      <p>Let me show you how to find the perfect credit card for your spending habits.</p>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.spending-categories',
    title: 'Enter Your Monthly Spending',
    content: (
      <p>Start by entering how much you spend in each category every month. Be as accurate as possible for the best recommendations!</p>
    ),
    placement: 'top',
  },
  {
    target: '.reward-preference',
    title: 'Choose Your Reward Type',
    content: (
      <div>
        <p><strong>Cashback:</strong> Get money back on your purchases</p>
        <p><strong>Points:</strong> Earn travel points and rewards (Premium)</p>
        <p><strong>Best Overall:</strong> See the highest value option (Premium)</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '.subcategories-toggle',
    title: 'Enable Subcategories',
    content: (
      <p>Get more precise recommendations by enabling subcategories like Amazon, Whole Foods, Hotels, and more!</p>
    ),
    placement: 'top',
  },
  {
    target: '.calculate-button',
    title: 'Get Your Recommendations',
    content: (
      <p>Once you've entered your spending, click this button to see which credit cards will earn you the most rewards!</p>
    ),
    placement: 'top',
  },
  {
    target: '.user-menu',
    title: 'Your Profile',
    content: (
      <p>Access your profile to save preferences, view your saved cards, and manage your subscription.</p>
    ),
    placement: 'bottom',
  },
]

interface TooltipProps {
  step: TourStep
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  onClose: () => void
}

function Tooltip({ step, currentStep, totalSteps, onNext, onPrev, onSkip, onClose }: TooltipProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const calculatePosition = () => {
      if (step.target === 'body') {
        // Center the tooltip for body target
        setPosition({
          top: window.innerHeight / 2 - 100,
          left: window.innerWidth / 2 - 190,
        })
        return
      }

      const targetElement = document.querySelector(step.target)
      if (!targetElement || !tooltipRef.current) return

      const targetRect = targetElement.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const padding = 16

      let top = 0
      let left = 0

      switch (step.placement || 'bottom') {
        case 'top':
          top = targetRect.top - tooltipRect.height - padding
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2
          break
        case 'bottom':
          top = targetRect.bottom + padding
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2
          break
        case 'left':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2
          left = targetRect.left - tooltipRect.width - padding
          break
        case 'right':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2
          left = targetRect.right + padding
          break
      }

      // Keep tooltip within viewport
      const maxLeft = window.innerWidth - tooltipRect.width - padding
      const maxTop = window.innerHeight - tooltipRect.height - padding

      left = Math.max(padding, Math.min(left, maxLeft))
      top = Math.max(padding, Math.min(top, maxTop))

      setPosition({ top, left })
    }

    calculatePosition()
    window.addEventListener('resize', calculatePosition)
    window.addEventListener('scroll', calculatePosition)

    return () => {
      window.removeEventListener('resize', calculatePosition)
      window.removeEventListener('scroll', calculatePosition)
    }
  }, [step])

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[10001] bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm animate-fadeIn"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {currentStep + 1} of {totalSteps}
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          aria-label="Close tour"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {step.title}
      </h3>
      <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        {step.content}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onSkip}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Skip tour
        </button>
        <div className="flex gap-2">
          {currentStep > 0 && (
            <button
              onClick={onPrev}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
            >
              Back
            </button>
          )}
          <button
            onClick={onNext}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function OnboardingTour({ forceTour = false }: { forceTour?: boolean }) {
  const { data: session } = useSession()
  const userState = useUserState()
  const [currentStep, setCurrentStep] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null)

  // Check if user has completed the tour before
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('onboarding-tour-completed')
    const hasSeenTour = localStorage.getItem('onboarding-tour-seen')
    
    // Start tour for new users or if forced
    if (forceTour || (!hasSeenTour && !hasCompletedTour)) {
      // Small delay to ensure page is fully loaded
      setTimeout(() => {
        setIsActive(true)
        localStorage.setItem('onboarding-tour-seen', 'true')
      }, 1000)
    }
  }, [forceTour])

  // Filter steps based on current page and user state
  const getRelevantSteps = useCallback(() => {
    let steps = [...tourSteps]
    
    // Remove user menu step if not authenticated
    if (!session?.user) {
      steps = steps.filter(step => step.target !== '.user-menu')
    }
    
    return steps
  }, [session])

  const relevantSteps = getRelevantSteps()
  const currentStepData = relevantSteps[currentStep]

  // Highlight current element
  useEffect(() => {
    if (!isActive || !currentStepData) return

    if (currentStepData.target === 'body') {
      setHighlightedElement(null)
      return
    }

    const element = document.querySelector(currentStepData.target)
    if (element) {
      setHighlightedElement(element)
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isActive, currentStepData])

  const handleNext = useCallback(() => {
    if (currentStep < relevantSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }, [currentStep, relevantSteps.length])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const handleComplete = useCallback(() => {
    setIsActive(false)
    setCurrentStep(0)
    setHighlightedElement(null)
    localStorage.setItem('onboarding-tour-completed', 'true')
    
    // If user is logged in, we could save this preference to their account
    if (session?.user?.email) {
      // TODO: Save tour completion status to user preferences via API
      console.log('Tour completed for user:', session.user.email)
    }
  }, [session])

  if (!isActive || !currentStepData) return null

  return createPortal(
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[10000]">
        {/* Dark background */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Highlight hole */}
        {highlightedElement && (
          <div
            className="absolute bg-transparent"
            style={{
              top: highlightedElement.getBoundingClientRect().top - 8,
              left: highlightedElement.getBoundingClientRect().left - 8,
              width: highlightedElement.getBoundingClientRect().width + 16,
              height: highlightedElement.getBoundingClientRect().height + 16,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              borderRadius: '8px',
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <Tooltip
        step={currentStepData}
        currentStep={currentStep}
        totalSteps={relevantSteps.length}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleComplete}
        onClose={handleComplete}
      />
    </>,
    document.body
  )
}

// Hook to control tour from other components
export function useOnboardingTour() {
  const restartTour = () => {
    localStorage.removeItem('onboarding-tour-completed')
    localStorage.removeItem('onboarding-tour-seen')
    window.location.reload() // Reload to restart the tour
  }

  const completeTour = () => {
    localStorage.setItem('onboarding-tour-completed', 'true')
    localStorage.setItem('onboarding-tour-seen', 'true')
  }

  const isTourCompleted = () => {
    return localStorage.getItem('onboarding-tour-completed') === 'true'
  }

  return {
    restartTour,
    completeTour,
    isTourCompleted,
  }
} 