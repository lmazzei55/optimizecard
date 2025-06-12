'use client'

import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import Link from "next/link"

export function UserMenu() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  if (status === "loading") {
    return (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full w-8 h-8"></div>
    )
  }

  if (!session) {
    return (
      <Link
        href="/auth/signin"
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
      >
        Sign In
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-2 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 shadow-lg"
      >
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
            {session.user?.name?.[0] || session.user?.email?.[0] || "U"}
          </div>
        )}
        <span className="hidden sm:block text-gray-900 dark:text-white font-medium">
          {session.user?.name || session.user?.email?.split("@")[0]}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
            {/* User Info */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {session.user?.name?.[0] || session.user?.email?.[0] || "U"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {session.user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {session.user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <Link
                href="/profile"
                className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                <span className="text-lg">⚙️</span>
                <span>Settings</span>
              </Link>

              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

              <button
                onClick={async () => {
                  setIsOpen(false)
                  
                  try {
                    console.log('🚪 Starting logout process...')
                    
                    // Clear any localStorage data that might interfere with fresh login
                    const keysToPreserve = ['theme'] // Keep theme preference
                    const allKeys = Object.keys(localStorage)
                    allKeys.forEach(key => {
                      if (!keysToPreserve.includes(key)) {
                        localStorage.removeItem(key)
                        console.log('🧹 Cleared localStorage key:', key)
                      }
                    })
                    
                    // Perform the actual logout
                    await signOut({ 
                      callbackUrl: "/",
                      redirect: true // Force redirect to ensure clean state
                    })
                    
                    console.log('✅ Logout completed successfully')
                  } catch (error) {
                    console.error('❌ Logout error:', error)
                    // Fallback: force redirect to home page
                    window.location.href = "/"
                  }
                }}
                className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 w-full text-left"
              >
                <span className="text-lg">🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 