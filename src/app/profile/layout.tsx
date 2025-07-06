import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profile Settings - Credit Card Optimizer',
  description: 'Manage your account settings, subscription, and preferences for personalized credit card recommendations.',
  keywords: 'profile settings, account management, subscription management, user preferences',
  robots: 'index, follow',
  alternates: {
    canonical: '/profile',
  },
  openGraph: {
    title: 'Profile Settings - Credit Card Optimizer',
    description: 'Manage your account settings and preferences.',
    url: '/profile',
    type: 'website',
  },
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 