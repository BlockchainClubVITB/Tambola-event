import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const PlayerQuestionRound = ({
  questionData,
  onAnswerSubmit,
  isVisible,
  currentPhase,
  countdown,
  hasAnswered,
  selectedAnswer,
  setSelectedAnswer
}) => {
  const [animateOptions, setAnimateOptions] = useState(false);

  // Create animation effect for options when question phase starts
  useEffect(() => {
    if (currentPhase === 'question' && countdown === 30) {
      setAnimateOptions(true);
      setTimeout(() => setAnimateOptions(false), 800);
    }
  }, [currentPhase, countdown]);

  // Handle answer selection
  const handleOptionSelect = (index) => {
    if (currentPhase === 'question' && !hasAnswered) {
      setSelectedAnswer(index);
    }
  };

  // Prepare class name for answer option based on its state
  const getOptionClassName = (index) => {
    const baseClass = "p-2 sm:p-3 lg:p-4 rounded-xl transition-all duration-300 touch-manipulation relative overflow-hidden cursor-pointer transform";
    
    // Animation for entrance
    const animationClass = animateOptions ? "animate-appear-staggered" : "";
    
    // Different gradient colors for each option
    const optionColors = [
      'from-pink-500/80 to-rose-600/80 border-pink-400/50 hover:from-pink-600/90 hover:to-rose-700/90', // Option A - Pink
      'from-blue-500/80 to-indigo-600/80 border-blue-400/50 hover:from-blue-600/90 hover:to-indigo-700/90', // Option B - Blue  
      'from-orange-500/80 to-amber-600/80 border-orange-400/50 hover:from-orange-600/90 hover:to-amber-700/90', // Option C - Orange
      'from-purple-500/80 to-violet-600/80 border-purple-400/50 hover:from-purple-600/90 hover:to-violet-700/90' // Option D - Purple
    ]
    
    // Selected state
    if (selectedAnswer === index && !hasAnswered) {
      const selectedColorClass = optionColors[index] || 'from-gray-500/80 to-gray-600/80';
      return `${baseClass} ${animationClass} bg-gradient-to-r ${selectedColorClass} border-2 shadow-lg scale-105 ring-2 ring-white/30`;
    }
    
    // Show correct/incorrect after answering
    if (hasAnswered && currentPhase === 'scoring') {
      if (index === questionData.correctAnswer) {
        return `${baseClass} ${animationClass} bg-gradient-to-r from-green-600/70 to-emerald-600/70 border-2 border-green-400 shadow-lg shadow-green-400/30 ring-2 ring-green-300/50`;
      }
      if (selectedAnswer === index) {
        return `${baseClass} ${animationClass} bg-gradient-to-r from-red-600/70 to-red-700/70 border-2 border-red-400 shadow-lg shadow-red-400/30`;
      }
      return `${baseClass} ${animationClass} bg-gradient-to-r from-slate-700/60 to-slate-800/60 border-2 border-slate-600/30 opacity-60`;
    }
    
    // Disabled after answering during question phase
    if (hasAnswered) {
      if (selectedAnswer === index) {
        const selectedColorClass = optionColors[index] || 'from-gray-500/80 to-gray-600/80';
        return `${baseClass} ${animationClass} bg-gradient-to-r ${selectedColorClass} border-2 shadow-lg opacity-80`;
      }
      return `${baseClass} ${animationClass} bg-gradient-to-r from-slate-700/40 to-slate-800/40 border-2 border-slate-600/20 opacity-50`;
    }
    
    // Default clickable state
    const colorClass = optionColors[index] || 'from-gray-500/80 to-gray-600/80';
    return `${baseClass} ${animationClass} bg-gradient-to-r ${colorClass} border-2 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95`;
  };

  // Create animated progress bar for countdown
  const getProgressValue = useCallback(() => {
    if (currentPhase === 'prep') {
      return ((5 - countdown) / 5) * 100;
    }
    if (currentPhase === 'question') {
      return ((30 - countdown) / 30) * 100;
    }
    if (currentPhase === 'scoring') {
      return ((5 - countdown) / 5) * 100;
    }
    return 0;
  }, [currentPhase, countdown]);

  // Don't render if not visible or no question data
  if (!isVisible || !questionData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-gradient-to-br from-black/95 via-gray-900/95 to-slate-900/95 backdrop-blur-xl overflow-hidden">
      {/* Enhanced background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-gray-500/20 to-slate-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-slate-600/20 to-gray-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 left-1/4 w-60 h-60 bg-gradient-to-br from-gray-700/15 to-slate-700/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-60 h-60 bg-gradient-to-br from-slate-500/20 to-gray-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>
      
      {/* Main card with enhanced glass effect */}
      <div className="w-full max-w-xs sm:max-w-md lg:max-w-xl p-3 sm:p-5 lg:p-8 border shadow-2xl shadow-black/60 bg-black/40 backdrop-blur-2xl border-gray-700/50 rounded-3xl overflow-hidden relative">
        
        {/* Glass effect overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800/20 via-gray-900/10 to-transparent rounded-3xl"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-500/50 to-transparent"></div>
        <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-gray-600/30 to-transparent"></div>
        
        {/* Animated shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300/10 to-transparent shimmer"></div>
        
        {/* Content wrapper */}
        <div className="relative z-10">
          {/* Header with number and timer */}
          <div className="mb-4 sm:mb-6 lg:mb-8 text-center">
            <div className="text-3xl sm:text-5xl lg:text-7xl font-bold mb-2 sm:mb-4 animate-pulse">
              <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
                {questionData.id}
              </span>
            </div>
            
            {/* Enhanced timer with circular progress */}
            <div className="flex flex-col items-center gap-2">
              <div className={`relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full border-4 ${
                currentPhase === 'prep' ? 'border-yellow-400/30 bg-yellow-400/10' :
                currentPhase === 'question' ? 'border-green-400/30 bg-green-400/10' : 'border-blue-400/30 bg-blue-400/10'
              }`}>
                <span className={`text-xl sm:text-2xl lg:text-3xl font-bold font-mono ${
                  currentPhase === 'prep' ? 'text-yellow-400' :
                  currentPhase === 'question' ? 'text-green-400' : 'text-blue-400'
                }`}>
                  {countdown}
                </span>
                
                {/* Progress ring */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    strokeWidth="8"
                    className={
                      currentPhase === 'prep' ? 'stroke-yellow-400/20' :
                      currentPhase === 'question' ? 'stroke-green-400/20' : 'stroke-blue-400/20'
                    }
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className={
                      currentPhase === 'prep' ? 'stroke-yellow-400' :
                      currentPhase === 'question' ? 'stroke-green-400' : 'stroke-blue-400'
                    }
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgressValue() / 100)}`}
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                  />
                </svg>
              </div>
              
              <div className={`text-xs sm:text-sm lg:text-base font-medium ${
                currentPhase === 'prep' ? 'text-yellow-300' :
                currentPhase === 'question' ? 'text-green-300' : 'text-blue-300'
              }`}>
                {currentPhase === 'prep' && 'Round starting in...'}
                {currentPhase === 'question' && 'seconds to answer'}
                {currentPhase === 'scoring' && 'updating leaderboard...'}
              </div>
            </div>
          </div>

          {/* Preparation Phase */}
          {currentPhase === 'prep' && (
            <div className="py-4 sm:py-6 lg:py-8 text-center">
              <div className="mb-3 sm:mb-4 lg:mb-6 relative">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-400 animate-pulse">
                  Get Ready!
                </div>
                <div className="absolute -inset-1 bg-yellow-400/20 blur-xl rounded-full"></div>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                <p className="text-sm sm:text-base lg:text-lg text-slate-300 font-medium">
                  Question {questionData.id} is about to begin...
                </p>
                <div className="mx-auto max-w-xs sm:max-w-sm lg:max-w-md">
                  <div className="relative text-xs sm:text-sm lg:text-base text-gray-200 bg-gradient-to-br from-gray-800/60 to-black/40 backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-gray-600/40 shadow-lg">
                    {/* Glass effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-700/20 to-transparent rounded-xl"></div>
                    <div className="relative z-10 font-medium leading-relaxed">
                      {questionData.question}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Question Phase Content */}
          {currentPhase === 'question' && (
            <div className="space-y-3 sm:space-y-4 lg:space-y-5">
              <div className="text-center">
                <h2 className="mb-2 sm:mb-3 lg:mb-4 text-base sm:text-lg lg:text-xl font-bold text-white">
                  Question {questionData.id}
                </h2>
                <div className="mx-auto max-w-xs sm:max-w-sm lg:max-w-lg">
                  <div className="relative mb-3 sm:mb-4 lg:mb-5 bg-gradient-to-br from-gray-800/70 to-black/50 backdrop-blur-xl rounded-2xl p-4 sm:p-5 lg:p-6 border border-gray-600/50 shadow-xl shadow-black/40">
                    {/* Enhanced glass effect overlays */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-700/25 via-gray-800/15 to-transparent rounded-2xl"></div>
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-400/60 to-transparent"></div>
                    
                    <p className="relative z-10 text-sm sm:text-base lg:text-lg font-medium leading-relaxed text-center text-gray-100">
                      {questionData.question}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:gap-3 mb-3 sm:mb-4">
                {questionData.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(index)}
                    disabled={hasAnswered}
                    className={getOptionClassName(index)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent shimmer"></div>
                    
                    <div className="flex items-center space-x-2 sm:space-x-3 relative z-10">
                      {/* Option letter with gradient background */}
                      <div className={`
                        flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 
                        text-xs sm:text-sm lg:text-base font-bold text-white rounded-full flex-shrink-0 shadow-lg
                        ${index === 0 ? 'bg-gradient-to-br from-pink-400 to-rose-500' : 
                          index === 1 ? 'bg-gradient-to-br from-blue-400 to-indigo-500' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-500' :
                          'bg-gradient-to-br from-purple-400 to-violet-500'}
                      `}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      
                      {/* Option text */}
                      <span className="text-xs sm:text-sm lg:text-base break-words flex-1 text-left font-medium leading-tight text-white">
                        {option}
                      </span>
                      
                      {/* Show check/x mark during scoring phase */}
                      {hasAnswered && currentPhase === 'scoring' && (
                        <div className="ml-2 flex-shrink-0">
                          {index === questionData.correctAnswer ? (
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 animate-bounce" />
                          ) : selectedAnswer === index ? (
                            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 animate-pulse" />
                          ) : null}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              <button
                onClick={onAnswerSubmit}
                disabled={selectedAnswer === null || hasAnswered}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-semibold rounded-xl transition-all duration-300 touch-manipulation ${
                  hasAnswered 
                    ? 'bg-slate-700 text-slate-300 cursor-not-allowed' 
                    : selectedAnswer !== null
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]' 
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {hasAnswered ? '✓ Answer Submitted' : selectedAnswer !== null ? 'Submit Answer' : 'Select an answer first'}
              </button>

              {/* Waiting message after answer submitted */}
              {hasAnswered && (
                <div className="p-2 sm:p-3 text-center border rounded-lg bg-blue-900/20 border-blue-700/30">
                  <div className="flex items-center justify-center mb-1 text-xs sm:text-sm text-blue-400">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-pulse" />
                    <span>Answer submitted successfully!</span>
                  </div>
                  <div className="text-xs text-blue-300">
                    Waiting for other players... ({countdown}s remaining)
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scoring Phase */}
          {currentPhase === 'scoring' && (
            <div className="py-4 sm:py-6 lg:py-8 text-center">
              <div className="mb-3 sm:mb-4 lg:mb-6 relative">
                <div className="flex flex-col items-center">
                  {hasAnswered && selectedAnswer === questionData.correctAnswer ? (
                    <div className="relative">
                      <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 animate-bounce" />
                      <div className="absolute -inset-2 bg-green-400/20 blur-xl rounded-full"></div>
                    </div>
                  ) : hasAnswered ? (
                    <div className="relative">
                      <XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500" />
                      <div className="absolute -inset-2 bg-red-400/20 blur-xl rounded-full"></div>
                    </div>
                  ) : (
                    <div className="relative">
                      <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-orange-500" />
                      <div className="absolute -inset-2 bg-orange-400/20 blur-xl rounded-full"></div>
                    </div>
                  )}
                  
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold mt-2 sm:mt-3">
                    {hasAnswered && selectedAnswer === questionData.correctAnswer ? (
                      <span className="text-green-400">Correct Answer!</span>
                    ) : hasAnswered ? (
                      <span className="text-red-400">Wrong Answer</span>
                    ) : (
                      <span className="text-orange-400">Time's Up!</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                <div className="mx-auto max-w-xs sm:max-w-sm lg:max-w-md">
                  <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-2 sm:p-3">
                    <p className="text-xs sm:text-sm text-green-200 font-medium">
                      <span className="font-bold">Correct Answer:</span>
                    </p>
                    <p className="text-sm sm:text-base text-green-100 font-bold mt-1">
                      {String.fromCharCode(65 + questionData.correctAnswer)} - {questionData.options[questionData.correctAnswer]}
                    </p>
                  </div>
                </div>
                
                <div className="text-xs sm:text-sm text-slate-400">
                  {hasAnswered && selectedAnswer === questionData.correctAnswer ? (
                    <p className="text-green-400 font-medium">+10 points added to your score!</p>
                  ) : (
                    <p>Better luck on the next question!</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerQuestionRound;
