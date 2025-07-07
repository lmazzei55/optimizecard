import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Credit Card Recommendations - Optimized Results',
  description: 'View your personalized credit card recommendations with detailed analysis, rewards calculations, and multi-card strategies.',
  keywords: 'credit card recommendations, reward calculations, card analysis, financial optimization',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://optimizecard.com/results',
  },
  openGraph: {
    title: 'Credit Card Recommendations - Optimized Results',
    description: 'View your personalized credit card recommendations with detailed analysis.',
    url: 'https://optimizecard.com/results',
    type: 'website',
  },
}

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 