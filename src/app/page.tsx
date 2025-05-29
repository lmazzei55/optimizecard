import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { ThemeToggle } from "@/components/ThemeToggle"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header with Theme Toggle */}
      <header className="absolute top-0 right-0 p-6 z-10">
        <ThemeToggle />
      </header>

      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Credit Card Optimizer
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Maximize your credit card rewards with personalized recommendations 
              based on your spending patterns and preferences.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-8">
              <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
                How It Works
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center group">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl font-bold text-white">1</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">Input Your Spending</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Tell us how much you spend in different categories each month using our intuitive sliders.</p>
                </div>
                <div className="text-center group">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl font-bold text-white">2</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">Set Preferences</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Choose between cashback or points, and set your point valuations for accurate calculations.</p>
                </div>
                <div className="text-center group">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl font-bold text-white">3</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">Get Recommendations</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Receive personalized card recommendations to maximize your rewards mathematically.</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link href="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-xl font-semibold rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                  Get Started →
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-20 text-center">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Utility Test:</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(1234.56)}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
