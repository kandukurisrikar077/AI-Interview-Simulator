import React, { createContext, useState, useEffect, useContext } from 'react'
import axios from 'axios'
import apiClient from '../services/api'

export interface User {
  id: number
  email: string
  full_name: string | null
  role?: string
  created_at: string
  company_name?: string | null
  company_size?: string | null
  industry?: string | null

  // SaaS Profile fields
  profile_photo?: string | null
  phone_number?: string | null
  country?: string | null
  city?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  portfolio_url?: string | null
  college?: string | null
  degree?: string | null
  branch?: string | null
  graduation_year?: number | null
  cgpa?: number | null
  current_status?: string | null
  experience?: string | null
  preferred_role?: string | null
  preferred_company_type?: string | null
  preferred_location?: string | null
  preferred_language?: string | null
  skills_tags?: string[] | null
  profile_completed?: boolean
  openai_api_key?: string | null
  gemini_api_key?: string | null
  company_website?: string | null
  company_logo?: string | null
  job_title?: string | null
  department?: string | null
  timezone?: string | null
  hiring_for?: string[] | null
  primary_roles?: string[] | null
  recruiter_onboarding_completed?: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (token: string, user: User, rememberMe?: boolean) => void
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token') || sessionStorage.getItem('token')
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token')
      if (storedToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
        try {
          const res = await apiClient.get('/auth/me')
          setUser(res.data)
        } catch (err) {
          console.error('Auth initialization check failed:', err)
          localStorage.removeItem('token')
          sessionStorage.removeItem('token')
          setToken(null)
          delete axios.defaults.headers.common['Authorization']
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = (newToken: string, newUser: User, rememberMe: boolean = true) => {
    if (rememberMe) {
      localStorage.setItem('token', newToken)
    } else {
      sessionStorage.setItem('token', newToken)
    }
    setToken(newToken)
    setUser(newUser)
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  const logout = () => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
