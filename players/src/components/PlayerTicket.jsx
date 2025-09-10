import React from 'react'
import { CheckCircle, Trophy, Target, Star } from 'lucide-react'

const PlayerTicket = ({ 
  ticket, 
  calledNumbers, 
  markedNumbers, 
  onNumberMark, 
  onClaimWin 
}) => {
  
  const isNumberCalled = (number) => calledNumbers.includes(number)
  const isNumberMarked = (number) => markedNumbers.has(number)
  
  const getNumberClass = (number) => {
    if (!number) return 'ticket-number-empty'
    if (isNumberMarked(number)) return 'ticket-number-marked'
    if (isNumberCalled(number)) return 'ticket-number-called'
    return 'ticket-number-unmarked'
  }

  const checkWinningPattern = (pattern) => {
    if (!ticket) return false

    switch (pattern) {
      case 'Early Five':
        return getMarkedCount() >= 5

      case 'Top Line':
        return ticket[0].every(num => !num || isNumberMarked(num))

      case 'Middle Line':
        return ticket[1].every(num => !num || isNumberMarked(num))

      case 'Bottom Line':
        return ticket[2].every(num => !num || isNumberMarked(num))

      case 'Four Corners':
        const corners = [
          ticket[0].find(num => num), // First number in top row
          ticket[0].slice().reverse().find(num => num), // Last number in top row
          ticket[2].find(num => num), // First number in bottom row
          ticket[2].slice().reverse().find(num => num) // Last number in bottom row
        ]
        return corners.every(num => num && isNumberMarked(num))

      case 'Full House':
        return ticket.every(row => 
          row.every(num => !num || isNumberMarked(num))
        )

      default:
        return false
    }
  }

  const getMarkedCount = () => {
    if (!ticket) return 0
    let count = 0
    ticket.forEach(row => {
      row.forEach(num => {
        if (num && isNumberMarked(num)) count++
      })
    })
    return count
  }

  const winningPatterns = [
    { name: 'Early Five', icon: <Star className="w-4 h-4" />, description: 'Mark any 5 numbers' },
    { name: 'Top Line', icon: <CheckCircle className="w-4 h-4" />, description: 'Complete top row' },
    { name: 'Middle Line', icon: <CheckCircle className="w-4 h-4" />, description: 'Complete middle row' },
    { name: 'Bottom Line', icon: <CheckCircle className="w-4 h-4" />, description: 'Complete bottom row' },
    { name: 'Four Corners', icon: <Target className="w-4 h-4" />, description: 'Mark all 4 corners' },
    { name: 'Full House', icon: <Trophy className="w-4 h-4" />, description: 'Complete entire ticket' }
  ]

  if (!ticket) {
    return (
      <div className="card p-6 text-center">
        <div className="text-slate-400">Loading your ticket...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Ticket Display */}
      <div className="card p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold">Your Ticket</h3>
          <div className="text-sm text-slate-400">
            Marked: {getMarkedCount()}/15 numbers
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-4 max-w-md mx-auto">
          <div className="grid grid-cols-5 gap-1">
            {ticket.map((row, rowIndex) => 
              row.map((number, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={`ticket-number ${getNumberClass(number)} ${
                    number && isNumberCalled(number) ? 'hover:scale-110 cursor-pointer' : 
                    number ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                  onClick={() => number && isNumberCalled(number) && onNumberMark(number)}
                  disabled={!number || !isNumberCalled(number)}
                  title={
                    !number ? '' :
                    !isNumberCalled(number) ? 'Not called yet' :
                    isNumberMarked(number) ? 'Click to unmark' : 'Click to mark'
                  }
                >
                  {number || ''}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="text-center mt-4 text-xs text-slate-500">
          Click on called numbers to mark them
        </div>
      </div>

      {/* Winning Patterns */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Winning Patterns</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {winningPatterns.map((pattern) => {
            const isComplete = checkWinningPattern(pattern.name)
            return (
              <div
                key={pattern.name}
                className={`p-3 rounded-lg border transition-all ${
                  isComplete 
                    ? 'bg-green-500/20 border-green-500/50' 
                    : 'bg-slate-800/30 border-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={isComplete ? 'text-green-400' : 'text-slate-400'}>
                      {pattern.icon}
                    </div>
                    <span className={`font-medium text-sm ${
                      isComplete ? 'text-green-400' : 'text-white'
                    }`}>
                      {pattern.name}
                    </span>
                  </div>
                  {isComplete && (
                    <button
                      onClick={() => onClaimWin(pattern.name)}
                      className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded transition-colors"
                    >
                      Claim
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  {pattern.description}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PlayerTicket
