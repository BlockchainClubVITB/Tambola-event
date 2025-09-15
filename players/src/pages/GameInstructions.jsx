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
    { name: 'Early Adopter', description: 'First 5 numbers marked correctly', icon: <Star className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { name: 'Gas Saver', description: 'Complete the first row (1-10)', icon: <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { name: 'Corner Nodes', description: 'Mark all 4 corner numbers (1, 10, 41, 50)', icon: <Target className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { name: 'Miner of the Day', description: 'Complete any 2 full rows', icon: <Award className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { name: 'Full Blockchain', description: 'Mark all 50 numbers correctly (Full House)', icon: <Trophy className="w-4 h-4 sm:w-5 sm:h-5" /> }
  ]

  const gameRules = [
    'You will receive a digital ticket with 50 numbers (1-50) arranged in 5 rows',
    'When a number is called, a question will appear on your screen',
    'Answer the question correctly to mark that number on your ticket',
    'Complete specific patterns to win different prizes',
    'Only the FIRST player to complete each winning condition wins that prize',
    'Race against other players to be the first to complete each pattern!'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gray-300" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-gray-300 to-white bg-clip-text text-transparent" style={{fontFamily: 'Fira Code, monospace'}}>
              How to Play Tambola
            </h1>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-2">
          {/* Game Overview */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <GamepadIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
              <h2 className="text-lg sm:text-xl font-semibold text-white" style={{fontFamily: 'Fira Code, monospace'}}>Game Overview</h2>
            </div>
            <p className="text-gray-300 text-sm sm:text-base mb-3 sm:mb-4 leading-relaxed">
              Tambola is a blockchain-themed numbers game where players answer questions correctly 
              to mark numbers on their tickets and compete to complete winning patterns first.
            </p>
            <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
                <span className="font-medium text-gray-300 text-sm sm:text-base">Quick Start</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Get your Game ID from the host, enter your name, and you're ready to compete!
              </p>
            </div>
          </div>

          {/* Game Rules */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
              <h2 className="text-lg sm:text-xl font-semibold text-white" style={{fontFamily: 'Fira Code, monospace'}}>Game Rules</h2>
            </div>
            <ul className="space-y-2 sm:space-y-3">
              {gameRules.map((rule, index) => (
                <li key={index} className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-700/50 text-gray-300 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mt-0.5 flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-gray-300 text-xs sm:text-sm leading-relaxed">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Winning Patterns */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-4 sm:p-5 lg:p-6 mt-4 sm:mt-6 lg:mt-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
            <h2 className="text-lg sm:text-xl font-semibold text-white" style={{fontFamily: 'Fira Code, monospace'}}>Winning Patterns</h2>
          </div>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {winningPatterns.map((pattern, index) => (
              <div key={index} className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-3 sm:p-4 hover:border-gray-500/50 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="text-gray-300">
                    {pattern.icon}
                  </div>
                  <h3 className="font-semibold text-white text-sm sm:text-base">{pattern.name}</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{pattern.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Board Layout */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-4 sm:p-5 lg:p-6 mt-4 sm:mt-6 lg:mt-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
            <h2 className="text-lg sm:text-xl font-semibold text-white" style={{fontFamily: 'Fira Code, monospace'}}>Board Layout</h2>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4 lg:p-6 max-w-2xl mx-auto">
            <div className="text-center mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm text-slate-400">Your ticket contains 50 numbers arranged in 5 rows</span>
            </div>
            <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-3 sm:mb-4">
              {['Row 1: 1-10', 'Row 2: 11-20', 'Row 3: 21-30', 'Row 4: 31-40', 'Row 5: 41-50'].map((row, index) => (
                <div key={index} className="p-1 sm:p-2 text-xs sm:text-sm border rounded bg-slate-700 border-slate-500 text-center text-white">
                  {row}
                </div>
              ))}
            </div>
            <div className="text-center text-xs sm:text-sm text-slate-400">
              Answer questions correctly to mark numbers as they're called
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-4 sm:p-5 lg:p-6 mt-4 sm:mt-6 lg:mt-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
            <h2 className="text-lg sm:text-xl font-semibold text-white" style={{fontFamily: 'Fira Code, monospace'}}>Pro Tips</h2>
          </div>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="text-gray-300 text-xs sm:text-sm leading-relaxed">Stay alert and listen carefully for number calls</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="text-gray-300 text-xs sm:text-sm leading-relaxed">Answer questions quickly and accurately</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="text-gray-300 text-xs sm:text-sm leading-relaxed">Be first to complete patterns - timing matters!</span>
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="text-gray-300 text-xs sm:text-sm leading-relaxed">Keep track of multiple winning patterns</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="text-gray-300 text-xs sm:text-sm leading-relaxed">Use the Rules button during gameplay for reference</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="text-gray-300 text-xs sm:text-sm leading-relaxed">Have fun and enjoy the blockchain theme!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Join */}
        <div className="text-center mt-6 sm:mt-8 pb-4 sm:pb-6">
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-gray-700 to-black hover:from-gray-600 hover:to-gray-800 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 mx-auto text-sm sm:text-base"
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
