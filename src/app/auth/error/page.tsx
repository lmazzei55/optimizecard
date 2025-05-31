'use client'

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"

// Prevent static generation to avoid useSearchParams issues
export const dynamic = 'force-dynamic'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get("error") || null

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return "There is a problem with the server configuration."
      case "AccessDenied":
        return "Access denied. You do not have permission to sign in."
      case "Verification":
        return "The verification token has expired or has already been used."
      case "Default":
      default:
        return "An unexpected error occurred during authentication."
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Authentication Error
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {getErrorMessage(error)}
          </p>
        </div>

        {/* Error Details */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-6">
          <div className="text-center space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                What happened?
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                {getErrorMessage(error)}
              </p>
              {error && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                  Error code: {error}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                What can you do?
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 text-left">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Try signing in again with a different method</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Check your email for any verification links</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Clear your browser cache and cookies</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Contact support if the problem persists</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 block text-center"
          >
            Try Again
          </Link>
          
          <Link
            href="/"
            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 block text-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  )
} 