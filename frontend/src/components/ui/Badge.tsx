import React from 'react'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'danger' | 'info' | 'outline'
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border'
  
  const variants = {
    primary: 'border-purple-500/20 bg-purple-500/10 text-purple-400',
    success: 'border-green-500/20 bg-green-500/10 text-green-400',
    danger: 'border-red-500/20 bg-red-500/10 text-red-400',
    info: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
    outline: 'border-gray-800 bg-transparent text-gray-400'
  }

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  )
}
