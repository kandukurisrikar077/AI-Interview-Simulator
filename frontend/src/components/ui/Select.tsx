import React from 'react'

interface Option {
  value: string | number
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: Option[]
  error?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-4 py-2.5 rounded-lg border bg-gray-950/60 focus:ring-1 outline-none transition-all cursor-pointer text-sm ${
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20 text-white'
              : 'border-gray-800 focus:border-purple-500 focus:ring-purple-500/30 text-white'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-gray-950 text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="block text-xs text-red-400 font-light mt-1">{error}</span>}
      </div>
    )
  }
)

Select.displayName = 'Select'
