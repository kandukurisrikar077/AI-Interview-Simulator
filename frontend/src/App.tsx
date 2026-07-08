import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'

// Import Pages
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { ForgotPassword } from './pages/ForgotPassword'
import { VerifyEmail } from './pages/VerifyEmail'
import { ResetPassword } from './pages/ResetPassword'
import { Dashboard } from './pages/Dashboard'
import { Resume } from './pages/Resume'
import { Setup } from './pages/Setup'
import { LiveInterview } from './pages/LiveInterview'
import { CodingRound } from './pages/CodingRound'
import { Report } from './pages/Report'
import { Profile } from './pages/Profile'
import { Analytics } from './pages/Analytics'
import { Settings } from './pages/Settings'
import { Subscription } from './pages/Subscription'
import { ErrorPage } from './pages/ErrorPage'
import { WorkspaceSelect } from './pages/WorkspaceSelect'
import { Roadmap } from './pages/Roadmap'
import { History } from './pages/History'
import { Achievements } from './pages/Achievements'
import { HelpCenter } from './pages/HelpCenter'
import { ResumeBuilder } from './pages/ResumeBuilder'
import { CoverLetter } from './pages/CoverLetter'
import { SocialAnalyzer } from './pages/SocialAnalyzer'
import { CompanyInterviews } from './pages/CompanyInterviews'
import { Aptitude } from './pages/Aptitude'
import { GroupDiscussion } from './pages/GroupDiscussion'
import { HrSimulator } from './pages/HrSimulator'
import { CertificatesList } from './pages/CertificatesList'

// Import Recruiter views
import { RecruiterSignup } from './pages/recruiter/RecruiterSignup'
import { RecruiterLogin } from './pages/recruiter/RecruiterLogin'
import { RecruiterDashboard } from './pages/recruiter/RecruiterDashboard'
import { CreateJob } from './pages/recruiter/CreateJob'
import { HiringCampaigns } from './pages/recruiter/HiringCampaigns'
import { CandidatePipeline } from './pages/recruiter/CandidatePipeline'
import { QuestionBank } from './pages/recruiter/QuestionBank'
import { TeamInvite } from './pages/recruiter/TeamInvite'
import { RecruiterSettings } from './pages/recruiter/RecruiterSettings'
import { RecruiterReports } from './pages/recruiter/RecruiterReports'

// Import Admin views
import { AdminLogin } from './pages/admin/AdminLogin'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminLayout } from './components/layout/AdminLayout'

// Protected Route Guard Component (Candidate ONLY)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'user') {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

// Redirect if already authenticated to corresponding dashboard
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (token && user) {
    if (user.role === 'admin' || user.role === 'SUPER_ADMIN') {
      return <Navigate to="/admin/dashboard" replace />
    } else if (user.role === 'recruiter') {
      return <Navigate to="/company/dashboard" replace />
    } else {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}

// Recruiter Route Guard Component
const RecruiterRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/recruiter/login" replace />
  }

  if (user?.role !== 'recruiter') {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

// Admin Route Guard Component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/admin/login" replace />
  }

  if (user?.role !== 'admin' && user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Views */}
            <Route path="/" element={<Landing />} />
            
            <Route 
              path="/workspace-select" 
              element={
                <PublicOnlyRoute>
                  <WorkspaceSelect />
                </PublicOnlyRoute>
              } 
            />

            <Route 
              path="/login" 
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <PublicOnlyRoute>
                  <Signup />
                </PublicOnlyRoute>
              } 
            />
            <Route 
              path="/forgot-password" 
              element={
                <PublicOnlyRoute>
                  <ForgotPassword />
                </PublicOnlyRoute>
              } 
            />
            <Route 
              path="/verify-email" 
              element={
                <VerifyEmail />
              } 
            />
            <Route 
              path="/reset-password" 
              element={
                <ResetPassword />
              } 
            />

            {/* Recruiter Views */}
            <Route 
              path="/recruiter/signup" 
              element={
                <PublicOnlyRoute>
                  <RecruiterSignup />
                </PublicOnlyRoute>
              } 
            />
            <Route 
              path="/recruiter/login" 
              element={
                <PublicOnlyRoute>
                  <RecruiterLogin />
                </PublicOnlyRoute>
              } 
            />
            <Route 
              path="/company/dashboard" 
              element={
                <RecruiterRoute>
                  <RecruiterDashboard />
                </RecruiterRoute>
              } 
            />
            <Route 
              path="/company/jobs/create" 
              element={
                <RecruiterRoute>
                  <CreateJob />
                </RecruiterRoute>
              } 
            />
            <Route 
              path="/company/templates" 
              element={
                <RecruiterRoute>
                  <HiringCampaigns />
                </RecruiterRoute>
              } 
            />
            <Route 
              path="/company/candidates" 
              element={
                <RecruiterRoute>
                  <CandidatePipeline />
                </RecruiterRoute>
              } 
            />
            <Route 
              path="/company/questions" 
              element={
                <RecruiterRoute>
                  <QuestionBank />
                </RecruiterRoute>
              } 
            />
            <Route 
              path="/company/team" 
              element={
                <RecruiterRoute>
                  <TeamInvite />
                </RecruiterRoute>
              } 
            />
            <Route 
              path="/company/settings" 
              element={
                <RecruiterRoute>
                  <RecruiterSettings />
                </RecruiterRoute>
              } 
            />
            <Route 
              path="/company/reports" 
              element={
                <RecruiterRoute>
                  <RecruiterReports />
                </RecruiterRoute>
              } 
            />
            <Route 
              path="/company/analytics" 
              element={
                <RecruiterRoute>
                  <RecruiterReports />
                </RecruiterRoute>
              } 
            />

            {/* Secure Candidate Workspace Views */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/resume" 
              element={
                <ProtectedRoute>
                  <Resume />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/interview/setup" 
              element={
                <ProtectedRoute>
                  <Setup />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/interview/live" 
              element={
                <ProtectedRoute>
                  <LiveInterview />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/coding" 
              element={
                <ProtectedRoute>
                  <CodingRound />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/report" 
              element={
                <ProtectedRoute>
                  <Report />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/roadmap" 
              element={
                <ProtectedRoute>
                  <Roadmap />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/history" 
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/achievements" 
              element={
                <ProtectedRoute>
                  <Achievements />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/help" 
              element={
                <ProtectedRoute>
                  <HelpCenter />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/resume/builder" 
              element={
                <ProtectedRoute>
                  <ResumeBuilder />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/cover-letter" 
              element={
                <ProtectedRoute>
                  <CoverLetter />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/linkedin-analyzer" 
              element={
                <ProtectedRoute>
                  <SocialAnalyzer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/interview/company" 
              element={
                <ProtectedRoute>
                  <CompanyInterviews />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/aptitude" 
              element={
                <ProtectedRoute>
                  <Aptitude />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/discussion" 
              element={
                <ProtectedRoute>
                  <GroupDiscussion />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hr-simulator" 
              element={
                <ProtectedRoute>
                  <HrSimulator />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/certificates" 
              element={
                <ProtectedRoute>
                  <CertificatesList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/subscription" 
              element={
                <ProtectedRoute>
                  <Subscription />
                </ProtectedRoute>
              } 
            />

            {/* Admin Section */}
            <Route 
              path="/admin/login" 
              element={
                <PublicOnlyRoute>
                  <AdminLogin />
                </PublicOnlyRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/templates" 
              element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/questions" 
              element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/prompts" 
              element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/payments" 
              element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/flags" 
              element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/reset" 
              element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </AdminRoute>
              } 
            />

            {/* Error and Fallback routing */}
            <Route path="/unauthorized" element={<ErrorPage code="401" />} />
            <Route path="/forbidden" element={<ErrorPage code="403" />} />
            <Route path="/error" element={<ErrorPage code="500" />} />
            <Route path="/offline" element={<ErrorPage code="offline" />} />
            <Route path="*" element={<ErrorPage code="404" />} />
          </Routes>
        </BrowserRouter>
       </ToastProvider>
      </AuthProvider>
  )
}

export default App
