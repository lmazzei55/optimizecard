'use client'

import { UserStateLoadingOverlay } from '@/components/UserStateLoadingOverlay'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UserStateLoadingOverlay />
      {children}
    </>
  )
} 