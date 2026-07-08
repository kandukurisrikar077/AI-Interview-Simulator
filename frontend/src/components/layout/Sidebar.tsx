import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  Mic,
  Code2,
  BarChart3,
  Map,
  CalendarClock,
  Trophy,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  FileSpreadsheet,
  FilePlus,
  Building,
  Gamepad,
  Volume2,
  Award,
  Users2
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard',          label: 'Dashboard',            icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
  { path: '/resume',             label: 'Upload Resume',        icon: <FileText className="w-4.5 h-4.5" /> },
  { path: '/resume/builder',     label: 'AI Resume Builder',    icon: <FilePlus className="w-4.5 h-4.5" /> },
  { path: '/cover-letter',       label: 'Cover Letter Maker',   icon: <FileSpreadsheet className="w-4.5 h-4.5" /> },
  { path: '/linkedin-analyzer',  label: 'Profile Analyzer',     icon: <Linkedin className="w-4.5 h-4.5" /> },
  { path: '/interview/setup',    label: 'Custom Mock',          icon: <Mic className="w-4.5 h-4.5" /> },
  { path: '/interview/company',  label: 'Company Mocks',        icon: <Building className="w-4.5 h-4.5" /> },
  { path: '/coding',             label: 'Coding Practice',      icon: <Code2 className="w-4.5 h-4.5" /> },
  { path: '/aptitude',           label: 'Aptitude Timed MCQ',   icon: <Gamepad className="w-4.5 h-4.5" /> },
  { path: '/discussion',         label: 'Group Discussion',     icon: <Users2 className="w-4.5 h-4.5" /> },
  { path: '/hr-simulator',       label: 'HR Behavioural',       icon: <Volume2 className="w-4.5 h-4.5" /> },
  { path: '/certificates',       label: 'Credentials',          icon: <Award className="w-4.5 h-4.5" /> },
  { path: '/analytics',          label: 'Analytics',             icon: <BarChart3 className="w-4.5 h-4.5" /> },
  { path: '/roadmap',            label: 'Learning Roadmap',      icon: <Map className="w-4.5 h-4.5" /> },
  { path: '/history',            label: 'Interview History',     icon: <CalendarClock className="w-4.5 h-4.5" /> },
  { path: '/achievements',       label: 'Achievements',          icon: <Trophy className="w-4.5 h-4.5" /> },
  { path: '/profile',            label: 'Profile',               icon: <User className="w-4.5 h-4.5" /> },
  { path: '/settings',           label: 'Settings',              icon: <Settings className="w-4.5 h-4.5" /> },
  { path: '/help',               label: 'Help & Support',        icon: <HelpCircle className="w-4.5 h-4.5" /> },
]

interface SidebarProps {
  /** Controls whether this Sidebar is shown on mobile via the parent-level hamburger. */
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onMobileClose }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const initials = (user?.full_name || user?.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  /* ── Shared nav content ─────────────────────────────────────── */
  const NavContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        {!collapsed && (
          <Link to="/dashboard" className="text-xl font-black text-gradient-purple tracking-tight">
            IntervueAI
          </Link>
        )}
        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        {/* Mobile close button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden flex items-center justify-center w-7 h-7 rounded-lg text-gray-500 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto pr-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path === '/interview/setup' && location.pathname.startsWith('/interview'))
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              title={collapsed ? item.label : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                ${isActive
                  ? 'bg-purple-500/12 text-purple-300 font-semibold'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/5 font-medium'
                }
              `}
            >
              {/* Active left indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-purple-400 rounded-r-full" />
              )}
              <span className={`shrink-0 ${isActive ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-300'} transition-colors`}>
                {item.icon}
              </span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs tracking-wide whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.badge && !collapsed && (
                <span className="ml-auto text-[9px] font-black bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full border border-purple-500/20">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User profile footer */}
      <div className="mt-6 shrink-0 space-y-2">
        <div className={`flex items-center gap-3 px-3 py-2 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 text-xs font-bold shrink-0">
            {initials}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-semibold text-white truncate leading-tight">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-[10px] text-gray-500 truncate leading-tight">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleLogout}
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/80 hover:text-red-300
            hover:bg-red-500/8 transition-all text-xs font-medium cursor-pointer w-full
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut className="w-4.5 h-4.5 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden md:flex flex-col h-screen sticky top-0 border-r border-white/5 bg-[#080d1a]/60 backdrop-blur-sm shrink-0 overflow-hidden px-3 py-6"
      >
        {NavContent}
      </motion.aside>

      {/* ── Mobile Overlay ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={onMobileClose}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-[#080d1a] border-r border-white/5 px-4 py-6 overflow-y-auto md:hidden"
            >
              {NavContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

/* ── Mobile Hamburger Button ────────────────────────────────────────────────── */
export const MobileMenuButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    aria-label="Open navigation menu"
    className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-white/8 bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
  >
    <Menu className="w-4.5 h-4.5" />
  </button>
)
