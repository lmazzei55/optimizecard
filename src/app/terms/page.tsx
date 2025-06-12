import type { Metadata } from 'next'
import { Header } from "@/components/Header"

export const metadata: Metadata = {
  title: 'Terms of Service - Credit Card Optimizer',
  description: 'Terms of service and affiliate disclosures for Credit Card Optimizer.',
  robots: 'index, follow'
}

export default function TermsOfService() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Last updated: December 19, 2024
            </p>

            <div className="space-y-8 text-gray-700 dark:text-gray-300">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Service Description
                </h2>
                <div className="space-y-4">
                  <p>
                    Credit Card Optimizer is a financial technology service that provides personalized credit card 
                    recommendations based on your spending patterns. Our service:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Analyzes your monthly spending across different categories</li>
                    <li>Calculates potential rewards and benefits from various credit cards</li>
                    <li>Provides mathematical recommendations for optimal card selection</li>
                    <li>Offers both free and premium tiers of service</li>
                  </ul>
                </div>
              </section>

              <section className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h2 className="text-2xl font-semibold text-yellow-800 dark:text-yellow-300 mb-4">
                  🔍 Affiliate Disclosure
                </h2>
                <div className="space-y-4 text-yellow-700 dark:text-yellow-300">
                  <p className="font-semibold">
                    Important: We maintain affiliate partnerships with credit card companies and financial institutions.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Commission Structure:</strong> We may earn commissions when you apply for credit cards through our links</li>
                    <li><strong>No Bias Guarantee:</strong> Our recommendation algorithms are mathematically driven and not influenced by commission rates</li>
                    <li><strong>Transparency:</strong> All affiliate relationships are clearly disclosed</li>
                    <li><strong>Your Choice:</strong> You are never required to use our affiliate links</li>
                  </ul>
                  <p className="font-semibold">
                    Our goal is to provide you with the most accurate recommendations regardless of our affiliate relationships.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  User Responsibilities
                </h2>
                <div className="space-y-4">
                  <p>By using our service, you agree to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Provide accurate spending information for better recommendations</li>
                    <li>Use the service for personal, non-commercial purposes</li>
                    <li>Not attempt to reverse-engineer our algorithms</li>
                    <li>Respect the intellectual property rights of our service</li>
                    <li>Comply with all applicable laws and regulations</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Disclaimers & Limitations
                </h2>
                <div className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="font-semibold text-red-800 dark:text-red-300 mb-2">Important Disclaimers:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4 text-red-700 dark:text-red-300">
                      <li><strong>Not Financial Advice:</strong> Our recommendations are educational tools, not professional financial advice</li>
                      <li><strong>Credit Approval:</strong> We do not guarantee credit card approval or specific terms</li>
                      <li><strong>Rate Changes:</strong> Credit card terms, rates, and benefits may change without notice</li>
                      <li><strong>Individual Results:</strong> Actual rewards may vary based on your spending and card usage</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Account Terms
                </h2>
                <div className="space-y-4">
                  <p>For users who create accounts:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>You are responsible for maintaining account security</li>
                    <li>One account per person</li>
                    <li>You may delete your account at any time</li>
                    <li>We reserve the right to suspend accounts for violations</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Premium Service Terms
                </h2>
                <div className="space-y-4">
                  <p>Our premium tier includes:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Access to premium credit cards with annual fees</li>
                    <li>Advanced optimization features</li>
                    <li>Priority customer support</li>
                    <li>Monthly billing at $9.99/month</li>
                    <li>Cancel anytime with no penalties</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Third-Party Links & Services
                </h2>
                <div className="space-y-4">
                  <p>
                    Our service contains links to third-party websites and services:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Credit card company websites and application pages</li>
                    <li>Authentication providers (Google, GitHub, Meta, X)</li>
                    <li>Payment processing services (Stripe)</li>
                  </ul>
                  <p>
                    We are not responsible for the content, privacy practices, or terms of these third-party services.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Intellectual Property
                </h2>
                <div className="space-y-4">
                  <p>
                    All content, algorithms, and technology used in Credit Card Optimizer are protected by intellectual property laws. 
                    You may not copy, modify, or distribute our proprietary technology.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Limitation of Liability
                </h2>
                <div className="space-y-4">
                  <p>
                    Credit Card Optimizer provides recommendations based on mathematical calculations. We are not liable for:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Credit card approval decisions</li>
                    <li>Changes in credit card terms or benefits</li>
                    <li>Financial decisions made based on our recommendations</li>
                    <li>Technical issues or service interruptions</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <p>
                    For questions about these terms or our service:
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="font-semibold">Email:</p>
                    <p>support@optimizecard.com</p>
                    <p className="font-semibold mt-2">Legal:</p>
                    <p>legal@optimizecard.com</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Changes to Terms
                </h2>
                <p>
                  We may update these terms from time to time. Material changes will be communicated to users 
                  via email or prominent notice on our website. Continued use of the service constitutes acceptance of updated terms.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 