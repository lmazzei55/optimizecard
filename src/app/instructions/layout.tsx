import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How to Use - Credit Card Optimizer Instructions',
  description: 'Learn how to use Credit Card Optimizer to get the best personalized credit card recommendations and maximize your rewards.',
  keywords: 'credit card optimizer instructions, how to use, tutorial, guide, credit card recommendations',
  robots: 'index, follow',
  alternates: {
    canonical: '/instructions',
  },
  openGraph: {
    title: 'How to Use - Credit Card Optimizer Instructions',
    description: 'Learn how to get the best credit card recommendations and maximize your rewards.',
    url: '/instructions',
    type: 'website',
  },
}

export default function InstructionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 