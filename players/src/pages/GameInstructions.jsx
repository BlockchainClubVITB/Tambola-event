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
    { name: 'Early Five', description: 'First to mark any 5 numbers on your ticket', icon: <Star className="w-5 h-5" /> },
    { name: 'Top Line', description: 'Complete all numbers in the top row', icon: <CheckCircle className="w-5 h-5" /> },
    { name: 'Middle Line', description: 'Complete all numbers in the middle row', icon: <CheckCircle className="w-5 h-5" /> },
    { name: 'Bottom Line', description: 'Complete all numbers in the bottom row', icon: <CheckCircle className="w-5 h-5" /> },
    { name: 'Four Corners', description: 'Mark the four corner numbers of your ticket', icon: <Target className="w-5 h-5" /> },
    { name: 'Full House', description: 'Complete all numbers on your entire ticket', icon: <Trophy className="w-5 h-5" /> }
  ]

  const gameRules = [
    'Each player gets a unique Tambola ticket with 15 numbers',
    'Numbers are called out randomly by the host',
    'Mark the called numbers on your ticket if you have them',
    'Claim prizes when you complete winning patterns',
    'Multiple players can win the same pattern',
    'Be quick to claim - first to claim gets verified first!'
  ]

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-400" />
          </button>
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold gradient-text">How to Play Tambola</h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Game Overview */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <GamepadIcon className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold">Game Overview</h2>
            </div>
            <p className="text-slate-300 mb-4">
              Tambola, also known as Housie or Bingo, is a fun numbers game where players mark 
              called numbers on their tickets to complete winning patterns and claim prizes.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-blue-400">Quick Start</span>
              </div>
              <p className="text-sm text-slate-300">
                Get your Game ID from the host, enter your name, and you're ready to play!
              </p>
            </div>
          </div>

          {/* Game Rules */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-semibold">Game Rules</h2>
            </div>
            <ul className="space-y-3">
              {gameRules.map((rule, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                    {index + 1}
                  </div>
                  <span className="text-slate-300 text-sm">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Winning Patterns */}
        <div className="card p-6 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-semibold">Winning Patterns</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {winningPatterns.map((pattern, index) => (
              <div key={index} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 hover:border-slate-600/50 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-yellow-400">
                    {pattern.icon}
                  </div>
                  <h3 className="font-semibold text-white">{pattern.name}</h3>
                </div>
                <p className="text-sm text-slate-400">{pattern.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket Example */}
        <div className="card p-6 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-semibold">Sample Ticket</h2>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-6 max-w-md mx-auto">
            <div className="text-center mb-4">
              <span className="text-sm text-slate-400">Ticket #12345</span>
            </div>
            <div className="grid grid-cols-9 gap-1">
              {/* Sample ticket layout */}
              {[
                [9, '', 23, '', 45, '', 67, '', 89],
                ['', 12, '', 34, '', 56, '', 78, ''],
                [5, '', 28, '', 41, '', 63, '', 85]
              ].map((row, rowIndex) => 
                row.map((num, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`ticket-number ${num ? 'ticket-number-unmarked' : 'ticket-number-empty'}`}
                  >
                    {num}
                  </div>
                ))
              )}
            </div>
            <div className="text-center mt-4 text-sm text-slate-400">
              Mark numbers as they're called out
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="card p-6 mt-8">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-6 h-6 text-orange-400" />
            <h2 className="text-xl font-semibold">Pro Tips</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
                <span className="text-slate-300 text-sm">Stay alert and listen carefully to number calls</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
                <span className="text-slate-300 text-sm">Double-check your ticket before claiming a win</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
                <span className="text-slate-300 text-sm">Be quick to claim - timing matters!</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
                <span className="text-slate-300 text-sm">Keep track of multiple winning patterns</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
                <span className="text-slate-300 text-sm">Have fun and enjoy the game!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Join */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Join Game
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameInstructions
