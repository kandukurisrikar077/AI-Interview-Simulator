import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-semibold transition-all outline-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none rounded-xl w-full'
  
  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/10 border border-transparent',
    secondary: 'bg-[#101828] border border-gray-800 hover:bg-gray-800 text-gray-200',
    danger: 'bg-red-600 hover:bg-red-500 text-white border border-transparent shadow-lg shadow-red-500/10',
    outline: 'bg-transparent border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white',
    ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
  }

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5'
  }

  const wrapperClass = className.includes('w-full') ? 'w-full' : 'inline-flex'

  return (
    <motion.div
      whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
      className={wrapperClass}
    >
      <button
        className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
        {!loading && icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
        {!loading && icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
      </button>
    </motion.div>
  )
}
