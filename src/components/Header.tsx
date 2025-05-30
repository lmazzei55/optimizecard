'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserMenu } from "@/components/UserMenu"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useState, useEffect } from "react"

export function Header() {
  const pathname = usePathname()
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    
    if (newIsDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

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
            
            {/* Theme Toggle - only render after mounted */}
            {mounted && (
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="relative h-10 w-10 rounded-xl border-2 border-gray-200/50 dark:border-gray-600/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
              >
                {isDark ? (
                  <Sun className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Moon className="h-4 w-4 text-indigo-600" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}
            
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  )
} 