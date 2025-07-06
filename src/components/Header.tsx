'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserMenu } from "@/components/UserMenu"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export function Header() {
  const pathname = usePathname()

  useEffect(() => {
    // Force dark theme globally
    document.documentElement.classList.add('dark')
  }, [])

  const isActive = (path: string) => pathname === path

  return (
    <nav className="relative z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl w-10 h-10 flex items-center justify-center shadow-lg">
              <span className="text-xl">💳</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Credit Card Optimizer
            </span>
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link 
              href="/dashboard" 
              className={`font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive('/dashboard')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              Dashboard
            </Link>
            
            <Link 
              href="/instructions" 
              className={`font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive('/instructions')
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                  : 'text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              How It Works
            </Link>
            
            <Link 
              href="/pricing" 
              className={`font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive('/pricing')
                  ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
                  : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              Pricing
            </Link>
            
            {/* Theme Toggle removed */}
            
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  )
} 