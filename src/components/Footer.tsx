import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Logo and Description */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl w-8 h-8 flex items-center justify-center shadow-lg">
              <span className="text-lg">💳</span>
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Credit Card Optimizer
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Find your perfect credit card match
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-6 text-sm">
            <Link 
              href="/privacy" 
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms" 
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              Terms of Service
            </Link>
            <Link 
              href="/pricing" 
              className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
            >
              Pricing
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            © 2024 Credit Card Optimizer. All rights reserved.
          </div>
        </div>

        {/* Affiliate Disclosure */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            <span className="font-semibold">Affiliate Disclosure:</span> We may earn commissions when you apply for credit cards through our links. 
            Our recommendations are mathematically driven and not influenced by commission rates.
          </p>
        </div>
      </div>
    </footer>
  )
} 