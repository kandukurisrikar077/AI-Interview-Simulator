import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export const Breadcrumbs: React.FC = () => {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  if (pathnames.length === 0 || location.pathname === '/') return null

  const labelMapping: Record<string, string> = {
    dashboard: 'Dashboard',
    resume: 'Resume Manager',
    interview: 'Interview Room',
    setup: 'Room Setup',
    live: 'Verbal Room',
    coding: 'Monaco Editor',
    report: 'Performance Report',
    profile: 'Profile',
    analytics: 'Analytics Suite',
    settings: 'Settings',
    subscription: 'Subscriptions',
    admin: 'Admin Console'
  }

  return (
    <nav className="flex items-center space-x-2 text-xs text-gray-500 mb-6 font-medium">
      <Link to="/dashboard" className="flex items-center gap-1 hover:text-white transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1
        const label = labelMapping[name] || name.charAt(0).toUpperCase() + name.slice(1)

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-3 h-3 text-gray-700" />
            {isLast ? (
              <span className="text-purple-400 font-semibold">{label}</span>
            ) : (
              <Link to={routeTo} className="hover:text-white transition-colors capitalize">
                {label}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
