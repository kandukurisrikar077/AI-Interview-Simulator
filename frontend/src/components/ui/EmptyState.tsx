import React from 'react'
import { motion } from 'framer-motion'
import { Button } from './Button'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * EmptyState — Production-quality empty state component.
 * Used across Dashboard, Analytics, Interview History, Resume Manager, etc.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  size = 'md',
  className = ''
}) => {
  const sizeStyles = {
    sm: { wrapper: 'py-10', iconBox: 'w-12 h-12', iconSize: 'w-5 h-5', titleSize: 'text-sm', descSize: 'text-xs' },
    md: { wrapper: 'py-16', iconBox: 'w-16 h-16', iconSize: 'w-7 h-7', titleSize: 'text-base', descSize: 'text-sm' },
    lg: { wrapper: 'py-24', iconBox: 'w-20 h-20', iconSize: 'w-9 h-9', titleSize: 'text-lg', descSize: 'text-sm' },
  }

  const s = sizeStyles[size]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`flex flex-col items-center justify-center text-center ${s.wrapper} ${className}`}
    >
      {/* Icon bubble */}
      <div className={`${s.iconBox} rounded-2xl bg-purple-500/8 border border-purple-500/15 flex items-center justify-center text-purple-400 mb-5 shadow-lg shadow-purple-500/5`}>
        <span className={s.iconSize}>
          {icon}
        </span>
      </div>

      {/* Decorative dots */}
      <div className="flex gap-1.5 mb-5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-purple-500/30"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      <h3 className={`${s.titleSize} font-bold text-white mb-2 tracking-tight`}>{title}</h3>
      <p className={`${s.descSize} text-gray-500 font-light leading-relaxed max-w-xs`}>{description}</p>

      {action && (
        <div className="mt-6">
          {action.href ? (
            <a href={action.href}>
              <Button size="sm">{action.label}</Button>
            </a>
          ) : (
            <Button size="sm" onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </motion.div>
  )
}
