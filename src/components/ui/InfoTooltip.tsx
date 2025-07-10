"use client"

import React from 'react'

interface InfoTooltipProps {
  content: string | string[]
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  iconClassName?: string
  ariaLabel?: string
}

export function InfoTooltip({ 
  content, 
  position = 'top', 
  className = '', 
  iconClassName = '',
  ariaLabel = 'More information'
}: InfoTooltipProps) {
  const positionClasses = {
    top: '-top-2 left-1/2 transform -translate-x-1/2 -translate-y-full md:-top-2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-full',
    bottom: '-bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full md:-bottom-2 md:left-1/2 md:transform md:-translate-x-1/2 md:translate-y-full', 
    left: '-bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full md:top-1/2 md:-left-2 md:transform md:-translate-x-full md:-translate-y-1/2',
    right: '-bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full md:top-1/2 md:-right-2 md:transform md:translate-x-full md:-translate-y-1/2'
  }

  const arrowClasses = {
    top: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1 md:bottom-0 md:left-1/2 md:-translate-x-1/2 md:translate-y-1',
    bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1 md:top-0 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1',
    left: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1 md:right-0 md:top-1/2 md:-translate-y-1/2 md:translate-x-1',
    right: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1 md:left-0 md:top-1/2 md:-translate-y-1/2 md:-translate-x-1'
  }

  // Generate a unique ID for accessibility
  const tooltipId = `tooltip-${(Array.isArray(content) ? content.join('-') : content).slice(0, 20).replace(/\s+/g, '-')}`

  return (
    <div className={`relative inline-flex items-center group ${className}`}>
      {/* Info Icon */}
      <button
        type="button"
        className={`text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-full touch-manipulation ${iconClassName}`}
        aria-label={ariaLabel}
        aria-describedby={tooltipId}
        tabIndex={0}
      >
        <svg 
          className="w-4 h-4" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path 
            fillRule="evenodd" 
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
            clipRule="evenodd" 
          />
        </svg>
      </button>

      {/* Tooltip - Standardized width */}
      <div 
        className={`absolute ${positionClasses[position]} bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-3 py-2.5 rounded-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48 whitespace-normal`}
        role="tooltip"
        id={tooltipId}
        aria-hidden="true"
      >
        {Array.isArray(content) ? (
          <div className="text-left space-y-1">
            {content.map((item, index) => (
              <div key={index} className="flex items-start">
                <span className="text-blue-300 dark:text-blue-600 mr-1.5 mt-0.5 flex-shrink-0">•</span>
                <span className="leading-tight">{item}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center">{content}</div>
        )}
        {/* Arrow */}
        <div 
          className={`absolute w-2 h-2 bg-gray-900 dark:bg-gray-100 transform rotate-45 ${arrowClasses[position]}`}
        />
      </div>
    </div>
  )
} 