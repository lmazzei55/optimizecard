import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In - Credit Card Optimizer',
  description: 'Sign in to your Credit Card Optimizer account to access personalized recommendations and save your preferences.',
  keywords: 'sign in, login, credit card optimizer account, user authentication',
  robots: 'index, follow',
  alternates: {
    canonical: '/auth/signin',
  },
  openGraph: {
    title: 'Sign In - Credit Card Optimizer',
    description: 'Sign in to access personalized credit card recommendations.',
    url: '/auth/signin',
    type: 'website',
  },
}

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 