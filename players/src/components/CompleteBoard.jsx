import React from 'react';
import { CheckCircle, Clock, X, Hash, Target, Trophy } from 'lucide-react';

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-slate-800 p-8 rounded-lg flex flex-row items-center gap-4 transition-colors hover:bg-slate-700 border border-slate-700">
    <div className="text-slate-400">{icon}</div>
    <div className="flex-grow text-center">
      <div className={`font-bold ${color} text-2xl`}>{value}</div>
      <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">{label}</div>
    </div>
  </div>
);

const LegendItem = ({ color, label, border = 'border-slate-600' }) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 rounded-sm border ${border} ${color}`}></div>
    <span className="text-xs text-slate-400">{label}</span>
  </div>
);

const CompleteBoard = ({
  selectedNumbers = [],
  currentNumber = null,
  processedQuestions = new Set(),
  correctlyAnsweredNumbers = new Set(),
  playerWins = {}
}) => {
  const allNumbers = Array.from({ length: 90 }, (_, i) => i + 1);

  const getNumberStatus = (number) => {
    if (number === currentNumber) return 'current';
    if (correctlyAnsweredNumbers.has(number)) return 'correct';
    if (processedQuestions.has(number)) return 'processed';
    if (selectedNumbers.includes(number)) return 'selected';
    return 'available';
  };

  const getNumberClass = (status) => {
    switch (status) {
      case 'current':
        return 'bg-yellow-500 text-black border-yellow-400 shadow-lg animate-pulse';
      case 'correct':
        return 'bg-green-600 text-white border-green-400 shadow-lg';
      case 'processed':
        return 'bg-red-900 text-red-300 border-red-600 blur-sm opacity-75 line-through';
      case 'selected':
        return 'bg-slate-700 text-green-400 border-green-600';
      case 'available':
        return 'bg-slate-800 text-slate-300 border-slate-700 transition-colors hover:bg-slate-700 cursor-pointer';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const totalCalled = selectedNumbers.length;
  const totalCorrect = correctlyAnsweredNumbers.size;
  const totalWins = Object.values(playerWins).filter(Boolean).length;

  return (
    <div className="bg-slate-800/50 text-white p-4 sm:p-6 w-full flex flex-col font-sans rounded-xl">
      <main className="flex-grow flex flex-col-reverse lg:flex-row gap-6 lg:gap-8">
        
        <div className="flex-grow lg:w-3/4 bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-700 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Game Board
              </h3>
              <p className="text-sm text-slate-400 mt-1">Called: {totalCalled}/50</p>
            </div>
            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-x-3 sm:gap-x-4 gap-y-2">
              <LegendItem color="bg-yellow-500" border="border-yellow-400" label="Current" />
              <LegendItem color="bg-green-600" border="border-green-400" label="Correct" />
              <LegendItem color="bg-slate-700" border="border-green-600" label="Called" />
              <LegendItem color="bg-red-900" border="border-red-600" label="Failed" />
              <LegendItem color="bg-slate-800" border="border-slate-700" label="Not Called" />
            </div>
          </div>
          
          <div className="flex-grow grid grid-cols-10 gap-1 sm:gap-2 w-full lg:w-4/5 mx-auto">
            {allNumbers.map(number => {
              const status = getNumberStatus(number);
              const className = getNumberClass(status);
              return (
                <div
                  key={number}
                  className={`aspect-square flex items-center justify-center text-sm sm:text-base font-bold rounded-lg border transition-all duration-300 relative ${className}`}
                  title={`Number ${number}: ${status.charAt(0).toUpperCase() + status.slice(1)}`}
                >
                  {status === 'correct' ? (
                    <>
                      <span className="font-bold">{number}</span>
                      <CheckCircle className="w-3 h-3 text-green-200 absolute top-1 right-1" />
                    </>
                  ) : status === 'processed' ? (
                    <>
                      <span className="opacity-50">{number}</span>
                      <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 absolute inset-0 m-auto" />
                    </>
                  ) : (
                    number
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Game Progress</span>
              <span className="font-semibold text-white">{Math.round((totalCalled / 50) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(totalCorrect / 50) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/4">
           <div className="grid grid-cols-2 lg:flex lg:flex-col lg:justify-between gap-4 h-full">
              <StatCard 
                icon={<CheckCircle className="w-6 h-6"/>} 
                label="Correct" 
                value={totalCorrect}
                color="text-green-400"
              />
              <StatCard 
                icon={<Hash className="w-6 h-6"/>} 
                label="Called" 
                value={totalCalled}
                color="text-slate-300"
              />
              <StatCard 
                icon={<Target className="w-6 h-6"/>} 
                label="Current" 
                value={currentNumber || '–'}
                color="text-yellow-400"
              />
               <StatCard 
                icon={<Trophy className="w-6 h-6"/>} 
                label="Wins" 
                value={totalWins}
                color="text-purple-400"
              />
           </div>
        </div>
      </main>
    </div>
  );
};

export default CompleteBoard;

