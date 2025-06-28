"use client"

import React from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface UpgradePromptProps {
  isOpen: boolean
  onClose: () => void
  feature: string
  description: string
}

export function UpgradePrompt({ isOpen, onClose, feature, description }: UpgradePromptProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5">
                <span className="text-lg">🚀</span>
              </div>
              <div>
                <h3 className="text-lg font-bold">Upgrade to Premium</h3>
                <p className="text-xs opacity-90">Unlock advanced features</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl mb-3 shadow-lg">
              <span className="text-lg">⭐</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {feature} is a Premium Feature
            </h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {description}
            </p>
          </div>

          {/* Features comparison */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-4 mb-4">
            <h5 className="font-bold text-gray-900 dark:text-white mb-3 text-center text-sm">
              What you get with Premium:
            </h5>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="bg-green-500 rounded-full p-0.5">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300 text-sm">All premium annual fee credit cards</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-green-500 rounded-full p-0.5">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300 text-sm">Multi-card optimization strategies</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-green-500 rounded-full p-0.5">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300 text-sm">Portfolio analysis & optimization</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-green-500 rounded-full p-0.5">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300 text-sm">Points & travel rewards optimization</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-green-500 rounded-full p-0.5">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300 text-sm">Advanced benefit customization</span>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatCurrency(9.99)}<span className="text-base font-normal text-gray-600 dark:text-gray-400">/month</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Cancel anytime • 7-day free trial
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col space-y-2">
            <Link href="/pricing">
              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-full font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 text-sm"
              >
                🚀 Upgrade to Premium
              </button>
            </Link>
            <button
              onClick={onClose}
              className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-4 py-2 rounded-full transition-colors text-sm"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 