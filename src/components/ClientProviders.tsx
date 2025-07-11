'use client'

import { UserStateLoadingOverlay } from '@/components/UserStateLoadingOverlay'
import { OnboardingTour } from '@/components/OnboardingTour'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UserStateLoadingOverlay />
      <OnboardingTour />
      {children}
    </>
  )
} 