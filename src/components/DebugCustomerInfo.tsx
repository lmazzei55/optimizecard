"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface CustomerInfo {
  customerId?: string
  subscriptionTier?: string
  subscriptionStatus?: string
  email?: string
}

export function DebugCustomerInfo() {
  const { data: session } = useSession()
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchCustomerInfo = async () => {
    if (!session?.user?.email) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/user/subscription')
      if (response.ok) {
        const data = await response.json()
        setCustomerInfo(data.data)
      }
    } catch (error) {
      console.error('Error fetching customer info:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomerInfo()
  }, [session])

  if (!session) return null

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 max-w-sm text-xs">
      <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">🔍 Debug: Customer Info</h4>
      {loading ? (
        <p>Loading...</p>
      ) : customerInfo ? (
        <div className="space-y-1 text-yellow-700 dark:text-yellow-300">
          <p><strong>Email:</strong> {customerInfo.email || session.user.email}</p>
          <p><strong>Customer ID:</strong> {customerInfo.customerId || 'None'}</p>
          <p><strong>Tier:</strong> {customerInfo.subscriptionTier || 'free'}</p>
          <p><strong>Status:</strong> {customerInfo.subscriptionStatus || 'N/A'}</p>
        </div>
      ) : (
        <p className="text-yellow-700 dark:text-yellow-300">No customer info found</p>
      )}
      <button
        onClick={fetchCustomerInfo}
        className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs"
      >
        Refresh
      </button>
    </div>
  )
} 