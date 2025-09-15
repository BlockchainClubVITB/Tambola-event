import React from 'react'

const PlayerTicket = ({ 
  ticket, 
  calledNumbers, 
  markedNumbers, 
  correctlyAnsweredNumbers = new Set(), // Numbers answered correctly in questions
  onNumberMark, 
  onClaimWin 
}) => {
  
  const isNumberCalled = (number) => calledNumbers.includes(number)
  const isNumberMarked = (number) => markedNumbers.has(number)
  const isNumberCorrectlyAnswered = (number) => correctlyAnsweredNumbers.has(number)
  
  const getNumberClass = (number) => {
    if (!number) return 'ticket-number-empty'
    if (isNumberCorrectlyAnswered(number)) return 'ticket-number-correct'
    if (isNumberMarked(number)) return 'ticket-number-marked'
    if (isNumberCalled(number)) return 'ticket-number-called'
    return 'ticket-number-unmarked'
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

  if (!ticket) {
    return (
      <div className="card p-3 sm:p-6 text-center">
        <div className="text-slate-400 text-sm sm:text-base">Loading your ticket...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Ticket Display */}
      <div className="card p-3 sm:p-6">
        <div className="text-center mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold">Your Ticket</h3>
          <div className="text-xs sm:text-sm text-slate-400">
            Marked: {getMarkedCount()}/15 numbers
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-2 sm:p-4 max-w-xs sm:max-w-md mx-auto">
          <div className="grid grid-cols-5 gap-0.5 sm:gap-1">
            {ticket.map((row, rowIndex) => 
              row.map((number, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={`ticket-number ${getNumberClass(number)} ${
                    number && isNumberCalled(number) ? 'hover:scale-110 cursor-pointer' : 
                    number ? 'cursor-not-allowed opacity-50' : ''
                  } h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm font-medium rounded transition-all`}
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

        <div className="text-center mt-3 sm:mt-4 text-xs text-slate-500">
          Click on called numbers to mark them
        </div>
      </div>
    </div>
  )
}

export default PlayerTicket
