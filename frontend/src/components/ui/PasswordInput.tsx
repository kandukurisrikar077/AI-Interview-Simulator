import React, { useState, useId } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

/**
 * PasswordInput — a production-quality password field with animated
 * show/hide toggle. Drop-in replacement for <Input type="password" />.
 * 
 * Design matches the existing IntervueAI Input component exactly.
 * Fully accessible: ARIA labels, keyboard support, focus rings.
 */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, icon, className = '', id, disabled, ...props }, ref) => {
    const [visible, setVisible] = useState(false)
    const generatedId = useId()
    const inputId = id || generatedId

    const toggle = () => {
      if (!disabled) setVisible((v) => !v)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggle()
      }
    }

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-gray-400 uppercase tracking-wider"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {/* Left icon slot */}
          {icon && (
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            disabled={disabled}
            autoComplete={visible ? 'off' : 'current-password'}
            aria-label={label || props['aria-label'] || 'Password'}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={`w-full py-2.5 rounded-lg border bg-gray-950/60 focus:ring-1 outline-none transition-all placeholder-gray-600 text-sm pr-11 ${
              icon ? 'pl-10' : 'pl-4'
            } ${
              error
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20 text-white'
                : 'border-gray-800 focus:border-purple-500 focus:ring-purple-500/30 text-white'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
            {...props}
          />

          {/* Right — eye toggle button */}
          <button
            type="button"
            onClick={toggle}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            tabIndex={0}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            className={`
              absolute inset-y-0 right-0 flex items-center justify-center w-11
              text-gray-500 transition-all duration-200 rounded-r-lg
              focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60
              focus-visible:ring-inset
              ${disabled
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:text-gray-300 cursor-pointer active:scale-95'
              }
            `}
          >
            <span
              style={{
                display: 'inline-flex',
                transition: 'opacity 0.18s ease, transform 0.18s ease',
                opacity: 1,
              }}
            >
              {visible ? (
                <EyeOff
                  className="w-4 h-4"
                  style={{
                    animation: 'intervue-eye-in 0.18s ease',
                  }}
                />
              ) : (
                <Eye
                  className="w-4 h-4"
                  style={{
                    animation: 'intervue-eye-in 0.18s ease',
                  }}
                />
              )}
            </span>
          </button>
        </div>

        {error && (
          <span id={`${inputId}-error`} className="block text-xs text-red-400 font-light mt-1" role="alert">
            {error}
          </span>
        )}

        {/* Keyframe animation injected once — minimal, no extra deps */}
        <style>{`
          @keyframes intervue-eye-in {
            from { opacity: 0; transform: scale(0.75) rotate(-8deg); }
            to   { opacity: 1; transform: scale(1)    rotate(0deg);  }
          }
        `}</style>
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
