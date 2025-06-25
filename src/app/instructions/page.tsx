import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function InstructionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      <Header />
      
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl mb-6 shadow-2xl">
            <span className="text-2xl">📚</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            How It Works
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Everything you need to know about using the Credit Card Optimizer safely and effectively.
          </p>
        </div>

        <div className="space-y-8">
          {/* Privacy & Security Section */}
          <section className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-8 border border-green-200 dark:border-green-700">
            <div className="flex items-start space-x-4">
              <div className="bg-green-100 dark:bg-green-800 rounded-full p-3">
                <span className="text-2xl">🔒</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-4">
                  Your Privacy is Protected
                </h2>
                <div className="space-y-3 text-green-700 dark:text-green-300">
                  <p><strong>✓ No personal information required</strong> - We never ask for your name, address, SSN, or financial details</p>
                  <p><strong>✓ No credit checks</strong> - This tool doesn't affect your credit score in any way</p>
                  <p><strong>✓ No account creation needed</strong> - Use the tool immediately without signing up</p>
                  <p><strong>✓ Anonymous spending estimates</strong> - We only need approximate monthly spending amounts</p>
                  <p><strong>✓ No data sharing</strong> - Your information stays private and isn't sold to third parties</p>
                </div>
              </div>
            </div>
          </section>

          {/* How to Use Section */}
          <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <span className="text-2xl mr-3">🎯</span>
              Step-by-Step Guide
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 dark:bg-blue-800 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-800 dark:text-blue-200">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Enter Monthly Spending</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Input how much you spend each <strong>month</strong> in categories like dining, groceries, travel, etc. 
                      Estimates are fine - they don't need to be exact.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 dark:bg-purple-800 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-purple-800 dark:text-purple-200">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Choose Reward Type</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Select <strong>Cashback</strong> (direct money back), <strong>Points/Miles</strong> (for travel), 
                      or <strong>Best Overall</strong> (compares both options).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 dark:bg-green-800 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-green-800 dark:text-green-200">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Get Recommendations</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Our AI calculates which cards give you the highest annual value based on your actual spending patterns.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 dark:bg-orange-800 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-orange-800 dark:text-orange-200">4</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Filter Results</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Use the ranking filters to include/exclude annual fees, benefits, or signup bonuses 
                      to see different scenarios.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-pink-100 dark:bg-pink-800 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-pink-800 dark:text-pink-200">5</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Customize Cards</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Click any card to customize point values and benefit valuations for more personalized results.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-indigo-100 dark:bg-indigo-800 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-indigo-800 dark:text-indigo-200">6</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Apply for Cards</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Use the provided links to apply for your chosen cards directly with the credit card companies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Understanding Results Section */}
          <section className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-700">
            <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-6 flex items-center">
              <span className="text-2xl mr-3">📊</span>
              Understanding Your Results
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">What We Calculate:</h3>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <li>• <strong>Annual Rewards Value</strong> - How much you'll earn per year</li>
                  <li>• <strong>Annual Fees</strong> - Yearly cost of the card</li>
                  <li>• <strong>Card Benefits</strong> - Travel credits, insurance, etc.</li>
                  <li>• <strong>Signup Bonuses</strong> - Welcome offers (first year)</li>
                  <li>• <strong>Net Annual Value</strong> - Total benefit minus costs</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Ranking Filters:</h3>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <li>• <strong>Pure Rewards</strong> - Only reward earnings</li>
                  <li>• <strong>Net Value</strong> - Rewards minus annual fees</li>
                  <li>• <strong>Complete Analysis</strong> - Everything included</li>
                  <li>• <strong>Custom</strong> - Your selected filters</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Risks & Limitations Section */}
          <section className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-8 border border-yellow-200 dark:border-yellow-700">
            <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 mb-6 flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              Important Considerations
            </h2>
            
            <div className="space-y-4 text-yellow-700 dark:text-yellow-300">
              <div>
                <h3 className="font-semibold mb-2">What This Tool Does NOT Do:</h3>
                <ul className="space-y-1 text-sm ml-4">
                  <li>• Check your credit score or creditworthiness</li>
                  <li>• Guarantee card approval</li>
                  <li>• Include all possible credit cards (we focus on popular options)</li>
                  <li>• Account for limited-time promotions or offers</li>
                  <li>• Replace professional financial advice</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Responsible Credit Card Use:</h3>
                <ul className="space-y-1 text-sm ml-4">
                  <li>• Only apply for cards you can afford</li>
                  <li>• Pay your full balance every month to avoid interest</li>
                  <li>• Don't overspend just to earn rewards</li>
                  <li>• Consider your credit score and history</li>
                  <li>• Read all terms and conditions before applying</li>
                </ul>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <span className="text-2xl mr-3">❓</span>
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How accurate are the calculations?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Our calculations are mathematically precise based on current published reward rates and fees. 
                  However, actual results may vary based on specific spending patterns, promotions, and card terms.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Do you make money from card applications?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  We may receive compensation when you apply for cards through our links. This doesn't affect our 
                  recommendations - we use the same mathematical calculations regardless of compensation.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How often is the card data updated?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  We regularly update card information, but credit card terms can change frequently. 
                  Always verify current terms on the card issuer's website before applying.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What if I have multiple cards already?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Our recommendations assume you're choosing one primary card. If you have multiple cards, 
                  consider how they work together and which categories each card covers best.
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 rounded-2xl p-8 border border-blue-200/50 dark:border-blue-700/50">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Find Your Perfect Card?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              Now that you understand how it works, start by entering your monthly spending to get personalized recommendations.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg transform hover:scale-105 transition-all duration-200">
                🚀 Get Started Now
              </Button>
            </Link>
          </section>
        </div>
      </main>
    </div>
  )
} 