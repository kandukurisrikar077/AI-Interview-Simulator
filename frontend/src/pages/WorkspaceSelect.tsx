import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Briefcase, Shield, CheckCircle2, ArrowRight } from 'lucide-react'

export const WorkspaceSelect: React.FC = () => {
  const navigate = useNavigate()

  const workspaces = [
    {
      id: 'candidate',
      title: 'Candidate',
      subtitle: 'Practice AI Interviews',
      description: 'Prepare and practice with our state-of-the-art AI interview engine to land your dream job.',
      features: [
        'Practice AI Interviews',
        'Resume Analysis & ATS Scoring',
        'Interactive Coding Challenges',
        'Detailed Performance Reports'
      ],
      icon: User,
      gradient: 'from-purple-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20',
      border: 'hover:border-purple-500/40',
      iconColor: 'text-purple-400',
      path: '/login'
    },
    {
      id: 'recruiter',
      title: 'Recruiter / Company',
      subtitle: 'Manage Candidates',
      description: 'Streamline your hiring process with AI-driven screening and candidate assessments.',
      features: [
        'Manage Candidates & Submissions',
        'Create Interview Templates',
        'Global Question Bank',
        'Hiring Dashboard & Analytics'
      ],
      icon: Briefcase,
      gradient: 'from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20',
      border: 'hover:border-blue-500/40',
      iconColor: 'text-blue-400',
      path: '/recruiter/login'
    },
    {
      id: 'admin',
      title: 'Administrator',
      subtitle: 'Platform Management',
      description: 'Configure global security policies, manage user permissions, and view system metrics.',
      features: [
        'Platform & Subscription Settings',
        'User Account Management',
        'System Metrics & Health Logs',
        'Security Auditing & Controls'
      ],
      icon: Shield,
      gradient: 'from-rose-500/10 to-purple-500/10 hover:from-rose-500/20 hover:to-purple-500/20',
      border: 'hover:border-rose-500/40',
      iconColor: 'text-rose-400',
      path: '/admin/login'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15
      }
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-16 overflow-hidden bg-[#050816] text-white">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-6xl relative z-10 flex flex-col items-center">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Link to="/" className="text-4xl font-extrabold tracking-tight text-gradient-purple mb-4 inline-block">
            IntervueAI
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Choose Your Workspace
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
            Select the appropriate portal option to access your customized dashboard interface.
          </p>
        </motion.div>

        {/* Workspaces Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl"
        >
          {workspaces.map((ws) => {
            const Icon = ws.icon
            return (
              <motion.div
                key={ws.id}
                variants={cardVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => navigate(ws.path)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(ws.path)
                  }
                }}
                tabIndex={0}
                className={`glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br ${ws.gradient} ${ws.border} transition-all duration-300 cursor-pointer flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-purple-500/50 group select-none`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-3.5 rounded-xl bg-white/5 border border-white/10 ${ws.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] uppercase font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      {ws.title.split(' ')[0]}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">
                    {ws.title}
                  </h3>
                  <p className="text-xs text-gray-400 mb-6 italic">{ws.subtitle}</p>

                  <p className="text-sm text-gray-300/95 leading-relaxed mb-6">
                    {ws.description}
                  </p>

                  <div className="border-t border-white/5 pt-5 mb-6">
                    <ul className="space-y-2.5">
                      {ws.features.map((feat, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs text-gray-400">
                          <CheckCircle2 className="w-4 h-4 text-purple-400/80 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between text-xs font-semibold text-purple-400 group-hover:text-purple-300 pt-2 transition-colors">
                  <span>Enter Workspace</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-12 text-center text-xs text-gray-500"
        >
          <span>Need help or experiencing authentication issues? </span>
          <a href="mailto:support@intervueai.com" className="text-purple-400/80 hover:text-purple-400 transition-colors underline">
            Contact Security Ops
          </a>
        </motion.div>
      </div>
    </div>
  )
}
