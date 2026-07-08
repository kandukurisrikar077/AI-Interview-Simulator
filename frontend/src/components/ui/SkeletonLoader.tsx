import React from 'react'

interface SkeletonProps {
  variant?: 'text' | 'card' | 'list'
  count?: number
  className?: string
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({
  variant = 'text',
  count = 1,
  className = ''
}) => {
  const elements = Array.from({ length: count })

  const cardSkeleton = (
    <div className="glass-card border border-white/5 p-6 rounded-2xl animate-pulse space-y-4 w-full">
      <div className="h-4 bg-white/10 rounded w-1/3" />
      <div className="h-8 bg-white/10 rounded w-2/3" />
      <div className="h-3 bg-white/5 rounded w-1/2" />
    </div>
  )

  const textSkeleton = (
    <div className="animate-pulse space-y-2 w-full">
      <div className="h-4 bg-white/10 rounded w-3/4" />
      <div className="h-3.5 bg-white/5 rounded w-5/6" />
      <div className="h-3.5 bg-white/5 rounded w-2/3" />
    </div>
  )

  const listSkeleton = (
    <div className="animate-pulse space-y-4.5 w-full">
      {elements.map((_, i) => (
        <div key={i} className="flex justify-between items-center py-3 border-b border-white/5">
          <div className="space-y-1.5 w-1/2">
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/5 rounded w-1/2" />
          </div>
          <div className="h-6 bg-white/10 rounded w-16" />
        </div>
      ))}
    </div>
  )

  if (variant === 'card') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-${count} gap-6 ${className}`}>
        {elements.map((_, i) => (
          <React.Fragment key={i}>{cardSkeleton}</React.Fragment>
        ))}
      </div>
    )
  }

  if (variant === 'list') {
    return <div className={className}>{listSkeleton}</div>
  }

  return (
    <div className={className}>
      {elements.map((_, i) => (
        <React.Fragment key={i}>{textSkeleton}</React.Fragment>
      ))}
    </div>
  )
}
