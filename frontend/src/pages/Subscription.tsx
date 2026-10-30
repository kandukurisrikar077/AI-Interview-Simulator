import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Star, Loader2 } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Dialog } from '../components/ui/Dialog'
import apiClient from '../services/api'
import { useToast } from '../context/ToastContext'

interface PlanData {
  id: number
  name: string
  price: string
  description?: string
  features: string[]
  interview_limit: number
}

interface SubscriptionData {
  id: number
  user_id: number
  plan_name: string
  price: string
  status: string
  features: string[]
  interview_limit: number
}

export const Subscription: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast()
  const [plans, setPlans] = useState<PlanData[]>([])
  const [currentSub, setCurrentSub] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')

  // Fetch plans and user subscription on mount
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        setLoading(true)
        const [plansRes, meRes] = await Promise.all([
          apiClient.get('/subscription/plans'),
          apiClient.get('/subscription/me')
        ])
        setPlans(plansRes.data)
        setCurrentSub(meRes.data)
      } catch (err) {
        console.error('Failed to load subscription data:', err)
        toastError('Failed to load subscription plans.')
      } finally {
        setLoading(false)
      }
    }
    fetchSubscriptionData()
  }, [])

  const handleUpgrade = async (planName: string) => {
    try {
      setUpgrading(true)
      const res = await apiClient.post('/subscription/upgrade', { plan_name: planName })
      setCurrentSub(res.data)
      setSelectedPlan(planName)
      setIsSuccessOpen(true)
      toastSuccess(`Successfully subscribed to ${planName} Plan!`)
    } catch (err) {
      console.error('Upgrade failed:', err)
      toastError('Failed to update subscription tier.')
    } finally {
      setUpgrading(false)
    }
  }

  // Fallback default plans if API loading
  const displayPlans = plans.length > 0 ? plans : [
    {
      id: 1,
      name: 'Free',
      price: '$0',
      description: 'Explore the basics of the interview room.',
      features: [
        '1 Technical session / month',
        'Text questions, no voice input',
        'Basic resume parse checklist'
      ],
      interview_limit: 1
    },
    {
      id: 2,
      name: 'Pro',
      price: '$29',
      description: 'Accelerate training with complete voice rounds.',
      features: [
        'Unlimited mock interview rooms',
        'Gemini conversational voice synthesis',
        'Integrated Monaco coding editor (Python, Java, JS, C++)',
        'ReportLab PDF result logs',
        'Gaze & tab malpractice tracking'
      ],
      interview_limit: 9999
    },
    {
      id: 3,
      name: 'Enterprise',
      price: 'Custom',
      description: 'For bootcamp metrics tracking.',
      features: [
        'Custom template parameters',
        'Dedicated admin portal analytics',
        'Feature flags management options',
        'SSO security guards settings'
      ],
      interview_limit: 99999
    }
  ]

  const activePlanName = currentSub?.plan_name || 'Free'

  return (
    <div className="min-h-screen bg-[#050816] text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <header className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="primary">Pricing & Plans</Badge>
          <h1 className="text-3xl font-extrabold tracking-tight">Flexible Calibrations</h1>
          <p className="text-gray-400 text-xs font-light">
            Choose the subscription package that best matches your practice frequency.
          </p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <span className="text-xs text-gray-400">Loading subscription tiers...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
            {displayPlans.map((pl) => {
              const isCurrent = pl.name.toLowerCase() === activePlanName.toLowerCase()
              return (
                <Card
                  key={pl.id}
                  glow={isCurrent}
                  className={`flex flex-col justify-between p-8 border ${
                    isCurrent ? 'border-purple-500/40 bg-[#101828]/80 ring-1 ring-purple-500/30' : 'border-white/5 bg-[#080d1a]/50'
                  } relative`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[9px] font-black uppercase tracking-wider shadow-lg">
                      Active Tier
                    </span>
                  )}

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">{pl.name} Plan</h3>
                      <p className="text-xs text-gray-400 font-light leading-relaxed">{pl.description}</p>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">{pl.price}</span>
                      <span className="text-xs text-gray-500">/ mo</span>
                    </div>

                    <ul className="space-y-3 text-xs text-gray-300 font-light border-t border-white/5 pt-6">
                      {pl.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8">
                    <Button
                      variant={isCurrent ? 'secondary' : 'primary'}
                      className="w-full text-xs font-bold"
                      onClick={() => handleUpgrade(pl.name)}
                      disabled={isCurrent || upgrading}
                      loading={upgrading && selectedPlan === pl.name}
                    >
                      {isCurrent ? 'Current Plan' : `Upgrade to ${pl.name}`}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Upgrade Success Dialog */}
      <Dialog
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        title="Tier Activated"
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto text-green-400">
            <Star className="w-6 h-6 fill-green-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Tier Calibrated Successfully!</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-light">
              Your account has been upgraded to the <span className="font-bold text-white">{selectedPlan}</span> package. Your interview and testing allowances have been refreshed.
            </p>
          </div>
          <div className="pt-2">
            <Button className="w-full" onClick={() => setIsSuccessOpen(false)}>
              Continue Practicing
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
