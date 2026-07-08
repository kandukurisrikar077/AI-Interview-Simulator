import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Search, Database, HelpCircle, Code, ShieldAlert } from 'lucide-react'
import apiClient from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'

interface Question {
  id: number
  category: string
  difficulty: string
  text: string
  expected_answer: string | null
  interview_type: string | null
}

export const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [interviewType, setInterviewType] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchQuestions()
  }, [category, difficulty, interviewType])

  const fetchQuestions = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (difficulty) params.append('difficulty', difficulty)
      if (interviewType) params.append('interview_type', interviewType)

      const res = await apiClient.get(`/questions/?${params.toString()}`)
      setQuestions(res.data)
    } catch (err: any) {
      setError('Failed to load questions from the bank.')
    } finally {
      setLoading(false)
    }
  }

  const filteredQuestions = questions.filter(q => 
    q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.category && q.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col font-sans py-12 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/5 blur-3xl pointer-events-none" />

      <div className="max-w-6xl w-full mx-auto space-y-6 relative z-10">
        <Link to="/company/dashboard" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Central Question Bank
          </h1>
          <p className="text-xs text-gray-400 mt-1">Browse, filter, and inspect standardized assessment questions loaded in the IntervueAI database.</p>
        </div>

        {/* Filters Panel */}
        <Card className="p-6 border-white/5 bg-[#080d1a]/60 shadow-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Input
                label="Search Question Content"
                placeholder="Search by keywords (e.g. React, SQL, array)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Interview Type</label>
              <select
                value={interviewType}
                onChange={e => setInterviewType(e.target.value)}
                className="w-full bg-[#0d0f22]/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:bg-white/5 transition-all select-none appearance-none cursor-pointer h-10"
              >
                <option value="">All Types</option>
                <option value="technical">Technical</option>
                <option value="hr">HR</option>
                <option value="behavioral">Behavioral</option>
                <option value="system_design">System Design</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                className="w-full bg-[#0d0f22]/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:bg-white/5 transition-all select-none appearance-none cursor-pointer h-10"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </Card>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="py-20 text-center text-gray-500">Querying question bank databases...</div>
        ) : filteredQuestions.length === 0 ? (
          <div className="py-20 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
            No matching questions found. Try refining your filters or search keywords.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredQuestions.map(q => (
              <Card key={q.id} className="p-6 border-white/5 bg-[#080d1a]/40 hover:border-white/10 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] font-black uppercase rounded border border-purple-500/20">
                      {q.category || 'General'}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase rounded border border-blue-500/20">
                      {q.difficulty}
                    </span>
                    {q.interview_type && (
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase rounded border border-indigo-500/20">
                        {q.interview_type}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white leading-relaxed">{q.text}</h3>
                </div>

                {q.expected_answer && (
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                    <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Expected Answer Guide:</span>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-light">{q.expected_answer}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
