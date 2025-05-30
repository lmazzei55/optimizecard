'use client'

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  const handleDemoSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    try {
      const result = await signIn("credentials", { 
        email, 
        callbackUrl,
        redirect: false
      })
      
      if (result?.error) {
        console.error("Sign in error:", result.error)
      } else if (result?.url) {
        window.location.href = result.url
      }
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-3xl">💳</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sign in to save your preferences and get personalized recommendations
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-red-500 text-xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-300">Sign in failed</h3>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error === "CredentialsSignin" && "Invalid email address"}
                  {error === "Configuration" && "Server configuration error"}
                  {error === "AccessDenied" && "Access denied"}
                  {!["CredentialsSignin", "Configuration", "AccessDenied"].includes(error) && "An error occurred during sign in"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sign In Form */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          
          {/* Demo Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 text-xl">ℹ️</span>
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-300">Demo Mode</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Enter any email address to create a demo account and test the application.
                </p>
              </div>
            </div>
          </div>

          {/* Email Sign In */}
          <form onSubmit={handleDemoSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="demo@example.com"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>🚀</span>
                  <span>Sign In / Create Account</span>
                </div>
              )}
            </button>
          </form>

          {/* Quick Demo Buttons */}
          <div className="mt-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Quick Demo
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setEmail("cashback.user@demo.com")}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl py-2 px-3 text-green-700 dark:text-green-300 font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200 text-sm disabled:opacity-50"
              >
                <span>💵</span>
                <span>Cashback User</span>
              </button>
              
              <button
                onClick={() => setEmail("points.user@demo.com")}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl py-2 px-3 text-purple-700 dark:text-purple-300 font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-200 text-sm disabled:opacity-50"
              >
                <span>🎯</span>
                <span>Points User</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This is a demo application. Your data will be stored locally for testing purposes.
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link 
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
} 