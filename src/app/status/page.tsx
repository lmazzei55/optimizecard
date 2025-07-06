"use client"

import { useEffect, useState } from 'react'
import { DebugCustomerInfo } from '@/components/DebugCustomerInfo'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'

interface HealthStatus {
  status: string
  database: string
  latency?: string
  categories?: number
  users?: number
  cards?: number
  timestamp: string
  error?: string
}

interface WarmupStatus {
  status: string
  operations?: string[]
  errors?: string[]
  duration?: number
  database_latency?: number
  timestamp: string
  error?: string
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [warmup, setWarmup] = useState<WarmupStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealth(data)
    } catch (error: any) {
      setHealth({ 
        status: 'error', 
        database: 'unknown',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  const triggerWarmup = async () => {
    try {
      setWarmup({ status: 'warming', timestamp: new Date().toISOString() })
      const response = await fetch('/api/warmup')
      const data = await response.json()
      setWarmup(data)
    } catch (error: any) {
      setWarmup({ 
        status: 'error', 
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  const refreshAll = async () => {
    setLoading(true)
    await Promise.all([checkHealth(), triggerWarmup()])
    setLastRefresh(new Date())
    setLoading(false)
  }

  useEffect(() => {
    refreshAll()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      checkHealth()
    }, 30000) // Check health every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'partial':
      case 'partially_healthy':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'unhealthy':
      case 'failed':
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'warming':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return '✅'
      case 'partial':
      case 'partially_healthy':
        return '⚠️'
      case 'unhealthy':
      case 'failed':
      case 'error':
        return '❌'
      case 'warming':
        return '🔥'
      default:
        return '❓'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            🔧 System Status
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Real-time monitoring of Credit Card Optimizer infrastructure
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={refreshAll}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Refreshing...</span>
                  </div>
                ) : (
                  '🔄 Refresh All'
                )}
              </Button>
              
              <Button
                onClick={triggerWarmup}
                disabled={warmup?.status === 'warming'}
                variant="outline"
              >
                🔥 Trigger Warmup
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span>Auto-refresh</span>
              </label>
              
              {lastRefresh && (
                <span className="text-sm text-gray-500">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Health Status */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <span>🏥</span>
              <span>System Health</span>
            </h2>
            
            {health ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${getStatusColor(health.status)}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xl">{getStatusIcon(health.status)}</span>
                    <span className="font-semibold capitalize">{health.status}</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>Database: <span className="font-medium">{health.database}</span></div>
                    {health.latency && <div>Latency: <span className="font-medium">{health.latency}</span></div>}
                    {health.error && <div className="text-red-600">Error: {health.error}</div>}
                  </div>
                </div>

                {health.categories !== undefined && (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{health.categories}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{health.users}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Users</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{health.cards}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Cards</div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Last checked: {new Date(health.timestamp).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Checking health...</p>
              </div>
            )}
          </div>

          {/* Warmup Status */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <span>🔥</span>
              <span>Warmup Status</span>
            </h2>
            
            {warmup ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${getStatusColor(warmup.status)}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xl">{getStatusIcon(warmup.status)}</span>
                    <span className="font-semibold capitalize">{warmup.status}</span>
                  </div>
                  <div className="text-sm space-y-1">
                    {warmup.duration && <div>Duration: <span className="font-medium">{warmup.duration}ms</span></div>}
                    {warmup.database_latency && <div>DB Latency: <span className="font-medium">{warmup.database_latency}ms</span></div>}
                    {warmup.error && <div className="text-red-600">Error: {warmup.error}</div>}
                  </div>
                </div>

                {warmup.operations && warmup.operations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">✅ Successful Operations:</h4>
                    <div className="flex flex-wrap gap-2">
                      {warmup.operations.map((op, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                          {op}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {warmup.errors && warmup.errors.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2">❌ Failed Operations:</h4>
                    <div className="space-y-1">
                      {warmup.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Last run: {new Date(warmup.timestamp).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Checking warmup status...</p>
              </div>
            )}
          </div>
        </div>

        {/* API Endpoints Status */}
        <div className="mt-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <span>🔗</span>
            <span>Quick API Tests</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: 'Categories', endpoint: '/api/categories' },
              { name: 'Subcategories', endpoint: '/api/subcategories' },
              { name: 'Health Check', endpoint: '/api/health' }
            ].map((api) => (
              <button
                key={api.endpoint}
                onClick={() => window.open(api.endpoint, '_blank')}
                className="p-4 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
              >
                <div className="font-semibold text-gray-900 dark:text-white">{api.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{api.endpoint}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This page helps diagnose cold start issues and monitor system performance.
          </p>
        </div>
      </div>
    </div>
  )
} 