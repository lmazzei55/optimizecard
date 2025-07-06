import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'System Status - Credit Card Optimizer',
  description: 'Check the current system status and uptime of Credit Card Optimizer services.',
  keywords: 'system status, uptime, service status, credit card optimizer',
  robots: 'noindex, nofollow',
  alternates: {
    canonical: '/status',
  },
  openGraph: {
    title: 'System Status - Credit Card Optimizer',
    description: 'Check the current system status and uptime.',
    url: '/status',
    type: 'website',
  },
}

export default function StatusLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 