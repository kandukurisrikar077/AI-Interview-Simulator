import React from 'react'
import { motion } from 'framer-motion'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean
  glow?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  glow = false,
  ...props
}) => {
  const baseStyle = 'glass-card border border-white/5 p-6 rounded-2xl relative overflow-hidden transition-colors'
  const glowStyle = glow ? 'before:absolute before:inset-0 before:bg-gradient-to-r before:from-purple-500/5 before:to-indigo-500/5 before:pointer-events-none' : ''

  if (hoverEffect) {
    return (
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full"
      >
        <div
          className={`${baseStyle} ${glowStyle} hover:border-purple-500/20 shadow-xl hover:shadow-purple-500/5 ${className}`}
          {...props}
        >
          {children}
        </div>
      </motion.div>
    )
  }

  return (
    <div className={`${baseStyle} ${glowStyle} ${className}`} {...props}>
      {children}
    </div>
  )
}
