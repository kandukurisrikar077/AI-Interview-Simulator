import React from 'react'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-300 hover:text-white transition-colors">
        <input
          type="checkbox"
          ref={ref}
          className={`w-4.5 h-4.5 rounded border border-gray-800 bg-gray-950 accent-purple-600 focus:ring-1 focus:ring-purple-500/30 transition-all cursor-pointer ${className}`}
          {...props}
        />
        {label && <span className="text-xs text-gray-400 font-light">{label}</span>}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'
