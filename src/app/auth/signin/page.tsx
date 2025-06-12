'use client'

import { signIn } from "next-auth/react"
import { useState, Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

// Prevent static generation to avoid useSearchParams issues
export const dynamic = 'force-dynamic'

// Helper to get initial provider state (will be updated from server)
const getInitialProviderState = () => {
  return {
    google: false,
    github: false,
    facebook: false,
    twitter: false,
    resend: false,
    demo: false
  }
}

function SignInContent() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [providers, setProviders] = useState(getInitialProviderState())
  const [providersLoading, setProvidersLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const error = searchParams?.get("error") || null
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard"

  // Fetch available providers from server
  useEffect(() => {
    // Clear any stale authentication state on signin page load
    const clearStaleAuthState = () => {
      try {
        // Clear NextAuth related localStorage/sessionStorage items that might interfere
        const authKeys = [
          'next-auth.session-token',
          'next-auth.callback-url', 
          'next-auth.csrf-token',
          '__Secure-next-auth.session-token',
          '__Secure-next-auth.callback-url',
          '__Host-next-auth.csrf-token'
        ]
        
        authKeys.forEach(key => {
          localStorage.removeItem(key)
          sessionStorage.removeItem(key)
        })
        
        console.log('🧹 Cleared stale authentication state for fresh login')
      } catch (error) {
        console.warn('⚠️ Could not clear stale auth state:', error)
      }
    }
    
    // Only clear on signin page if there's an error (indicating failed previous attempt)
    if (error) {
      clearStaleAuthState()
    }
    
    fetch('/api/auth/provider-status')
      .then(res => res.json())
      .then(data => {
        setProviders(data)
        setProvidersLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch provider availability:', err)
        // Fallback to safe defaults
        setProviders(getInitialProviderState())
        setProvidersLoading(false)
      })
  }, [error])

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true)
    setAuthError(null)
    
    try {
      const result = await signIn(provider, { 
        callbackUrl,
        redirect: false 
      })
      
      if (result?.error) {
        // Only log sensitive errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error(`${provider} sign in error:`, result.error)
        }
        
        // Generic error message for security
        setAuthError(`Sign-in with ${provider} failed. Please try again or contact support.`)
      } else if (result?.url) {
        window.location.href = result.url
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`${provider} sign in error:`, error)
      }
      setAuthError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setEmailLoading(true)
    setAuthError(null)
    try {
      const result = await signIn("resend", { 
        email, 
        callbackUrl,
        redirect: false
      })
      
      if (result?.error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Email sign in error:", result.error)
        }
        setAuthError("Email sign-in failed. Please check your email address and try again.")
      } else {
        // Show success message for email
        alert("Check your email for a magic link to sign in!")
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Email sign in error:", error)
      }
      setAuthError("Failed to send magic link. Please try again later.")
    } finally {
      setEmailLoading(false)
    }
  }

  const handleDemoSignIn = async (demoEmail: string) => {
    setIsLoading(true)
    setAuthError(null)
    try {
      const result = await signIn("credentials", { 
        email: demoEmail,
        password: "demo123",
        callbackUrl,
        redirect: false
      })
      
      if (result?.error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Demo sign in error:", result.error)
        }
        setAuthError("Demo sign-in failed. This feature is only available in development.")
      } else if (result?.url) {
        window.location.href = result.url
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Demo sign in error:", error)
      }
      setAuthError("Demo sign-in failed.")
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
        {(error || authError) && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-red-500 text-xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-300">Sign in failed</h3>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {authError || (
                    <>
                      {error === "CredentialsSignin" && "Invalid email address"}
                      {error === "Configuration" && "Authentication provider not configured properly"}
                      {error === "AccessDenied" && "Access denied"}
                      {error === "OAuthAccountNotLinked" && "Account already exists with different provider"}
                      {!["CredentialsSignin", "Configuration", "AccessDenied", "OAuthAccountNotLinked"].includes(error || '') && "An error occurred during sign in"}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sign In Form */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          
          {/* OAuth Providers */}
          <div className="space-y-3 mb-6">
            {providersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading sign-in options...</span>
              </div>
            ) : (
              <>
                {/* Google */}
                {providers.google && (
                  <button
                    onClick={() => handleOAuthSignIn("google")}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl py-3 px-4 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                )}

                {/* GitHub */}
                {providers.github && (
                  <button
                    onClick={() => handleOAuthSignIn("github")}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-3 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span>Continue with GitHub</span>
                  </button>
                )}

                {/* Facebook */}
                {providers.facebook && (
                  <button
                    onClick={() => handleOAuthSignIn("facebook")}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>Continue with Meta</span>
                  </button>
                )}

                {/* X (Twitter) */}
                {providers.twitter && (
                  <button
                    onClick={() => handleOAuthSignIn("twitter")}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-3 bg-black hover:bg-gray-900 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span>Continue with X</span>
                  </button>
                )}

                {/* No providers available message */}
                {!providers.google && !providers.github && !providers.facebook && !providers.twitter && !providers.resend && !providers.demo && (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">
                      No sign-in providers are currently configured.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Please contact support or try again later.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Divider - only show if we have OAuth providers and email */}
          {(providers.google || providers.github || providers.facebook || providers.twitter) && providers.resend && (
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Or continue with email
                </span>
              </div>
            </div>
          )}

          {/* Email Sign In */}
          {providers.resend && (
            <form onSubmit={handleEmailSignIn} className="space-y-4 mb-6">
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
                placeholder="your@email.com"
                disabled={emailLoading}
              />
            </div>
            <button
              type="submit"
              disabled={emailLoading || !email}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {emailLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Sending Magic Link...</span>
                </div>
              ) : (
                '✉️ Send Magic Link'
              )}
            </button>
            </form>
          )}

          {/* Demo Sign In - Development Only */}
          {providers.demo && (
            <>
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Development Only
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Email: demo@example.com | Password: demo123
                </p>
                <button
                  onClick={() => handleDemoSignIn("demo@example.com")}
                  disabled={isLoading}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-medium py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  🧪 Demo Sign In
                </button>
              </div>
            </>
          )}
        </div>

        {/* Back to App */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
          >
            ← Back to App
          </Link>
        </div>

        {/* Help Text */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Don't have an account? Signing in will create one automatically.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  )
} 