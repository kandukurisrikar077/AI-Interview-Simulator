import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Users, FileCode, Brain, CreditCard, ToggleLeft, HelpCircle, LogOut, LayoutDashboard, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface AdminLayoutProps {
  children: React.ReactNode
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navItems = [
    { path: '/admin/dashboard', label: 'Metrics Overview', icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
    { path: '/admin/users', label: 'User Manager', icon: <Users className="w-4.5 h-4.5" /> },
    { path: '/admin/templates', label: 'Interview Templates', icon: <FileCode className="w-4.5 h-4.5" /> },
    { path: '/admin/questions', label: 'Question Bank', icon: <HelpCircle className="w-4.5 h-4.5" /> },
    { path: '/admin/prompts', label: 'Prompt Controls', icon: <Brain className="w-4.5 h-4.5" /> },
    { path: '/admin/payments', label: 'Billing Records', icon: <CreditCard className="w-4.5 h-4.5" /> },
    { path: '/admin/flags', label: 'Feature Flags', icon: <ToggleLeft className="w-4.5 h-4.5" /> },
    { path: '/admin/reset', label: 'Database Reset', icon: <Trash2 className="w-4.5 h-4.5" /> }
  ]

  return (
    <div className="min-h-screen bg-[#050816] text-white flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/5 bg-[#101828]/20 flex flex-col justify-between p-6 shrink-0 hidden md:flex">
        <div className="space-y-8">
          <div>
            <Link to="/" className="text-2xl font-black text-gradient-purple tracking-tight block">
              IntervueAI
            </Link>
            <span className="text-[9px] font-black uppercase text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 mt-1 inline-block">
              Admin Console
            </span>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-purple-500/10 text-purple-300'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all text-left font-bold text-xs uppercase tracking-wider cursor-pointer w-full"
        >
          <LogOut className="w-4.5 h-4.5" /> Sign Out
        </button>
      </aside>

      {/* Content wrapper */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
