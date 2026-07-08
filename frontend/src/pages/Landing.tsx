import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, ArrowRight, ShieldCheck, Mic, FileText, Code, CheckCircle, 
  ChevronDown, HelpCircle, Star, ArrowUpRight, Target, Play
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

export const Landing: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  const companies = [
    'Google', 'Microsoft', 'Meta', 'Amazon', 'Apple', 'Netflix', 'Stripe', 'Airbnb'
  ]

  const features = [
    {
      icon: <FileText className="w-6 h-6 text-purple-400" />,
      badge: 'Resume Analysis',
      title: 'ATS Resume Scorer',
      desc: 'Upload your PDF resume. Our Gemini parser extracts skills, experience, and projects to adapt the questions directly to your professional background.'
    },
    {
      icon: <Mic className="w-6 h-6 text-indigo-400" />,
      badge: 'Vocal Practice',
      title: 'Conversational Voice Room',
      desc: 'Talk back naturally using client-side speech recognition. The simulator evaluates your verbal response speed, grammar clarity, and hesitation metrics.'
    },
    {
      icon: <Code className="w-6 h-6 text-fuchsia-400" />,
      badge: 'Monaco Sandbox',
      title: 'Integrated Coding Arena',
      desc: 'Solve custom-generated algorithm problems in real time. The environment provides syntax coloring, auto-completion, and local sandbox compilers.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      badge: 'Exam Integrity',
      title: 'Integrity Malpractice Watch',
      desc: 'Client-side camera gaze trackers and tab visibility focus monitors record warnings. Prevents auxiliary resource lookups to mimic real-world tests.'
    }
  ]

  const steps = [
    {
      number: '01',
      title: 'Upload Profile & Credentials',
      desc: 'Provide your details and upload a PDF resume. The AI will audit your credentials and map a tailored curriculum.'
    },
    {
      number: '02',
      title: 'Calibrate Mock Environment',
      desc: 'Choose your round target (Technical Q&A, HR Behavioral, or Monaco Coding), experience tier, and session duration.'
    },
    {
      number: '03',
      title: 'Simulate Live Assessment',
      desc: 'Initiate hardware validation, turn on your webcam, and communicate with the adaptive voice interviewer.'
    },
    {
      number: '04',
      title: 'Retrieve Analytical Summary',
      desc: 'Collect detailed category scores, transcript timelines, malpractice logs, and a printable PDF assessment report.'
    }
  ]

  const plans = [
    {
      name: 'Starter',
      price: '$0',
      period: 'Forever free',
      desc: 'Perfect for exploring the simulation room.',
      features: [
        '1 Interview simulation round / month',
        'Basic text-based question flow',
        'Standard resume text parsing',
        'Summary email report logs'
      ],
      cta: 'Start Practice Free',
      popular: false,
      variant: 'outline' as const
    },
    {
      name: 'Professional',
      price: '$29',
      period: 'per user / month',
      desc: 'Accelerate your career preparation.',
      features: [
        'Unlimited mock interview rooms',
        'Adaptive Gemini voice questioning',
        'Integrated Monaco coding compiler sandbox',
        'Full ReportLab PDF printable downloads',
        'Real-time webcam gaze malpractice checking'
      ],
      cta: 'Unlock Pro Access',
      popular: true,
      variant: 'primary' as const
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'volume scale pricing',
      desc: 'Tailored assessments for scaling bootcamps.',
      features: [
        'Custom template question parameters',
        'Advanced system prompt configurations',
        'SSO Integration & user role management',
        'Dedicated administrative analytics dashboard',
        'White-label branding options'
      ],
      cta: 'Contact Sales',
      popular: false,
      variant: 'secondary' as const
    }
  ]

  const testimonials = [
    {
      quote: "The voice pacing metrics helped me eliminate hesitation filler words. Landing a Meta offer wouldn't have been this smooth without it.",
      author: "Alex Rivers",
      role: "Senior Frontend Engineer",
      company: "Meta",
      stars: 5
    },
    {
      quote: "The Monaco workspace adapts questions directly to my resume projects. It felt exactly like a real HackerRank live evaluation session.",
      author: "Samantha Chen",
      role: "Software Dev Partner",
      company: "Stripe",
      stars: 5
    },
    {
      quote: "We use IntervueAI templates to prepare our graduates. The automated analytical dashboard tracks student readiness score metrics perfectly.",
      author: "Marcus Vance",
      role: "Bootcamp Director",
      company: "TechAcad",
      stars: 5
    }
  ]

  const faqs = [
    {
      q: "How does the adaptive AI vocal questioning work?",
      a: "Our backend utilizes the Google Gemini API to analyze your resume text and previous round responses. It dynamically creates custom, conversational follow-up queries, which are spoken to you via browser Text-to-Speech synthesis."
    },
    {
      q: "Can I practice coding problems in other programming languages?",
      a: "Yes. The Monaco editor sandbox is set up to support Python, JavaScript, and other core algorithmic setups, featuring syntax checking and dry-run execution against test cases."
    },
    {
      q: "How does the malpractice monitoring track look-aways?",
      a: "We process your camera stream locally inside the browser using lightweight focus listeners. If you turn away from the screen or switch browser tabs, the system registers warning points and saves them to the interview logs database."
    },
    {
      q: "Is my personal data or resume used for public AI training?",
      a: "No. Your resumes, credentials, and transcripts are stored securely in your private profile workspace and are processed solely to conduct your mock assessment sessions."
    }
  ]

  return (
    <div className="relative min-h-screen bg-[#050816] text-white overflow-x-hidden selection:bg-purple-600/30 selection:text-purple-200">
      
      {/* Background glow meshes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-purple-900/10 via-transparent to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-[800px] -left-40 w-96 h-96 rounded-full bg-indigo-600/5 blur-3xl pointer-events-none" />
      <div className="absolute top-[1800px] -right-40 w-96 h-96 rounded-full bg-purple-600/5 blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-white/5 bg-[#050816]/75 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black text-gradient-purple tracking-tight flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Target className="w-6 h-6 text-purple-500" />
            <span>IntervueAI</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faqs" className="hover:text-white transition-colors">FAQs</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/workspace-select" className="text-sm text-gray-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/workspace-select">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 md:pt-32 md:pb-24 flex flex-col items-center justify-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-purple-400" /> The Future of Career Preparation
          </span>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
            Practice Real-Time <br className="hidden sm:inline" />
            <span className="text-gradient-purple">AI Interview Simulations</span>
          </h1>
          
          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Conduct adaptive, voice-based conversations, compile code in Monaco, map malpractice metrics, and get structured Gemini evaluation roadmaps.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/workspace-select">
              <Button size="lg" className="w-full sm:w-auto" icon={<ArrowRight className="w-5 h-5" />} iconPosition="right">
                Start Mock Assessment
              </Button>
            </Link>
            <Link to="/workspace-select">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto" icon={<Play className="w-4 h-4 fill-gray-200" />}>
                Try Live Simulator
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Hero Interactive Screen Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-20 w-full max-w-5xl rounded-2xl border border-white/5 bg-[#101828]/40 p-3 backdrop-blur-md shadow-2xl relative group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl opacity-10 blur-xl group-hover:opacity-15 transition-opacity" />
          <div className="rounded-xl overflow-hidden border border-white/5 bg-[#050816] aspect-[16/9] flex flex-col relative">
            
            {/* Header frame */}
            <div className="bg-[#101828]/80 px-4 py-3 flex items-center justify-between border-b border-white/5">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/50" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <span className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">IntervueAI Prep Console</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">ACTIVE STREAM</span>
            </div>

            {/* Content frame */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 p-6 gap-6 text-left text-xs text-gray-400 leading-relaxed font-light">
              
              {/* Left visual stream check */}
              <div className="rounded-xl bg-[#101828]/40 border border-white/5 p-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-gray-500 block font-semibold tracking-wider">CAMERA CHECKLIST</span>
                  <div className="aspect-[4/3] rounded-lg bg-gray-950 flex items-center justify-center border border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/10 to-indigo-600/5" />
                    <span className="w-8 h-8 rounded-full border border-dashed border-purple-500/40 animate-pulse flex items-center justify-center text-purple-400">📷</span>
                    <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-green-400 flex items-center gap-1 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" /> Camera Stream Online
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between"><span>Microphone Validation</span><span className="text-green-400 font-bold">98% STABLE</span></div>
                  <div className="h-1 rounded bg-gray-950 overflow-hidden"><div className="h-full w-[90%] bg-purple-500 rounded-full" /></div>
                </div>
              </div>

              {/* Right console check */}
              <div className="rounded-xl bg-[#101828]/40 border border-white/5 p-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-gray-500 block font-semibold tracking-wider">REAL-TIME TRANSCRIPT LOGS</span>
                  <div className="space-y-3 font-mono text-[10px] text-gray-500">
                    <p className="text-gray-300"><span className="text-purple-400 font-bold">AI Interviewer:</span> Can you describe the virtual DOM reconciliation differences in React 19?</p>
                    <p><span className="text-indigo-400 font-bold">User Response:</span> React creates a virtual representation of the DOM tree structure, compares it during state changes using diff processes, and updates...</p>
                    <p className="text-green-400 font-semibold italic">✓ Speech analysis parsed: Correctness score: 85.0</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px]">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Malpractice: 0 infractions
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#050816] border border-white/5 text-purple-400 font-bold">Timer: 18:24</span>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </section>

      {/* Companies Logo Strip */}
      <section className="py-12 border-y border-white/5 bg-[#101828]/20 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-semibold text-gray-500 uppercase tracking-widest mb-8">
            Prep like candidates placed at top product firms
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-8 items-center text-center font-bold text-lg text-gray-600">
            {companies.map((c, i) => (
              <span key={i} className="hover:text-gray-400 transition-colors tracking-tighter">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 md:py-32 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <Badge variant="primary" className="mb-4">Advanced Capabilities</Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Engineered to Mimic Hard Assessments
          </h2>
          <p className="text-gray-400 text-sm font-light leading-relaxed">
            Forget passive video templates. IntervueAI delivers real-time validation layers checking your credentials, sound delivery, technical syntax, and room focus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feat, idx) => (
            <Card key={idx} hoverEffect glow className="flex gap-6 p-8">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                {feat.icon}
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">{feat.badge}</span>
                <h3 className="text-lg font-bold text-white">{feat.title}</h3>
                <p className="text-gray-400 text-sm font-light leading-relaxed">{feat.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-24 md:py-32 border-y border-white/5 bg-[#101828]/10 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <Badge variant="primary" className="mb-4">Operational Roadmap</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              How IntervueAI Simulates The Loop
            </h2>
            <p className="text-gray-400 text-sm font-light">
              Follow these simple checkpoints to take your mock assessment and secure feedback sheets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((st, i) => (
              <Card key={i} className="flex flex-col justify-between p-6 h-64 border border-white/5 relative">
                <span className="text-4xl font-black text-white/5 absolute top-4 right-4">{st.number}</span>
                <div className="space-y-3">
                  <h4 className="text-base font-bold text-white pr-8">{st.title}</h4>
                  <p className="text-gray-400 text-xs font-light leading-relaxed">{st.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                  Phase {i + 1} completed <CheckCircle className="w-3.5 h-3.5 text-purple-500" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Grid */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-24 md:py-32 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <Badge variant="primary" className="mb-4">Flexible Subscriptions</Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Plans For Every Practice Calibration
          </h2>
          <p className="text-gray-400 text-sm font-light">
            Kickstart mock assessments or unlock high-frequency voice rooms to ace your career.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((pl, idx) => (
            <Card 
              key={idx} 
              glow={pl.popular} 
              className={`flex flex-col justify-between p-8 border ${
                pl.popular ? 'border-purple-500/30 bg-[#101828]/80' : 'border-white/5'
              } relative`}
            >
              {pl.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-purple-600 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-purple-600/30">
                  Most Preferred
                </span>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{pl.name}</h3>
                  <p className="text-gray-400 text-xs font-light leading-relaxed">{pl.desc}</p>
                </div>

                <div className="flex items-baseline gap-1.5 border-b border-white/5 pb-6">
                  <span className="text-4xl font-black text-white">{pl.price}</span>
                  <span className="text-gray-500 text-xs font-light">{pl.period}</span>
                </div>

                <ul className="space-y-3.5 text-xs text-gray-400 font-light">
                  {pl.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Link to="/workspace-select" className="w-full">
                  <Button variant={pl.variant} className="w-full">
                    {pl.cta}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 md:py-32 border-y border-white/5 bg-[#101828]/10 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <Badge variant="primary" className="mb-4">Success Testimonials</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Validated By Real Candidate Placements
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((test, i) => (
              <Card key={i} className="p-6 border border-white/5 bg-[#101828]/50 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex gap-1">
                    {[...Array(test.stars)].map((_, sIdx) => (
                      <Star key={sIdx} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm font-light italic leading-relaxed">
                    "{test.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-white/5 mt-6">
                  <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs">
                    {test.author.charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{test.author}</h5>
                    <p className="text-[10px] text-gray-500">{test.role} • {test.company}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section id="faqs" className="max-w-4xl mx-auto px-6 py-24 md:py-32 relative z-10">
        <div className="text-center mb-16">
          <Badge variant="primary" className="mb-4">Common Questions</Badge>
          <h2 className="text-3xl font-extrabold tracking-tight">Frequently Asked Queries</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index
            return (
              <div 
                key={index} 
                className="border border-white/5 bg-[#101828]/35 rounded-xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full px-6 py-5 flex justify-between items-center text-left text-sm font-bold text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-4.5 h-4.5 text-purple-400" />
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-purple-400' : ''}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 pt-2 text-xs text-gray-400 leading-relaxed font-light whitespace-pre-wrap border-t border-white/5">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="max-w-5xl mx-auto px-6 pb-24 relative z-10">
        <div className="relative rounded-2xl overflow-hidden border border-purple-500/20 bg-gradient-to-r from-purple-900/25 to-indigo-900/10 p-12 text-center shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
          <div className="space-y-6 relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Ready to Ace Your Next Assessment?</h2>
            <p className="text-gray-400 text-sm font-light leading-relaxed">
              Create your account, calibrate your target mock interview configurations, validation check your hardware streams, and practice live.
            </p>
            <div className="pt-4">
              <Link to="/workspace-select">
                <Button size="lg" icon={<ArrowUpRight className="w-4.5 h-4.5" />} iconPosition="right">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sleek Footer */}
      <footer className="border-t border-white/5 bg-[#050816] py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
          
          {/* Column 1: Brand details */}
          <div className="space-y-4">
            <Link to="/" className="text-xl font-black text-gradient-purple tracking-tight flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              <span>IntervueAI</span>
            </Link>
            <p className="text-gray-500 text-xs leading-relaxed font-light">
              Premium SaaS environment built to deliver structural adaptive voice assessments, Monaco compilers, and analytical reports.
            </p>
          </div>

          {/* Column 2: Links */}
          <div className="space-y-3">
            <h6 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Simulator Channels</h6>
            <ul className="space-y-2 text-xs text-gray-400 font-light">
              <li><a href="#features" className="hover:text-white transition-colors">Resume Parsers</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Vocal Rooms</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Monaco Compiler</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Gaze Trackers</a></li>
            </ul>
          </div>

          {/* Column 3: Resource library */}
          <div className="space-y-3">
            <h6 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Legal Agreements</h6>
            <ul className="space-y-2 text-xs text-gray-400 font-light">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Use</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Data Privacy Check</a></li>
              <li><a href="#" className="hover:text-white transition-colors">SLA Agreement</a></li>
            </ul>
          </div>

          {/* Column 4: Contact metrics */}
          <div className="space-y-3">
            <h6 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Platform Status</h6>
            <p className="text-xs text-gray-400 font-light flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" /> System operational
            </p>
            <p className="text-[10px] text-gray-600 font-light pt-2">© 2026 IntervueAI. All rights reserved.</p>
          </div>

        </div>
      </footer>

    </div>
  )
}
