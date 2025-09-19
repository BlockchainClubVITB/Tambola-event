import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BookOpen, 
  Target, 
  Users, 
  Trophy, 
  CheckCircle, 
  ArrowLeft,
  GamepadIcon,
  Clock,
  Award,
  Star
} from 'lucide-react'

const GameInstructions = () => {
  const navigate = useNavigate()

  const winningPatterns = [
    { name: 'Any Line', description: 'Complete any row out of 3 ', icon: <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { name: 'Early Five', description: 'first team to complete 5 numbers on ticket', icon: <Target className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { name: 'Full House', description: 'Mark all numbers on ticket correctly', icon: <Trophy className="w-4 h-4 sm:w-5 sm:h-5" /> }
  ]

  const gameRules = [
    'You will receive a digital ticket with 50 numbers (1-50) arranged in 5 rows',
    'When a number is called, a question will appear on your screen',
    'Answer the question correctly to mark that number on your ticket',
    'Complete specific patterns to win different prizes',
    'When you achieve a winning pattern, you will be notified immediately',
    'The host will declare official winners and block conditions for other players',
    'Once a condition is declared won, no other players can win that same pattern',
    'Race against other players to be the first to complete each pattern!'
  ]

  return (
    <div className="min-h-screen p-2 bg-gradient-to-br from-black via-gray-900 to-gray-800 sm:p-4 lg:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 sm:gap-4 sm:mb-6 lg:mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <BookOpen className="w-6 h-6 text-gray-300 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
            <h1 className="text-xl font-bold text-transparent sm:text-2xl lg:text-3xl xl:text-4xl bg-gradient-to-r from-gray-300 to-white bg-clip-text" style={{fontFamily: 'Fira Code, monospace'}}>
              How to Play Tambola
            </h1>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-2">
          {/* Game Overview */}
          <div className="p-4 border shadow-2xl bg-white/10 backdrop-blur-md border-white/20 rounded-xl sm:p-5 lg:p-6">
            <div className="flex items-center gap-2 mb-3 sm:gap-3 sm:mb-4">
              <GamepadIcon className="w-5 h-5 text-gray-300 sm:w-6 sm:h-6" />
              <h2 className="text-lg font-semibold text-white sm:text-xl" style={{fontFamily: 'Fira Code, monospace'}}>Game Overview</h2>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-gray-300 sm:text-base sm:mb-4">
              Tambola is a blockchain-themed numbers game where players answer questions correctly 
              to mark numbers on their tickets and compete to complete winning patterns. The host 
              declares official winners and blocks completed patterns for other players.
            </p>
            <div className="p-3 border rounded-lg bg-gray-800/50 border-gray-600/30 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-300 sm:w-5 sm:h-5" />
                <span className="text-sm font-medium text-gray-300 sm:text-base">Quick Start</span>
              </div>
              <p className="text-xs leading-relaxed text-gray-300 sm:text-sm">
                Get your Game ID from the host, enter your name, and you're ready to compete!
              </p>
            </div>
          </div>

          {/* Game Rules */}
          <div className="p-4 border shadow-2xl bg-white/10 backdrop-blur-md border-white/20 rounded-xl sm:p-5 lg:p-6">
            <div className="flex items-center gap-2 mb-3 sm:gap-3 sm:mb-4">
              <CheckCircle className="w-5 h-5 text-gray-300 sm:w-6 sm:h-6" />
              <h2 className="text-lg font-semibold text-white sm:text-xl" style={{fontFamily: 'Fira Code, monospace'}}>Game Rules</h2>
            </div>
            <ul className="space-y-2 sm:space-y-3">
              {gameRules.map((rule, index) => (
                <li key={index} className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-700/50 text-gray-300 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mt-0.5 flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-xs leading-relaxed text-gray-300 sm:text-sm">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Winning Patterns */}
        <div className="p-4 mt-4 border shadow-2xl bg-white/10 backdrop-blur-md border-white/20 rounded-xl sm:p-5 lg:p-6 sm:mt-6 lg:mt-8">
          <div className="flex items-center gap-2 mb-4 sm:gap-3 sm:mb-6">
            <Trophy className="w-5 h-5 text-gray-300 sm:w-6 sm:h-6" />
            <h2 className="text-lg font-semibold text-white sm:text-xl" style={{fontFamily: 'Fira Code, monospace'}}>Winning Patterns</h2>
          </div>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {winningPatterns.map((pattern, index) => (
              <div key={index} className="p-3 transition-colors border rounded-lg bg-gray-800/50 border-gray-600/30 sm:p-4 hover:border-gray-500/50">
                <div className="flex items-center gap-2 mb-2 sm:gap-3">
                  <div className="text-gray-300">
                    {pattern.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-white sm:text-base">{pattern.name}</h3>
                </div>
                <p className="text-xs leading-relaxed text-gray-400 sm:text-sm">{pattern.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Winner Declaration System */}
        <div className="p-4 mt-4 border shadow-2xl bg-white/10 backdrop-blur-md border-white/20 rounded-xl sm:p-5 lg:p-6 sm:mt-6 lg:mt-8">
          <div className="flex items-center gap-2 mb-4 sm:gap-3 sm:mb-6">
            <Award className="w-5 h-5 text-yellow-400 sm:w-6 sm:h-6" />
            <h2 className="text-lg font-semibold text-white sm:text-xl" style={{fontFamily: 'Fira Code, monospace'}}>Winner Declaration</h2>
          </div>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <div className="p-4 border rounded-lg bg-green-900/30 border-green-600/50">
              <h3 className="flex items-center gap-2 mb-2 font-semibold text-green-400">
                <CheckCircle className="w-4 h-4" />
                When You Win
              </h3>
              <ul className="space-y-1 text-xs text-green-300 sm:text-sm">
                <li>• You'll get an instant notification when you complete a pattern</li>
                <li>• Your achievement is recorded immediately</li>
                <li>• The host will review and declare official winners</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg bg-red-900/30 border-red-600/50">
              <h3 className="flex items-center gap-2 mb-2 font-semibold text-red-400">
                <Target className="w-4 h-4" />
                Pattern Blocking
              </h3>
              <ul className="space-y-1 text-xs text-red-300 sm:text-sm">
                <li>• Once a winner is declared, that pattern is blocked</li>
                <li>• No other players can win the same pattern</li>
                <li>• Focus on completing other available patterns</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Board Layout */}
        <div className="p-4 mt-4 border shadow-2xl bg-white/10 backdrop-blur-md border-white/20 rounded-xl sm:p-5 lg:p-6 sm:mt-6 lg:mt-8">
          <div className="flex items-center gap-2 mb-4 sm:gap-3 sm:mb-6">
            <Target className="w-5 h-5 text-gray-300 sm:w-6 sm:h-6" />
            <h2 className="text-lg font-semibold text-white sm:text-xl" style={{fontFamily: 'Fira Code, monospace'}}>Board Layout</h2>
          </div>
          <div className="max-w-2xl p-3 mx-auto rounded-lg bg-slate-800/50 sm:p-4 lg:p-6">
            <div className="mb-3 text-center sm:mb-4">
              <span className="text-xs sm:text-sm text-slate-400">Your ticket contains 50 numbers arranged in 5 rows</span>
            </div>
            <div className="grid grid-cols-5 gap-1 mb-3 sm:gap-2 sm:mb-4">
              {['Row 1: 1-10', 'Row 2: 11-20', 'Row 3: 21-30', 'Row 4: 31-40', 'Row 5: 41-50'].map((row, index) => (
                <div key={index} className="p-1 text-xs text-center text-white border rounded sm:p-2 sm:text-sm bg-slate-700 border-slate-500">
                  {row}
                </div>
              ))}
            </div>
            <div className="text-xs text-center sm:text-sm text-slate-400">
              Answer questions correctly to mark numbers as they're called. Achieve winning patterns to be declared a winner!
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="p-4 mt-4 border shadow-2xl bg-white/10 backdrop-blur-md border-white/20 rounded-xl sm:p-5 lg:p-6 sm:mt-6 lg:mt-8">
          <div className="flex items-center gap-2 mb-3 sm:gap-3 sm:mb-4">
            <Award className="w-5 h-5 text-gray-300 sm:w-6 sm:h-6" />
            <h2 className="text-lg font-semibold text-white sm:text-xl" style={{fontFamily: 'Fira Code, monospace'}}>Pro Tips</h2>
          </div>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="text-xs leading-relaxed text-gray-300 sm:text-sm">Stay alert and listen carefully for number calls</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="text-xs leading-relaxed text-gray-300 sm:text-sm">Answer questions quickly and accurately</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="text-xs leading-relaxed text-gray-300 sm:text-sm">Complete patterns fast - host declares winners!</span>
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="text-xs leading-relaxed text-gray-300 sm:text-sm">Watch for win notifications when you achieve patterns</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="text-xs leading-relaxed text-gray-300 sm:text-sm">Once a pattern is declared won, it's blocked for others</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="text-xs leading-relaxed text-gray-300 sm:text-sm">Have fun and enjoy the blockchain theme!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Join */}
        <div className="pb-4 mt-6 text-center sm:mt-8 sm:pb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 mx-auto text-sm font-semibold text-white transition-all duration-300 transform rounded-lg shadow-lg bg-gradient-to-r from-gray-700 to-black hover:from-gray-600 hover:to-gray-800 sm:py-3 sm:px-6 hover:shadow-xl hover:scale-105 sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            Back to Join Game
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameInstructions