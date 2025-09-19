import React from 'react';
import { CheckCircle } from 'lucide-react';

const PlayerTicket = ({ 
  ticket, 
  calledNumbers, 
  markedNumbers, 
  correctlyAnsweredNumbers = new Set(),
  incorrectlyAnsweredNumbers = new Set(),
  onNumberMark, 
  onClaimWin 
}) => {
  
  const isNumberCalled = (number) => calledNumbers.includes(number);
  const isNumberMarked = (number) => markedNumbers.has(number);
  const isNumberCorrectlyAnswered = (number) => correctlyAnsweredNumbers.has(number);
  const isNumberIncorrectlyAnswered = (number) => incorrectlyAnsweredNumbers.has(number);
  
  const getNumberClass = (number) => {
    if (!number) return 'bg-slate-900/50 border-transparent'; // Empty slot in the ticket

    // Priority: Incorrect (red) > Correct (green) > Called (blue) > Default
    if (isNumberIncorrectlyAnswered(number)) {
      return 'bg-red-600 text-white border-red-400 shadow-lg';
    }
    if (isNumberCorrectlyAnswered(number)) {
      return 'bg-green-600 text-white border-green-400 shadow-lg';
    }
    if (isNumberMarked(number)) {
      return 'bg-blue-600 text-white border-blue-500 shadow-md';
    }
    if (isNumberCalled(number)) {
      return 'bg-slate-700 text-white border-slate-500 animate-pulse';
    }
    // Default for numbers on the ticket not yet called
    return 'bg-slate-800 text-slate-400 border-slate-700';
  };

  const getMarkedCount = () => {
    if (!ticket) return 0;
    let count = 0;
    ticket.forEach(row => {
      row.forEach(num => {
        if (num && isNumberMarked(num)) count++;
      });
    });
    return count;
  };

  if (!ticket) {
    return (
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center">
        <div className="text-slate-400">Loading your ticket...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 text-white p-4 sm:p-6 rounded-xl border border-slate-700">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Your Ticket</h3>
        <p className="text-sm text-slate-400 mt-1">
          Marked: {getMarkedCount()}/15 numbers
        </p>
      </div>
      
      <div className="bg-slate-900/50 rounded-lg p-2 sm:p-4 w-full md:w-1/3 mx-auto">
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {ticket.flat().map((number, index) => (
            <button
              key={index}
              className={`aspect-square flex items-center justify-center text-sm sm:text-base font-bold rounded-lg border transition-all duration-300 relative
                ${getNumberClass(number)}
                ${ number && isNumberCalled(number) ? 'cursor-pointer hover:opacity-80' : ''}
                ${ !number || !isNumberCalled(number) ? 'cursor-not-allowed opacity-60' : ''}
              `}
              onClick={() => number && isNumberCalled(number) && onNumberMark(number)}
              disabled={!number || !isNumberCalled(number)}
              title={
                !number ? 'Empty' :
                !isNumberCalled(number) ? 'Not called yet' :
                isNumberMarked(number) ? 'Click to unmark' : 'Click to mark'
              }
            >
              {isNumberCorrectlyAnswered(number) ? (
                  <CheckCircle className="w-4 h-4 text-white" />
              ) : isNumberIncorrectlyAnswered(number) ? (
                  <span className="text-xl">✕</span>
              ) : (
                number || ''
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center mt-4 text-xs text-slate-500">
        <div>🟢 Correct • 🔴 Incorrect • 🔵 Marked • ⚪ Called • ⚫ Pending</div>
        <div className="mt-1">Click on pulsing numbers to mark them.</div>
      </div>
    </div>
  );
};

export default PlayerTicket;

