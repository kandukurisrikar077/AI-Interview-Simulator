import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`w-full py-2.5 rounded-lg border bg-gray-950/60 focus:ring-1 outline-none transition-all placeholder-gray-600 text-sm ${
              icon ? 'pl-10' : 'pl-4'
            } ${
              error
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20 text-white'
                : 'border-gray-800 focus:border-purple-500 focus:ring-purple-500/30 text-white'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <span className="block text-xs text-red-400 font-light mt-1">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
