import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Timer, Award, CheckCircle2, XCircle, Play, 
  HelpCircle, AlertCircle, Loader2, BarChart2, Calendar
} from 'lucide-react'
import apiClient from '../services/api'
import { useToast } from '../context/ToastContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Sidebar } from '../components/layout/Sidebar'

interface Question {
  q: string
  options: string[]
  answer: number // Index of correct option
}

interface LeaderboardItem {
  rank: number
  name: string
  score: number
  correct: string
}

export const Aptitude: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast()

  const [activeTab, setActiveTab] = useState<'practice' | 'leaderboard'>('practice')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  // MCQ state
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [timerInterval, setTimerInterval] = useState<any>(null)

  // Leaderboard lists
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)

  // MCQ Mock banks based on category
  const questionBanks: Record<string, Question[]> = {
    quantitative: [
      { q: "A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train in meters?", options: ["120 meters", "150 meters", "180 meters", "324 meters"], answer: 1 },
      { q: "If a log base 10 of x is equal to 3, what is the value of x?", options: ["30", "100", "1000", "10000"], answer: 2 },
      { q: "Find the odd one out of these series numbers: 3, 5, 11, 14, 17, 21", options: ["14", "17", "21", "11"], answer: 0 }
    ],
    logical: [
      { q: "If A + B means A is the brother of B; A - B means A is the sister of B; then what does P + Q - R mean?", options: ["P is brother of R", "P is sister of R", "P is uncle of R", "P is father of R"], answer: 0 },
      { q: "Look at this series: 7, 10, 8, 11, 9, 12, ... What number should come next?", options: ["7", "10", "12", "13"], answer: 1 }
    ],
    verbal: [
      { q: "Choose the word which is most opposite in meaning to 'OBSTINATE':", options: ["Stubborn", "Flexible", "Rigid", "Dogmatic"], answer: 1 },
      { q: "Select the correctly punctuated sentence option:", options: ["Although it was hot, we played soccer.", "Although, it was hot we played soccer.", "Although it was hot we played, soccer.", "Although it was hot; we played soccer."], answer: 0 }
    ],
    data_interpretation: [
      { q: "If the total revenue of a company is $5M and marketing expenses represent 15% of cost, what is the marketing cost?", options: ["$500k", "$750k", "$150k", "$350k"], answer: 1 }
    ]
  }

  // Timer tick
  useEffect(() => {
    if (quizStarted && timeLeft > 0 && !quizFinished) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            finishQuiz(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      setTimerInterval(interval)
      return () => clearInterval(interval)
    }
  }, [quizStarted, quizFinished])

  // Fetch leaderboard on tab switch
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboardList()
    }
  }, [activeTab])

  const fetchLeaderboardList = async () => {
    setLeaderboardLoading(true)
    try {
      const res = await apiClient.post('/placement/aptitude', {
        score: 0,
        category: selectedCategory || 'quantitative',
        duration_seconds: 600,
        total_questions: 10,
        correct_answers: 0
      })
      setLeaderboard(res.data.leaderboard || [])
    } catch {
      toastError('Failed to fetch leaderboard rankings.')
    } finally {
      setLeaderboardLoading(false)
    }
  }

  const startQuiz = (category: string) => {
    setSelectedCategory(category)
    setQuizQuestions(questionBanks[category] || [])
    setCurrentIdx(0)
    setSelectedAnswers({})
    setTimeLeft(600)
    setQuizStarted(true)
    setQuizFinished(false)
  }

  const finishQuiz = async (timeout = false) => {
    if (timerInterval) clearInterval(timerInterval)
    setQuizFinished(true)

    // Calculate score
    let correct = 0
    quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) {
        correct++
      }
    })
    const score = Math.round((correct / quizQuestions.length) * 100)

    try {
      const res = await apiClient.post('/placement/aptitude', {
        score,
        category: selectedCategory!,
        duration_seconds: 600 - timeLeft,
        total_questions: quizQuestions.length,
        correct_answers: correct
      })
      setLeaderboard(res.data.leaderboard || [])
      toastSuccess(`Aptitude test completed! Score: ${score}%`)
    } catch {
      toastError('Failed to save score details.')
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white flex">
      <Sidebar />

      <main className="flex-1 min-w-0 flex flex-col font-sans">
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full space-y-6">
          {/* Header */}
          <header className="flex justify-between items-center pb-4 border-b border-white/5">
            <div className="space-y-1">
              <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
              </Link>
              <h1 className="text-2xl font-extrabold tracking-tight">Placement Aptitude Platform</h1>
            </div>
          </header>

          {/* Mode Switch Tabs */}
          <div className="flex bg-gray-950/80 border border-white/5 p-0.5 rounded-xl text-xs max-w-xs">
            <button
              onClick={() => setActiveTab('practice')}
              className={`flex-1 py-2.5 rounded-lg font-bold text-center cursor-pointer transition-all ${
                activeTab === 'practice' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Practice Arena
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex-1 py-2.5 rounded-lg font-bold text-center cursor-pointer transition-all ${
                activeTab === 'leaderboard' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Leaderboard
            </button>
          </div>

          {activeTab === 'practice' ? (
            <div className="space-y-6">
              {!quizStarted ? (
                /* Category Selector Cards */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { key: 'quantitative', title: 'Quantitative Aptitude', desc: 'Permutations, probability, equations, ratios, and averages.', color: 'text-purple-400', border: 'hover:border-purple-500/30' },
                    { key: 'logical', title: 'Logical Reasoning', desc: 'Number series, visual puzzles, analogies, and code relationships.', color: 'text-blue-400', border: 'hover:border-blue-500/30' },
                    { key: 'verbal', title: 'Verbal Ability', desc: 'Antonyms, grammar correctives, prepositions, and reading comprehension.', color: 'text-pink-400', border: 'hover:border-pink-500/30' },
                    { key: 'data_interpretation', title: 'Data Interpretation', desc: 'Bar graphs, pie charts, analytics tables, and percentage ratios.', color: 'text-green-400', border: 'hover:border-green-500/30' }
                  ].map(cat => (
                    <Card
                      key={cat.key}
                      className={`p-6 border-white/5 bg-[#0d1226]/40 cursor-pointer transition-all flex flex-col justify-between h-40 ${cat.border}`}
                      onClick={() => startQuiz(cat.key)}
                    >
                      <div className="space-y-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${cat.color}`}>{cat.title}</span>
                        <p className="text-xs text-gray-400 leading-relaxed font-light">{cat.desc}</p>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/5 pt-3">
                        <span className="text-[10px] text-gray-500">10 mins • Multi-choice</span>
                        <button className="text-[10px] font-bold text-purple-400 flex items-center gap-1">
                          Start timed test <Play className="w-3 h-3" />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                /* active quiz panel */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  {/* Left: Quiz Canvas */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6 border-white/5 bg-[#0d1226]/40 space-y-6">
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <span className="text-xs font-bold text-gray-400">
                          Question {currentIdx + 1} of {quizQuestions.length}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-purple-400 font-bold bg-purple-500/10 px-3 py-1 rounded-xl">
                          <Timer className="w-4 h-4" />
                          <span>{formatTime(timeLeft)}</span>
                        </div>
                      </div>

                      {quizQuestions.length > 0 && (
                        <div className="space-y-6">
                          <h3 className="text-sm font-semibold text-white leading-relaxed">
                            {quizQuestions[currentIdx].q}
                          </h3>

                          <div className="space-y-3">
                            {quizQuestions[currentIdx].options.map((opt, oIdx) => {
                              const isSelected = selectedAnswers[currentIdx] === oIdx
                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => setSelectedAnswers({ ...selectedAnswers, [currentIdx]: oIdx })}
                                  disabled={quizFinished}
                                  className={`w-full text-left p-4 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                                    isSelected
                                      ? 'border-purple-500 bg-purple-650/10 text-white'
                                      : 'border-white/5 bg-black/20 text-gray-300 hover:border-white/10'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                    isSelected ? 'bg-purple-600 border-purple-400' : 'border-white/10'
                                  }`} />
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Navigation buttons */}
                      <div className="border-t border-white/5 pt-5 flex justify-between gap-3">
                        <button
                          onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                          disabled={currentIdx === 0}
                          className="px-4 py-2 border border-white/10 text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
                        >
                          Previous
                        </button>
                        {currentIdx < quizQuestions.length - 1 ? (
                          <button
                            onClick={() => setCurrentIdx(prev => prev + 1)}
                            className="px-4 py-2 bg-purple-650 hover:bg-purple-600 text-xs font-bold rounded-xl cursor-pointer"
                          >
                            Next Question
                          </button>
                        ) : (
                          <button
                            onClick={() => finishQuiz(false)}
                            disabled={quizFinished}
                            className="px-5 py-2 bg-green-600 hover:bg-green-500 text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
                          >
                            Finish Assessment
                          </button>
                        )}
                      </div>
                    </Card>

                    {quizFinished && (
                      <Card className="p-6 border-white/5 bg-green-500/5 text-xs space-y-4">
                        <div className="flex items-center gap-2 text-green-400 font-bold">
                          <CheckCircle2 className="w-5 h-5" /> Completed Assessment Review
                        </div>
                        <p className="text-gray-400 font-light leading-relaxed">
                          Your correct responses are audited in real time. Select another category on the right or review the questions pipeline.
                        </p>
                        <Button size="sm" onClick={() => setQuizStarted(false)}>Configure New Quiz</Button>
                      </Card>
                    )}
                  </div>

                  {/* Right: Question Navigation Board */}
                  <Card className="p-6 border-white/5 bg-[#0d1226]/40 space-y-5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">
                      Navigation Grid
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {quizQuestions.map((_, idx) => {
                        const isAnswered = selectedAnswers[idx] !== undefined
                        const isCurrent = currentIdx === idx
                        return (
                          <button
                            key={idx}
                            onClick={() => setCurrentIdx(idx)}
                            className={`w-10 h-10 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-purple-600 border-purple-500 text-white'
                                : isAnswered
                                ? 'bg-purple-900/40 border-purple-500/20 text-purple-300'
                                : 'bg-gray-950 border-white/5 text-gray-500'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        )
                      })}
                    </div>
                    <div className="border-t border-white/5 pt-4">
                      <button
                        onClick={() => { setQuizStarted(false); setQuizFinished(false) }}
                        className="w-full py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-bold transition-all cursor-pointer"
                      >
                        Exit timed test
                      </button>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            /* --- Leaderboard Tab --- */
            <Card className="p-6 border-white/5 bg-[#0d1226]/40 space-y-5">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Aptitude Leaderboard Rankings</h3>
                <p className="text-[10px] text-gray-500 mt-1">Review the top accuracy rates scored by active placement candidates.</p>
              </div>

              {leaderboardLoading ? (
                <div className="flex items-center justify-center min-h-[150px]">
                  <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.01] uppercase font-bold text-[10px] text-gray-400 tracking-wider">
                        <th className="py-3 px-4 text-center w-16">Rank</th>
                        <th className="py-3 px-4">Candidate Partner</th>
                        <th className="py-3 px-4 text-center">Score Index</th>
                        <th className="py-3 px-4 text-center">Accuracy Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans">
                      {leaderboard.map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-3.5 px-4 text-center font-extrabold text-purple-400">
                            #{item.rank}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-white">
                            {item.name}
                          </td>
                          <td className="py-3.5 px-4 text-center text-green-400 font-bold">
                            {item.score}%
                          </td>
                          <td className="py-3.5 px-4 text-center text-gray-500">
                            {item.correct} correct
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 text-xs italic">
                  No submissions logged yet. Finish a test to appear on the leaderboards.
                </div>
              )}
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
