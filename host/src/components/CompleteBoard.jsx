import React from 'react'
import { CheckCircle, Clock, X } from 'lucide-react'

const CompleteBoard = ({ selectedNumbers = [], currentNumber = null, onNumberClick = null }) => {
  // Generate all numbers 1-50
  const allNumbers = Array.from({ length: 50 }, (_, i) => i + 1)

  const getNumberStatus = (number) => {
    if (number === currentNumber) return 'current'
    if (selectedNumbers.includes(number)) return 'selected'
    return 'available'
  }

  const getNumberClass = (number) => {
    const status = getNumberStatus(number)
    const baseClass = `w-12 h-12 rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all duration-200 relative ${onNumberClick ? 'cursor-pointer' : 'cursor-default'}`
    
    switch (status) {
      case 'current':
        return `${baseClass} bg-yellow-500 text-black border-yellow-400 shadow-lg animate-pulse`
      case 'selected':
        return `${baseClass} bg-gray-900 text-gray-600 border-gray-800 blur-sm opacity-50 cursor-not-allowed`
      case 'available':
        return `${baseClass} bg-gray-800 text-gray-300 border-gray-700 ${onNumberClick ? 'hover:bg-blue-700 hover:border-blue-400 hover:scale-105 hover:shadow-lg hover:text-white' : ''}`
      default:
        return `${baseClass} bg-gray-800 text-gray-300 border-gray-700`
    }
  }

  const handleNumberClick = (number) => {
    if (onNumberClick && getNumberStatus(number) === 'available') {
      onNumberClick(number)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          Complete Tambola Board (1-50)
        </h3>
        <div className="text-sm text-gray-400">
          Selected: {selectedNumbers.length}/50
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded border"></div>
          <span>Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-700 border border-green-600 rounded"></div>
          <span>Called</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-800 border border-gray-700 rounded"></div>
          <span>Available</span>
        </div>
      </div>

      {/* Board Grid */}
      <div className="grid grid-cols-10 gap-1 max-w-4xl mx-auto">
        {allNumbers.map(number => (
          <div
            key={number}
            className={getNumberClass(number)}
            title={`Number ${number} - ${getNumberStatus(number)}`}
            onClick={() => handleNumberClick(number)}
          >
            <span className={getNumberStatus(number) === 'selected' ? 'opacity-30' : ''}>
              {number}
            </span>
            {getNumberStatus(number) === 'selected' && (
              <X className="w-6 h-6 text-red-500 absolute inset-0 m-auto" strokeWidth={3} />
            )}
          </div>
        ))}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{selectedNumbers.length}</div>
          <div className="text-xs text-gray-400">Called</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{currentNumber || '-'}</div>
          <div className="text-xs text-gray-400">Current</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{50 - selectedNumbers.length}</div>
          <div className="text-xs text-gray-400">Remaining</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Game Progress</span>
          <span>{Math.round((selectedNumbers.length / 50) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(selectedNumbers.length / 50) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}

export default CompleteBoard
