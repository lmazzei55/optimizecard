import React, { useState } from 'react'
import { CardRecommendation } from '@/lib/recommendation-engine'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface Props {
  recommendation: CardRecommendation
  rank: number
  onCustomize: (cardId: string) => void
}

export const RecommendationItem: React.FC<Props> = ({ recommendation: rec, rank, onCustomize }) => {
  const [open, setOpen] = useState(false)

  const rankColors = [
    'from-yellow-400 to-orange-500', // Gold #1
    'from-gray-300 to-gray-500',    // Silver #2
    'from-amber-600 to-amber-800',  // Bronze #3
    'from-blue-400 to-blue-600'     // Others
  ]
  const rankColor = rankColors[Math.min(rank, 3)]

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Minimal row */}
      <div
        className="flex items-center justify-between px-4 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setOpen(prev => !prev)}
      >
        {/* Left side: rank + basic info */}
        <div className="flex items-center space-x-4 overflow-hidden">
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${rankColor} flex items-center justify-center text-white font-bold`}>#{rank + 1}</div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 dark:text-white truncate max-w-[140px] sm:max-w-none">{rec.cardName}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{rec.issuer}</div>
          </div>
          <span className="hidden sm:inline ml-2 px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            {rec.rewardType === 'cashback' ? '💵 Cashback' : '🎯 Points'}
          </span>
          {rec.signupBonus && rec.signupBonus.amount > 0 && (
            <span className="hidden sm:inline ml-2 px-2 py-0.5 rounded-full text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold shadow-lg">
              🎁 Signup Bonus
            </span>
          )}
        </div>

        {/* Right side: net value + actions + chevron */}
        <div className="flex items-center space-x-3">
          <div className="text-right mr-2 hidden sm:block">
            <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{formatCurrency(rec.netAnnualValue)}</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">net value</div>
          </div>
          {rec.applicationUrl && (
            <Button
              size="sm"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
              onClick={(e) => {
                e.stopPropagation()
                window.open(rec.applicationUrl!, '_blank')
              }}
            >
              Apply
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              onCustomize(rec.cardId)
            }}
          >
            ⚙️
          </Button>
          <div className="text-gray-400 dark:text-gray-500 text-sm ml-1">{open ? '▲' : '▼'}</div>
        </div>
      </div>

      {/* Expanded details */}
      {open && (
        <div className="px-4 pb-4">
          <div className={`grid ${rec.signupBonus && rec.signupBonus.amount > 0 ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'} gap-4 text-sm`}>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Annual Rewards</div>
              <div className="font-medium">{formatCurrency(rec.totalAnnualValue)}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Benefits Value</div>
              <div className="font-medium">{formatCurrency(rec.benefitsValue)}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Annual Fee</div>
              <div className="font-medium">{formatCurrency(rec.annualFee)}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Effective Rate</div>
              <div className="font-medium">{(() => {
                // Calculate total annual spending from category breakdown
                const totalAnnualSpending = rec.categoryBreakdown.reduce((sum, cat) => sum + (cat.monthlySpend * 12), 0)
                if (totalAnnualSpending === 0) return "0.0%"
                // Effective rate = Net Annual Value / Total Annual Spending
                const effectiveRate = (rec.netAnnualValue / totalAnnualSpending) * 100
                return `${effectiveRate.toFixed(1)}%`
              })()}</div>
            </div>
            {rec.signupBonus && rec.signupBonus.amount > 0 && (
              <div>
                <div className="text-gray-500 dark:text-gray-400">Signup Bonus</div>
                <div className="font-medium text-orange-600 dark:text-orange-400">
                  {rec.rewardType === 'points' ? `${rec.signupBonus.amount.toLocaleString()} points` : formatCurrency(rec.signupBonus.amount)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Spend ${rec.signupBonus.requiredSpend?.toLocaleString() || 'N/A'} in {rec.signupBonus.timeframe || 'N/A'} months
                </div>
              </div>
            )}
          </div>
          {/* Show category breakdown & benefits in simple table */}
          {rec.categoryBreakdown?.length > 0 && (
            <div className="mt-4">
              <div className="font-semibold mb-3 text-sm text-gray-700 dark:text-gray-300">Category Rewards</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {rec.categoryBreakdown.map((c) => (
                  <div key={c.categoryName} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/40 rounded-md px-3 py-2">
                    <span className="truncate max-w-[120px]">{c.categoryName}</span>
                    <span className="font-medium text-purple-600 dark:text-purple-400">
                      {rec.rewardType === 'points' ? `${(c.rewardRate < 1 ? (c.rewardRate/0.01) : c.rewardRate).toFixed(0)}x` : `${(c.rewardRate*100).toFixed(1)}%`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 