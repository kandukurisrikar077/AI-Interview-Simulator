import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Bell, Shield, Trash2, CheckCircle2, Lock } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { Checkbox } from '../components/ui/Checkbox'
import { Tabs } from '../components/ui/Tabs'
import { Dialog } from '../components/ui/Dialog'
import { useAuth } from '../context/AuthContext'
import { userService } from '../services/userService'
import { useToast } from '../context/ToastContext'
import apiClient from '../services/api'

export const Settings: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout, updateUser } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  
  const [activeTab, setActiveTab] = useState('profile')
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [openaiApiKey, setOpenaiApiKey] = useState((user as any)?.openai_api_key || '')
  const [geminiApiKey, setGeminiApiKey] = useState((user as any)?.gemini_api_key || '')
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [soundSynthesis, setSoundSynthesis] = useState(true)

  // Profile save state
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Delete account dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Password strength checks
  const hasMinLength = newPassword.length >= 8
  const hasUpperCase = /[A-Z]/.test(newPassword)
  const hasLowerCase = /[a-z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword)
  const isPasswordStrong = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecial

  const settingsTabs = [
    { id: 'profile', label: 'Profile Details', icon: <User className="w-4 h-4" /> },
    { id: 'password', label: 'Change Password', icon: <Lock className="w-4 h-4" /> },
    { id: 'notifications', label: 'Alert System', icon: <Bell className="w-4 h-4" /> },
    { id: 'privacy', label: 'Security & Privacy', icon: <Shield className="w-4 h-4" /> }
  ]

  const handleToggleTheme = (selectedTheme: string) => {
    setTheme(selectedTheme)
    localStorage.setItem('theme', selectedTheme)
    if (selectedTheme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
    toastSuccess(`Theme toggled to ${selectedTheme.toUpperCase()}`)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toastError('Full name cannot be empty.')
      return
    }
    setProfileLoading(true)
    setProfileSuccess(false)
    try {
      const updatedUser = await userService.updateProfile({ 
        full_name: fullName,
        openai_api_key: openaiApiKey,
        gemini_api_key: geminiApiKey
      })
      updateUser({ 
        ...user!, 
        full_name: updatedUser.full_name,
        openai_api_key: updatedUser.openai_api_key,
        gemini_api_key: updatedUser.gemini_api_key
      })
      setProfileSuccess(true)
      toastSuccess('Profile and API keys updated successfully!')
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err: any) {
      toastError(err?.response?.data?.detail || 'Failed to save profile. Please try again.')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)

    if (!currentPassword) {
      setPasswordError('Please enter your current password.')
      return
    }
    if (!isPasswordStrong) {
      setPasswordError('New password must meet all requirements.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    setPasswordLoading(true)
    try {
      await userService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      toastSuccess('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to change password.'
      setPasswordError(msg)
      toastError(msg)
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() === 'delete') {
      try {
        await apiClient.delete('/auth/me')
        logout()
        toastSuccess('Your account has been deleted permanently.')
        navigate('/')
      } catch (err) {
        toastError('Failed to delete account. Please try again later.')
      }
    } else {
      setDeleteError('Please type "DELETE" exactly to confirm.')
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <header>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Workspace Settings
          </h1>
          <p className="text-gray-400 text-xs mt-1">Calibrate preferences, notifications, and security protocols.</p>
        </header>

        <Tabs tabs={settingsTabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="pt-2">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Edit Profile</h3>
                  {profileSuccess && (
                    <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Saved!
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Account Email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                  />
                  <Input
                    label="Full Name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                  />
                  
                  <Input
                    label="OpenAI API Key (Custom User Key)"
                    type="password"
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="sk-or-your-custom-openai-key"
                  />
                  <Input
                    label="Gemini API Key (Custom User Key)"
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy-or-your-custom-gemini-key"
                  />
                </div>

                <div className="space-y-2 border-t border-white/5 pt-4">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Application Theme
                  </label>
                  <div className="flex bg-gray-950 border border-white/5 rounded-xl p-1 text-xs max-w-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleTheme('dark')}
                      className={`flex-1 py-2 rounded-lg font-bold text-center cursor-pointer transition-all ${
                        theme === 'dark' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      Dark Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleTheme('light')}
                      className={`flex-1 py-2 rounded-lg font-bold text-center cursor-pointer transition-all ${
                        theme === 'light' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      Light Mode
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                  <Button type="submit" loading={profileLoading}>
                    {profileLoading ? 'Saving...' : 'Save Profile Settings'}
                  </Button>
                  <span className="text-xs text-gray-500">
                    Role: <span className="text-purple-400 font-semibold capitalize">{user?.role || 'user'}</span>
                  </span>
                </div>
              </form>
            </Card>
          )}

          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <Card>
              <form onSubmit={handleChangePassword} className="space-y-5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Change Password</h3>

                {passwordError && (
                  <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs">
                    {passwordError}
                  </div>
                )}

                <PasswordInput
                  label="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Your current password"
                  icon={<Lock className="w-4 h-4 text-gray-500" />}
                />

                <div className="space-y-2">
                  <PasswordInput
                    label="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Strong new password"
                    icon={<Lock className="w-4 h-4 text-gray-500" />}
                  />
                  {newPassword.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-gray-400">
                      <p className="font-medium text-gray-300 mb-1">Requirements:</p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        {[
                          [hasMinLength, 'Min 8 chars'],
                          [hasUpperCase, 'One uppercase'],
                          [hasLowerCase, 'One lowercase'],
                          [hasNumber, 'One number'],
                          [hasSpecial, 'One special char'],
                        ].map(([met, label]) => (
                          <div key={label as string} className={`flex items-center gap-1.5 ${met ? 'text-green-400' : 'text-gray-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${met ? 'bg-green-400' : 'bg-gray-600'}`} />
                            {label as string}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <PasswordInput
                  label="Confirm New Password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Repeat new password"
                  icon={<Lock className="w-4 h-4 text-gray-500" />}
                  error={
                    confirmNewPassword && newPassword !== confirmNewPassword
                      ? 'Passwords do not match'
                      : undefined
                  }
                />

                <Button type="submit" loading={passwordLoading}>
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card className="space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Alert Configurations</h3>
              
              <div className="space-y-4">
                <Checkbox
                  label="Receive weekly analysis summary reports to email address"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                />
                
                <Checkbox
                  label="Enable browser-based Text-to-Speech voice synthesis in simulation rooms"
                  checked={soundSynthesis}
                  onChange={(e) => setSoundSynthesis(e.target.checked)}
                />
              </div>

              <Button onClick={() => toastSuccess('Notification preferences saved!')}>
                Save Preferences
              </Button>
            </Card>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <Card className="space-y-8 divide-y divide-white/5">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Security Preferences</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-light">
                  Your assessment transcripts, webcam feeds verification indicators, and files are stored
                  strictly inside private secure database servers. JWT tokens expire after 7 days.
                </p>
              </div>

              <div className="pt-6 space-y-4">
                <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Danger Zone
                </h3>
                <p className="text-xs text-gray-500 font-light leading-relaxed">
                  Permanently erase your credentials, history, and uploaded PDF resumes. This action is irreversible.
                </p>
                <Button variant="danger" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
                  Delete Account...
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setDeleteConfirmText('')
          setDeleteError(null)
        }}
        title="Confirm Account Deletion"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-400 leading-relaxed font-light">
            Erase account details forever. To proceed, please type the keyword <strong className="text-white">DELETE</strong> in the field below.
          </p>

          <Input
            type="text"
            placeholder="Type DELETE"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            error={deleteError || undefined}
          />

          <div className="flex gap-4 pt-2">
            <Button variant="danger" className="flex-1" onClick={handleDeleteAccount}>
              Confirm Delete
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
