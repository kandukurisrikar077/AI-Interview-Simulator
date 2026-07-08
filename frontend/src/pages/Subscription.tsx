import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Star } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Dialog } from '../components/ui/Dialog'

export const Subscription: React.FC = () => {
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')

  const plans = [
    {
      name: 'Free',
      price: '$0',
      desc: 'Explore the basics of the interview room.',
      features: [
        '1 Technical session / month',
        'Text questions, no voice input',
        'Basic resume parse checklist'
      ],
      current: false,
      cta: 'Current Plan'
    },
    {
      name: 'Pro',
      price: '$29',
      desc: 'Accelerate training with complete voice rounds.',
      features: [
        'Unlimited mock interview rooms',
        'Gemini conversational voice synthesis',
        'Integrated Monaco coding editor (Python, Java, JS, C++)',
        'ReportLab PDF result logs',
        'Gaze & tab malpractice tracking'
      ],
      current: true,
      cta: 'Upgrade Workspace'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      desc: 'For bootcamp metrics tracking.',
      features: [
        'Custom template parameters',
        'Dedicated admin portal analytics',
        'Feature flags management options',
        'SSO security guards settings'
      ],
      current: false,
      cta: 'Contact Sales'
    }
  ]

  const handleUpgrade = (planName: string) => {
    setSelectedPlan(planName)
    setIsSuccessOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <header className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="primary">Pricing Management</Badge>
          <h1 className="text-3xl font-extrabold tracking-tight">Flexible Calibrations</h1>
          <p className="text-gray-400 text-xs font-light">
            Choose the subscription package that best matches your practice frequency.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
          {plans.map((pl, i) => (
            <Card
              key={i}
              glow={pl.current}
              className={`flex flex-col justify-between p-8 border ${
                pl.current ? 'border-purple-500/30 bg-[#101828]/80' : 'border-white/5'
              } relative`}
            >
              {pl.current && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[9px] font-black uppercase tracking-wider shadow-lg">
                  Active tier
                </span>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{pl.name} Plan</h3>
                  <p className="text-xs text-gray-500 font-light leading-relaxed">{pl.desc}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">{pl.price}</span>
                  <span className="text-xs text-gray-500">/ mo</span>
                </div>

                <ul className="space-y-3 text-xs text-gray-400 font-light border-t border-white/5 pt-6">
                  {pl.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Button
                  variant={pl.current ? 'primary' : 'secondary'}
                  className="w-full text-xs font-bold"
                  onClick={() => handleUpgrade(pl.name)}
                  disabled={pl.name === 'Free'}
                >
                  {pl.cta}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Upgrade Mock Success Dialog */}
      <Dialog
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        title="Upgrade Calibrated"
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto text-green-400">
            <Star className="w-6 h-6 fill-green-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Upgrade Request Simulated!</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-light">
              You selected the **{selectedPlan}** subscription package. Billing webhooks will be mapped during active integration.
            </p>
          </div>
          <div className="pt-2">
            <Button className="w-full" onClick={() => setIsSuccessOpen(false)}>
              Proceed to Dashboard
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
