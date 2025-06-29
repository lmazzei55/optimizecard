import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Credit Card Optimizer',
  description: 'Enter your spending patterns to get personalized credit card recommendations and maximize your rewards.',
  keywords: 'credit card dashboard, spending analysis, reward optimization, personal finance',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://optimizecard.com/dashboard',
  },
  openGraph: {
    title: 'Dashboard - Credit Card Optimizer',
    description: 'Enter your spending patterns to get personalized credit card recommendations.',
    url: 'https://optimizecard.com/dashboard',
    type: 'website',
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 