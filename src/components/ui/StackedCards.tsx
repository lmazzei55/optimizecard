"use client"

import { useState, useEffect } from 'react'
import { CreditCard, Star, TrendingUp, Award, ExternalLink } from 'lucide-react'

interface CardRecommendation {
  cardId: string
  cardName: string
  issuer: string
  annualFee: number
  rewardType: 'cashback' | 'points'
  applicationUrl?: string
  totalAnnualValue: number
  benefitsValue: number
  netAnnualValue: number
  categoryBreakdown: Array<{
    categoryName: string
    monthlySpend: number
    rewardRate: number
    monthlyValue: number
    annualValue: number
  }>
  benefitsBreakdown: Array<{
    benefitName: string
    officialValue: number
    personalValue: number
    category: string
  }>
  signupBonus?: {
    amount: number
    requiredSpend: number
    timeframe: number
  }
}

interface StackedCardsProps {
  recommendations: CardRecommendation[]
  onCustomizeCard?: (cardId: string) => void
}

export function StackedCards({ recommendations, onCustomizeCard }: StackedCardsProps) {
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null)

  // Limit to top 4 recommendations for the stacked view
  const topCards = recommendations.slice(0, 4)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getCardIcon = (index: number) => {
    const icons = [
      <Star className="w-5 h-5 text-white" key="star" />,
      <TrendingUp className="w-5 h-5 text-white" key="trending" />,
      <Award className="w-5 h-5 text-white" key="award" />,
      <CreditCard className="w-5 h-5 text-white" key="card" />
    ]
    return icons[index] || <CreditCard className="w-5 h-5 text-white" />
  }

  const getCardCategory = (index: number) => {
    const categories = ['Best Overall', 'High Value', 'Premium', 'Recommended']
    return categories[index] || 'Recommended'
  }

  const navigateToCard = (cardIndex: number) => {
    setActiveCardIndex(cardIndex)
  }

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, cardIndex: number) => {
    if (cardIndex !== activeCardIndex) return
    setIsDragging(true)
    
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX
    
    const handleDrag = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return
      const currentX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX
      const diff = currentX - startX
      
      if (diff > 50) {
        setDragDirection('right')
      } else if (diff < -50) {
        setDragDirection('left')
      } else {
        setDragDirection(null)
      }
    }
    
    const handleDragEnd = () => {
      if (dragDirection === 'right') {
        navigateToCard(activeCardIndex === 0 ? topCards.length - 1 : activeCardIndex - 1)
      } else if (dragDirection === 'left') {
        navigateToCard(activeCardIndex === topCards.length - 1 ? 0 : activeCardIndex + 1)
      }
      
      setIsDragging(false)
      setDragDirection(null)
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('touchmove', handleDrag)
      document.removeEventListener('mouseup', handleDragEnd)
      document.removeEventListener('touchend', handleDragEnd)
    }
    
    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('touchmove', handleDrag)
    document.addEventListener('mouseup', handleDragEnd)
    document.addEventListener('touchend', handleDragEnd)
  }

  if (topCards.length === 0) {
    return null
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-8 min-h-[500px]">
        {/* Left side - Information */}
        <div className="flex-1 max-w-lg pr-8">
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="uppercase text-xs font-medium tracking-wide">Credit Card Optimizer</span>
          </div>
          
          <h2 className="text-4xl font-medium tracking-tighter mb-6 text-gray-900 dark:text-white">
            Your Best Matches
          </h2>
          
          <p className="text-base text-gray-600 dark:text-gray-400 mb-8">
            Drag cards to explore your personalized recommendations and discover the perfect credit card for your spending patterns.
          </p>
          
          {/* Navigation dots */}
          <div className="flex gap-3 mb-8">
            {topCards.map((_, index) => (
              <button
                key={index}
                onClick={() => navigateToCard(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === activeCardIndex
                    ? 'bg-blue-500 scale-125'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
          
          {/* Current card details */}
          {topCards[activeCardIndex] && (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Net Annual Value: {formatCurrency(topCards[activeCardIndex].netAnnualValue)}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Total Rewards: {formatCurrency(topCards[activeCardIndex].totalAnnualValue)}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Annual Fee: {formatCurrency(topCards[activeCardIndex].annualFee)}</span>
              </div>
              {topCards[activeCardIndex].signupBonus && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span>
                    Signup Bonus: {formatCurrency(topCards[activeCardIndex].signupBonus!.amount)} 
                    (spend {formatCurrency(topCards[activeCardIndex].signupBonus!.requiredSpend)} in {topCards[activeCardIndex].signupBonus!.timeframe} months)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side - Stacked Cards */}
        <div className="relative">
          <div 
            className="relative w-80 h-96"
            style={{
              perspective: '1000px',
              transformStyle: 'preserve-3d'
            }}
          >
            {topCards.map((card, index) => {
              const isActive = index === activeCardIndex
              const offset = index - activeCardIndex
              
              return (
                <div
                  key={card.cardId}
                  className={`absolute inset-0 transition-all duration-500 ease-in-out cursor-grab active:cursor-grabbing ${
                    isDragging && isActive && dragDirection === 'left' ? 'translate-x-[-50px]' : ''
                  } ${
                    isDragging && isActive && dragDirection === 'right' ? 'translate-x-[50px]' : ''
                  }`}
                  style={{
                    transform: `
                      translateX(${offset * -64}px)
                      translateZ(${isActive ? 0 : offset * -20}px)
                      rotateY(${offset * -15}deg)
                      rotateX(10deg)
                      scale(${isActive ? 1 : 1 - Math.abs(offset) * 0.1})
                    `,
                    zIndex: topCards.length - Math.abs(offset),
                    opacity: Math.abs(offset) > 2 ? 0 : 1 - Math.abs(offset) * 0.2
                  }}
                  onMouseDown={(e) => handleDragStart(e, index)}
                  onTouchStart={(e) => handleDragStart(e, index)}
                >
                  <div className="h-full bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden">
                    <div className="h-full flex flex-col p-6">
                      {/* Card header */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-full bg-white/10 border border-white/20">
                          {getCardIcon(index)}
                        </div>
                        <span className="text-xs uppercase tracking-wide text-gray-300 font-medium">
                          {getCardCategory(index)}
                        </span>
                      </div>
                      
                      {/* Card title */}
                      <h3 className="text-2xl font-semibold mb-2 text-white">
                        {card.cardName}
                      </h3>
                      <p className="text-gray-300 text-sm mb-4">{card.issuer}</p>
                      
                      {/* Card benefits */}
                      <div className="flex-1 mb-6">
                        <div className="space-y-3">
                          <div className="text-gray-300">
                            <span className="text-2xl font-bold text-white">
                              {formatCurrency(card.netAnnualValue)}
                            </span>
                            <span className="text-sm ml-2">net annual value</span>
                          </div>
                          
                          {card.categoryBreakdown.slice(0, 2).map((category, idx) => (
                            <div key={idx} className="text-sm text-gray-300">
                              <span className="font-medium">
                                {category.rewardRate}x
                              </span>
                              <span className="ml-1">{category.categoryName}</span>
                              <span className="ml-2 text-gray-400">
                                ({formatCurrency(category.annualValue)}/year)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm mb-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-gray-400">
                            {card.rewardType === 'cashback' ? 'Cashback' : 'Points'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span className="text-gray-400">
                            {card.annualFee === 0 ? 'No Fee' : `${formatCurrency(card.annualFee)} fee`}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="space-y-3">
                        {card.applicationUrl && (
                          <a
                            href={card.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors flex items-center justify-center gap-2"
                          >
                            Apply Now
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        
                        {onCustomizeCard && (
                          <button
                            onClick={() => onCustomizeCard(card.cardId)}
                            className="w-full py-2 px-4 text-gray-300 hover:text-white transition-colors text-sm"
                          >
                            Customize Benefits
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
} 