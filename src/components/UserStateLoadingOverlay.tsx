'use client'

import { useUserState } from '@/hooks/useUserState'
import { Loader2 } from 'lucide-react'

export function UserStateLoadingOverlay() {
  const userState = useUserState()
  
  // Only show loading overlay if UserState is actively loading
  if (!userState.isLoading) {
    return null
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none bg-black/20">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl flex flex-col items-center pointer-events-auto">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-700 dark:text-gray-300">Loading your premium status...</p>
      </div>
    </div>
  )
} 