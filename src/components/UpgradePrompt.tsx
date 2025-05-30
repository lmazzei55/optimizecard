"use client"

import Link from "next/link"
import { useState } from "react"

interface UpgradePromptProps {
  premiumCardsCount: number
  onClose?: () => void
}

export function UpgradePrompt({ premiumCardsCount, onClose }: UpgradePromptProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white relative overflow-hidden mb-8">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Crown icon */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="bg-yellow-400 rounded-full p-2">
          <span className="text-2xl">👑</span>
        </div>
        <div>
          <h3 className="text-xl font-bold">Unlock Premium Cards</h3>
          <p className="text-purple-100">
            {premiumCardsCount} premium cards available with upgrade
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-yellow-300">✓</span>
          <span className="text-sm">Chase Sapphire Reserve & Preferred</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-yellow-300">✓</span>
          <span className="text-sm">American Express Gold & Platinum</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-yellow-300">✓</span>
          <span className="text-sm">Capital One Venture X</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-yellow-300">✓</span>
          <span className="text-sm">Advanced benefits optimization</span>
        </div>
      </div>

      <div className="flex space-x-3">
        <Link
          href="/pricing"
          className="flex-1 bg-white text-purple-600 font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-all duration-200 text-center"
        >
          View Pricing
        </Link>
        <button
          onClick={handleClose}
          className="px-4 py-3 text-white/80 hover:text-white transition-colors"
        >
          Maybe Later
        </button>
      </div>
    </div>
  )
} 