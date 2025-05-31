'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { getStripe } from '@/lib/stripe'
import { Button } from '@/components/ui/button'

interface CheckoutButtonProps {
  plan?: string
  className?: string
  children?: React.ReactNode
}

export function CheckoutButton({ 
  plan = 'monthly', 
  className = '',
  children = 'Start 7-Day Free Trial'
}: CheckoutButtonProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    if (!session) {
      // Redirect to sign in
      window.location.href = '/auth/signin?callbackUrl=/pricing'
      return
    }

    setLoading(true)

    try {
      // Create checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        console.error('Checkout error:', error)
        if (error.includes('not configured')) {
          alert('Payment processing is not set up yet. Please see STRIPE_SETUP.md for configuration instructions.')
        } else {
          alert('Failed to start checkout. Please try again.')
        }
        return
      }

      // Redirect to Stripe Checkout
      const stripe = await getStripe()
      if (!stripe) {
        alert('Payment processing is not configured. Please set up Stripe environment variables.')
        return
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      })

      if (stripeError) {
        console.error('Stripe redirect error:', stripeError)
        alert('Failed to redirect to checkout. Please try again.')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      className={`${className} bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105`}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Starting checkout...</span>
        </div>
      ) : (
        children
      )}
    </Button>
  )
} 