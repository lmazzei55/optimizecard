"use client"

import { SpendingForm } from "@/components/SpendingForm"
import { Header } from "@/components/Header"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: 'noindex, nofollow', // Tell search engines not to index this page
}

// Prevent static generation to avoid useSearchParams issues
export const dynamic = 'force-dynamic'

function DashboardContent() {
  const searchParams = useSearchParams()
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false)

  useEffect(() => {
    if (searchParams?.get('upgraded') === 'true') {
      setShowUpgradeSuccess(true)
      // Auto-hide after 5 seconds
      setTimeout(() => setShowUpgradeSuccess(false), 5000)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-purple-100/20 to-pink-100/20 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/30 dark:from-purple-800/30 dark:to-pink-800/30 rounded-full blur-3xl translate-x-32 -translate-y-32"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 dark:from-blue-800/30 dark:to-indigo-800/30 rounded-full blur-3xl -translate-x-32 translate-y-32"></div>
      
      <Header />

      <main className="py-12 relative z-10">
        <div className="container mx-auto px-4">
          {/* Upgrade Success Message */}
          {showUpgradeSuccess && (
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-2xl shadow-xl">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 rounded-full p-2">
                    <span className="text-2xl">🎉</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Welcome to Premium!</h3>
                    <p className="text-green-100">
                      You now have access to all premium credit cards and advanced features. Explore premium cards below!
                    </p>
                  </div>
                  <button
                    onClick={() => setShowUpgradeSuccess(false)}
                    className="ml-auto text-white/80 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl mb-6 shadow-xl transform hover:scale-110 transition-transform duration-300">
              <span className="text-2xl">📊</span>
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
              Your Dashboard
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
              Tell us about your spending patterns to get <span className="font-semibold text-purple-600 dark:text-purple-400">personalized credit card recommendations</span> tailored just for you.
            </p>
          </div>

          {/* Main Content */}
          <div className="max-w-6xl mx-auto">
            <SpendingForm />
          </div>

          {/* Footer Tips */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-blue-50/80 via-purple-50/80 to-pink-50/80 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 backdrop-blur-sm rounded-3xl p-8 max-w-4xl mx-auto border border-white/30 dark:border-gray-700/30">
              <div className="text-3xl mb-4">💡</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Pro Tips for Better Recommendations
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Be Accurate</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Use your actual monthly spending for the most precise recommendations.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">⚙️</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Customize Benefits</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Use the customize buttons to adjust benefit values based on your usage.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🎯</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Try Different Values</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Experiment with point valuations to see how rankings change.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
} 