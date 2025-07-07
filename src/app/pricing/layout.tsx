import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing - Credit Card Optimizer Premium',
  description: 'Upgrade to Premium for access to premium credit cards, advanced features, and unlimited recommendations. Start your 7-day free trial today.',
  keywords: 'credit card optimizer pricing, premium credit cards, subscription plans, free trial',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://optimizecard.com/pricing',
  },
  openGraph: {
    title: 'Pricing - Credit Card Optimizer Premium',
    description: 'Upgrade to Premium for access to premium credit cards and advanced features. 7-day free trial.',
    url: 'https://optimizecard.com/pricing',
    type: 'website',
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 