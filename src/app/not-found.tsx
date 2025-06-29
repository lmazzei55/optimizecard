import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'

export const metadata: Metadata = {
  title: 'Page Not Found - Credit Card Optimizer',
  description: 'The page you are looking for could not be found. Return to Credit Card Optimizer to find your perfect rewards card.',
  robots: 'noindex, follow',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      <Header />
      
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          {/* 404 Icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-6 shadow-xl">
              <span className="text-4xl">🔍</span>
            </div>
            <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Page Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-block w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              🏠 Go Home
            </Link>
            
            <Link
              href="/dashboard"
              className="inline-block w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              📊 Go to Dashboard
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>
              Need help? <Link href="/auth/signin" className="text-purple-600 dark:text-purple-400 hover:underline">Contact support</Link> or try searching for what you need.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
} 