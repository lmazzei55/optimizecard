import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Credit Card Optimizer',
  description: 'Learn how Credit Card Optimizer protects your privacy and handles your data.',
  robots: 'index, follow'
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Last updated: December 19, 2024
          </p>

          <div className="space-y-8 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Information We Collect
              </h2>
              <div className="space-y-4">
                <p>
                  Credit Card Optimizer collects information to provide personalized credit card recommendations:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Spending Data:</strong> Monthly spending amounts by category (stored locally and optionally in your account)</li>
                  <li><strong>Account Information:</strong> Email address and profile data when you sign in</li>
                  <li><strong>Preferences:</strong> Reward preferences, point valuations, and owned cards</li>
                  <li><strong>Usage Analytics:</strong> Anonymous usage patterns to improve our service</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                How We Use Your Information
              </h2>
              <div className="space-y-4">
                <p>Your information is used exclusively for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Generating personalized credit card recommendations</li>
                  <li>Saving your preferences across sessions</li>
                  <li>Improving our recommendation algorithms</li>
                  <li>Providing customer support</li>
                </ul>
                <p className="font-semibold text-blue-600 dark:text-blue-400">
                  We never sell your personal data to third parties.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Third-Party Services & Affiliate Links
              </h2>
              <div className="space-y-4">
                <p>
                  Our service includes links to credit card companies and financial institutions. Important disclosures:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Affiliate Partnerships:</strong> We may earn commissions when you apply for cards through our links</li>
                  <li><strong>No Influence on Recommendations:</strong> Our mathematical algorithms are not influenced by commission rates</li>
                  <li><strong>External Privacy Policies:</strong> Credit card companies have their own privacy policies</li>
                  <li><strong>Authentication:</strong> We use NextAuth.js with OAuth providers (Google, GitHub, Meta, X)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Data Security
              </h2>
              <div className="space-y-4">
                <p>We protect your information through:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Encrypted data transmission (HTTPS)</li>
                  <li>Secure database storage with access controls</li>
                  <li>Regular security audits and updates</li>
                  <li>No storage of sensitive financial account information</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Your Rights
              </h2>
              <div className="space-y-4">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your account and data</li>
                  <li>Export your data</li>
                  <li>Opt out of analytics tracking</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Cookies & Local Storage
              </h2>
              <div className="space-y-4">
                <p>We use:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Essential Cookies:</strong> For authentication and core functionality</li>
                  <li><strong>Local Storage:</strong> To save your spending data and preferences locally</li>
                  <li><strong>Analytics:</strong> Anonymous usage tracking to improve our service</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Contact Us
              </h2>
              <div className="space-y-4">
                <p>
                  For privacy-related questions or to exercise your rights, contact us at:
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="font-semibold">Email:</p>
                  <p>privacy@optimizecard.com</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Changes to This Policy
              </h2>
              <p>
                We may update this privacy policy from time to time. We will notify users of any material changes 
                by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}