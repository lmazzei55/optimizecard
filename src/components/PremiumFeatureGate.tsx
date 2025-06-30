'use client'

import React, { useState, ReactNode } from 'react'
import { useSubscription } from '@/hooks/useSubscription'
import { UpgradePrompt } from '@/components/UpgradePrompt'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface PremiumFeatureGateProps {
  children: ReactNode
  featureName: string
  featureDescription: string
  fallbackComponent?: ReactNode
}

function FeaturesList({ featureName }: { featureName: string }) {
  const getFeatures = () => {
    if (featureName.includes('Multi-Card')) {
      return [
        { icon: '🎯', text: 'Optimal 2-3 card combinations' },
        { icon: '💳', text: 'Which card to use for each purchase' },
        { icon: '📊', text: 'Annual value calculations' }
      ]
    } else if (featureName.includes('Portfolio')) {
      return [
        { icon: '📈', text: 'Coverage & optimization scores' },
        { icon: '🔍', text: 'Category optimization opportunities' },
        { icon: '🎯', text: 'Diversification analysis' }
      ]
    } else {
      return [
        { icon: '🎯', text: 'Multi-card optimization strategies' },
        { icon: '📊', text: 'Portfolio analysis & optimization' },
        { icon: '💳', text: 'Premium credit cards access' }
      ]
    }
  }

  const features = getFeatures()

  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 mb-6 max-w-sm mx-auto">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
        {featureName} includes:
      </h4>
      <div className="space-y-2 text-sm">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span className="text-lg">{feature.icon}</span>
            <span className="text-gray-700 dark:text-gray-300">{feature.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PremiumFeatureGate({ 
  children, 
  featureName, 
  featureDescription, 
  fallbackComponent 
}: PremiumFeatureGateProps) {
  const { isPremium, loading } = useSubscription()
  const { data: session } = useSession()
  const isAuthenticated = !!session?.user
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  // Show loading state while checking subscription
  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </div>
    )
  }

  // If user has premium access, show the feature with proper props
  if (isPremium) {
    return <>{React.cloneElement(children as React.ReactElement, {
      isPremiumBlocked: false,
      isAuthenticated,
      featureName,
      featureDescription
    } as any)}</>
  }

  // NEW APPROACH: Always render children but provide upgrade prompt trigger
  // This allows components to show their UI but trigger upgrade prompts on interaction
  const triggerUpgradePrompt = () => {
    setShowUpgradePrompt(true)
  }

  // Return children with upgrade prompt functionality
  return (
    <>
      {React.cloneElement(children as React.ReactElement, {
        onUpgradePrompt: triggerUpgradePrompt,
        isPremiumBlocked: true,
        isAuthenticated,
        featureName,
        featureDescription
      } as any)}
      
      {/* Upgrade Prompt Modal */}
      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        feature={featureName}
        description={featureDescription}
      />
    </>
  )

} 