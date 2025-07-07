import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'System Status - Credit Card Optimizer',
  description: 'Check the current system status and uptime of Credit Card Optimizer services.',
  keywords: 'system status, uptime, service status, credit card optimizer',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://optimizecard.com/status',
  },
  openGraph: {
    title: 'System Status - Credit Card Optimizer',
    description: 'Check the current system status and uptime.',
    url: 'https://optimizecard.com/status',
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