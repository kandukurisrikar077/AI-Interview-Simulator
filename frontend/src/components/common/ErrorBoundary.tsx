import React, { Component } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * React Error Boundary that catches unexpected runtime errors in the component tree.
 * Shows a graceful fallback UI instead of a blank crash screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/dashboard'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight">Something went wrong</h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                An unexpected error occurred in this component. Our team has been notified.
              </p>
              {this.state.error?.message && (
                <div className="mt-2 p-3 rounded-lg bg-red-500/5 border border-red-500/10 text-left">
                  <code className="text-xs text-red-300 font-mono break-all">
                    {this.state.error.message}
                  </code>
                </div>
              )}
            </div>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Return to Dashboard
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
