import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Credit Card Optimizer
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Maximize your credit card rewards with personalized recommendations 
                based on your spending patterns and preferences.
              </p>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20 dark:border-gray-700/20">
              <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
                How It Works
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-3xl font-bold text-white">1</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">Input Your Spending</h3>
                  <p className="text-gray-600 dark:text-gray-300">Tell us how much you spend in different categories each month.</p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-3xl font-bold text-white">2</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">Set Preferences</h3>
                  <p className="text-gray-600 dark:text-gray-300">Choose between cashback or points, and set your valuations.</p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-3xl font-bold text-white">3</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">Get Recommendations</h3>
                  <p className="text-gray-600 dark:text-gray-300">Receive personalized card recommendations with mathematical precision.</p>
                </div>
              </div>
            </div>

            <div className="text-center mb-16">
              <Link href="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-4 text-xl font-semibold rounded-full shadow-lg transform hover:scale-105 transition-all duration-200">
                  Get Started →
                </Button>
              </Link>
            </div>
            
            <div className="text-center">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto border border-white/20 dark:border-gray-700/20">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Utility Test:</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(1234.56)}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
