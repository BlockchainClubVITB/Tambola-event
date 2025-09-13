import React from 'react'
import { CheckCircle, Clock, X } from 'lucide-react'

const CompleteBoard = ({ 
  selectedNumbers = [], 
  currentNumber = null, 
  processedQuestions = new Set(),
  correctlyAnsweredNumbers = new Set(),
  playerWins = {}
}) => {
  // Generate all numbers 1-50
  const allNumbers = Array.from({ length: 50 }, (_, i) => i + 1)

  const getNumberStatus = (number) => {
    if (number === currentNumber) return 'current'
    if (correctlyAnsweredNumbers.has(number)) return 'correct'
    if (processedQuestions.has(number)) return 'processed'
    if (selectedNumbers.includes(number)) return 'selected'
    return 'available'
  }

  const getNumberClass = (number) => {
    const status = getNumberStatus(number)
    
    switch (status) {
      case 'current':
        return 'bg-yellow-500 text-black border-yellow-400 shadow-lg animate-pulse'
      case 'correct':
        return 'bg-green-600 text-white border-green-400 shadow-lg'
      case 'processed':
        return 'bg-red-900 text-red-300 border-red-600 blur-sm opacity-75 line-through'
      case 'selected':
        return 'bg-gray-700 text-green-400 border-green-600'
      case 'available':
        return 'bg-gray-800 text-gray-300 border-gray-700'
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700'
    }
  }

  return (
    <div className="card p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          Game Board (1-50)
        </h3>
        <div className="text-xs sm:text-sm text-gray-400">
          Called: {selectedNumbers.length}/50
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm flex-wrap">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded border"></div>
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-600 rounded border"></div>
          <span>Correct</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-700 border border-green-600 rounded"></div>
          <span>Called</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-900 border border-red-600 rounded blur-sm opacity-75"></div>
          <span>Failed</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-800 border border-gray-700 rounded"></div>
          <span>Not Called</span>
        </div>
      </div>

      {/* Board Grid */}
      <div className="grid grid-cols-10 gap-0.5 sm:gap-1 max-w-full sm:max-w-4xl mx-auto overflow-x-auto">
        {allNumbers.map(number => (
          <div
            key={number}
            className={`
              w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center text-xs sm:text-sm font-bold rounded border transition-all duration-300 relative
              ${getNumberClass(number)}
            `}
            title={`Number ${number} - ${getNumberStatus(number)}`}
          >
            {getNumberStatus(number) === 'correct' ? (
              <div className="relative">
                <span className="font-bold">{number}</span>
                <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 text-green-200 absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1" />
              </div>
            ) : processedQuestions.has(number) ? (
              <div className="relative">
                <span className="opacity-50">{number}</span>
                <X className="w-4 h-4 sm:w-6 sm:h-6 text-red-500 absolute inset-0 m-auto" />
              </div>
            ) : (
              number
            )}
          </div>
        ))}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6">
        <div className="bg-gray-800 rounded-lg p-2 sm:p-3 text-center">
          <div className="text-lg sm:text-2xl font-bold text-green-400">{correctlyAnsweredNumbers.size}</div>
          <div className="text-xs text-gray-400">Correct</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-2 sm:p-3 text-center">
          <div className="text-lg sm:text-2xl font-bold text-gray-300">{selectedNumbers.length}</div>
          <div className="text-xs text-gray-400">Called</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-2 sm:p-3 text-center">
          <div className="text-lg sm:text-2xl font-bold text-yellow-400">{currentNumber || '-'}</div>
          <div className="text-xs text-gray-400">Current</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-2 sm:p-3 text-center">
          <div className="text-lg sm:text-2xl font-bold text-purple-400">{Object.values(playerWins).filter(Boolean).length}</div>
          <div className="text-xs text-gray-400">Wins</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 sm:mt-4">
        <div className="flex justify-between text-xs sm:text-sm text-gray-400 mb-1">
          <span>Correct Answers Progress</span>
          <span>{Math.round((correctlyAnsweredNumbers.size / 50) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5 sm:h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 sm:h-2 rounded-full transition-all duration-500"
            style={{ width: `${(correctlyAnsweredNumbers.size / 50) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}

export default CompleteBoard
