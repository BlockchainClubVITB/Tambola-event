import React from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'

const Board = ({ 
  numbers = Array.from({length: 90}, (_, i) => i + 1),
  calledNumbers = [],
  currentNumber = null,
  isGameActive = false,
  onStartGame,
  onPauseGame,
  onResetGame,
  onNumberClick
}) => {
  
  const getNumberStatus = (number) => {
    if (number === currentNumber) return 'current'
    if (calledNumbers.includes(number)) return 'called'
    return 'unmarked'
  }

  const getNumberClass = (number) => {
    const status = getNumberStatus(number)
    const baseClass = 'number-cell'
    
    switch (status) {
      case 'current':
        return `${baseClass} number-cell-called animate-pulse`
      case 'called':
        return `${baseClass} number-cell-marked`
      default:
        return `${baseClass} number-cell-unmarked`
    }
  }

  return (
    <div className="card p-6">
      {/* Board Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold gradient-text">Tambola Board</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={onStartGame}
            disabled={isGameActive}
            className={`btn-primary ${isGameActive ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Play className="w-4 h-4 mr-2" />
            {isGameActive ? 'Game Running' : 'Start Game'}
          </button>
          
          <button
            onClick={onPauseGame}
            disabled={!isGameActive}
            className={`btn-secondary ${!isGameActive ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Pause className="w-4 h-4 mr-2" />
            Pause
          </button>
          
          <button
            onClick={onResetGame}
            className="btn-danger"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </button>
        </div>
      </div>

      {/* Current Number Display */}
      {currentNumber && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full text-3xl font-bold text-white shadow-2xl animate-bounce-slow">
            {currentNumber}
          </div>
          <p className="text-lg font-semibold mt-2">Current Number</p>
        </div>
      )}

      {/* Numbers Grid */}
      <div className="grid grid-cols-10 gap-2">
        {numbers.map((number) => (
          <button
            key={number}
            onClick={() => onNumberClick && onNumberClick(number)}
            className={getNumberClass(number)}
            disabled={calledNumbers.includes(number)}
          >
            {number}
          </button>
        ))}
      </div>

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="bg-slate-800/30 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-400">{calledNumbers.length}</div>
          <div className="text-sm text-slate-300">Called</div>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-400">{90 - calledNumbers.length}</div>
          <div className="text-sm text-slate-300">Remaining</div>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-3">
          <div className="text-2xl font-bold text-purple-400">
            {calledNumbers.length > 0 ? Math.round((calledNumbers.length / 90) * 100) : 0}%
          </div>
          <div className="text-sm text-slate-300">Progress</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(calledNumbers.length / 90) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}

export default Board
