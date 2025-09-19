import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import questions from '../data/questions.json'
import { gameService } from '../utils/gameService'

const QuestionRound = ({ 
  selectedNumber, 
  onRoundComplete, 
  isVisible, 
  onClose,
  gameId 
}) => {
  const [currentPhase, setCurrentPhase] = useState('prep') // prep, question, scoring
  const [countdown, setCountdown] = useState(5)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [timerInterval, setTimerInterval] = useState(null)
  const [animateOptions, setAnimateOptions] = useState(false)

  useEffect(() => {
    console.log('QuestionRound useEffect:', { isVisible, selectedNumber })
    
    if (!isVisible || !selectedNumber) return

    // Clear any existing timer
    if (timerInterval) {
      clearInterval(timerInterval)
    }

    // Reset phase to prep when starting new round
    setCurrentPhase('prep')
    setCountdown(5)

    // Get question for the selected number
    const question = questions.find(q => q.id === selectedNumber) || questions[0]
    setCurrentQuestion(question)
    
    console.log(`Starting 3-phase round for number ${selectedNumber}:`, question)
    
    // Start the 3-phase timer workflow
    startRoundWorkflow()

    // Cleanup on unmount
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [isVisible, selectedNumber])

  // Create animation effect for options when question phase starts
  useEffect(() => {
    if (currentPhase === 'question' && countdown === 15) {
      setAnimateOptions(true)
      setTimeout(() => setAnimateOptions(false), 800)
    }
  }, [currentPhase, countdown])

  const startRoundWorkflow = async () => {
    try {
      // Update game state in Appwrite - mark number as called
      const result = await gameService.updateGameNumbers(gameId, selectedNumber)
      if (!result.success) {
        console.error('Failed to update game numbers:', result.error)
        toast.error('Failed to update game: ' + result.error)
        return
      }
      
      // Phase 1: Exactly 5 seconds preparation
      setCurrentPhase('prep')
      setCountdown(5)
      
      let timeLeft = 5
      const prepTimer = setInterval(() => {
        timeLeft--
        setCountdown(timeLeft)
        
        if (timeLeft <= 0) {
          clearInterval(prepTimer)
          startQuestionPhase()
        }
      }, 1000)
      
      setTimerInterval(prepTimer)
    } catch (error) {
      console.error('Failed to start round workflow:', error)
      toast.error('Failed to start round')
    }
  }

  const startQuestionPhase = () => {
    // Phase 2: Exactly 15 seconds question
    setCurrentPhase('question')
    setCountdown(15)
    
    let timeLeft = 15
    const questionTimer = setInterval(() => {
      timeLeft--
      setCountdown(timeLeft)
      
      if (timeLeft <= 0) {
        clearInterval(questionTimer)
        startScoringPhase()
      }
    }, 1000)
    
    setTimerInterval(questionTimer)
  }

  const startScoringPhase = () => {
    console.log('📊 Starting scoring phase for number:', selectedNumber)
    // Phase 3: Exactly 5 seconds scoring
    setCurrentPhase('scoring')
    setCountdown(5)
    
    let timeLeft = 5
    const scoringTimer = setInterval(() => {
      timeLeft--
      setCountdown(timeLeft)
      
      if (timeLeft <= 0) {
        console.log('⏱️ Scoring timer finished, completing round')
        clearInterval(scoringTimer)
        setTimeout(() => completeRound(), 100)
      }
    }, 1000)
    
    setTimerInterval(scoringTimer)
  }

  const completeRound = useCallback(() => {
    console.log('🏁 completeRound called for number:', selectedNumber)
    
    // Show completion notification
    toast.success(`Question ${selectedNumber} completed! Leaderboard updated.`)
    
    // Clean up and close
    if (timerInterval) {
      clearInterval(timerInterval)
      console.log('🧹 Timer interval cleared')
    }
    
    // Auto-close popup after notification
    console.log('⏰ Setting timeout to close popup in 1 second')
    setTimeout(() => {
      console.log('🚪 Calling onRoundComplete to close popup')
      onRoundComplete()
    }, 1000)
  }, [selectedNumber, timerInterval, onRoundComplete])

  const handleClose = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
    }
    onClose()
  }

  // Calculate progress value for the progress bar
  const getProgressValue = () => {
    if (currentPhase === 'prep') {
      return ((5 - countdown) / 5) * 100
    }
    if (currentPhase === 'question') {
      return ((15 - countdown) / 15) * 100
    }
    if (currentPhase === 'scoring') {
      return ((5 - countdown) / 5) * 100
    }
    return 0
  }

  // Get class name for options based on animation state
  const getOptionClassName = (index) => {
    const baseClass = "p-2 sm:p-3 lg:p-4 rounded-xl transition-all duration-300 relative overflow-hidden cursor-pointer transform hover:scale-105"
    const animationClass = animateOptions ? "animate-appear-staggered" : ""
    
    // Different gradient colors for each option
    const optionColors = [
      'from-pink-500/80 to-rose-600/80 border-pink-400/50 hover:from-pink-600/90 hover:to-rose-700/90', // Option A - Pink
      'from-blue-500/80 to-indigo-600/80 border-blue-400/50 hover:from-blue-600/90 hover:to-indigo-700/90', // Option B - Blue  
      'from-orange-500/80 to-amber-600/80 border-orange-400/50 hover:from-orange-600/90 hover:to-amber-700/90', // Option C - Orange
      'from-purple-500/80 to-violet-600/80 border-purple-400/50 hover:from-purple-600/90 hover:to-violet-700/90' // Option D - Purple
    ]
    
    if (index === currentQuestion.correctAnswer && currentPhase === 'scoring') {
      return `${baseClass} ${animationClass} bg-gradient-to-r from-green-600/70 to-emerald-600/70 border-2 border-green-400 shadow-lg shadow-green-400/30 ring-2 ring-green-300/50`
    }
    
    const colorClass = optionColors[index] || 'from-gray-500/80 to-gray-600/80 border-gray-400/50'
    return `${baseClass} ${animationClass} bg-gradient-to-r ${colorClass} border-2 backdrop-blur-sm shadow-lg hover:shadow-xl`
  }

  if (!isVisible || !currentQuestion) return null

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-1 overflow-hidden bg-gradient-to-br from-black/95 via-gray-900/95 to-slate-900/95 backdrop-blur-xl sm:p-2">
      {/* Enhanced background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute rounded-full -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-gray-500/20 to-slate-500/15 blur-3xl animate-pulse"></div>
        <div className="absolute rounded-full -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-slate-600/20 to-gray-600/15 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute rounded-full top-1/3 left-1/4 w-60 h-60 bg-gradient-to-br from-gray-700/15 to-slate-700/10 blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute rounded-full bottom-1/3 right-1/4 w-60 h-60 bg-gradient-to-br from-slate-500/20 to-gray-500/10 blur-2xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>
      
      {/* Main card with enhanced glass effect */}
      <div className="relative w-full max-w-md p-2 overflow-hidden border shadow-2xl bg-black/40 backdrop-blur-2xl rounded-2xl sm:p-3 lg:p-3 border-gray-700/50 shadow-black/60">
        
        {/* Glass effect overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800/20 via-gray-900/10 to-transparent rounded-3xl"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-500/50 to-transparent"></div>
        <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-gray-600/30 to-transparent"></div>
        
        {/* Animated shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300/10 to-transparent shimmer"></div>
        
        {/* Content wrapper */}
        <div className="relative z-10">
          {/* Header with number and timer */}
          <div className="mb-1 text-center sm:mb-2">
            <div className="mb-1 text-xl font-bold sm:text-2xl lg:text-3xl animate-pulse">
              <span className="text-transparent bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text drop-shadow-lg">
                {selectedNumber}
              </span>
            </div>
            
            {/* Timer circle on mobile, regular display on desktop */}
            <div className="flex flex-col items-center gap-1">
              <div className={`relative inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full border-2 ${
                currentPhase === 'prep' ? 'border-yellow-400/30 bg-yellow-400/10' :
                currentPhase === 'question' ? 'border-green-400/30 bg-green-400/10' : 'border-blue-400/30 bg-blue-400/10'
              }`}>
                <span className={`text-lg sm:text-xl lg:text-2xl font-bold font-mono ${
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
                    strokeWidth="6"
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
                    strokeWidth="6"
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
            <div className="py-2 text-center sm:py-3">
              <div className="relative mb-2 sm:mb-3">
                <div className="text-lg font-bold text-yellow-400 sm:text-xl lg:text-2xl animate-pulse">
                  Get Ready!
                </div>
                <div className="absolute rounded-full -inset-1 bg-yellow-400/20 blur-xl"></div>
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs font-medium sm:text-sm lg:text-base text-slate-300">
                  Question {selectedNumber} is about to begin...
                </p>
                <div className="max-w-xs mx-auto sm:max-w-sm">
                  <div className="relative p-2 text-xs text-gray-200 border shadow-lg sm:text-sm bg-gradient-to-br from-gray-800/60 to-black/40 backdrop-blur-xl rounded-xl sm:p-3 border-gray-600/40">
                    {/* Glass effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-700/20 to-transparent rounded-xl"></div>
                    <div className="relative z-10 font-medium leading-relaxed">
                      {currentQuestion.question}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Question Phase */}
          {currentPhase === 'question' && (
            <div className="space-y-2 sm:space-y-3">
              <div className="text-center">
                <h2 className="mb-1 text-sm font-bold text-white sm:text-base lg:text-lg sm:mb-2">
                  Question {selectedNumber}
                </h2>
                <div className="max-w-xs mx-auto sm:max-w-sm">
                  <div className="relative p-2 border shadow-xl bg-gradient-to-br from-gray-800/70 to-black/50 backdrop-blur-xl rounded-2xl sm:p-3 border-gray-600/50 shadow-black/40">
                    {/* Enhanced glass effect overlays */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-700/25 via-gray-800/15 to-transparent rounded-2xl"></div>
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-400/60 to-transparent"></div>
                    
                    <p className="relative z-10 text-xs font-medium leading-relaxed text-center text-gray-100 sm:text-sm lg:text-base">
                      {currentQuestion.question}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1 sm:gap-2">
                {currentQuestion.options.map((option, index) => (
                  <div 
                    key={index}
                    className={getOptionClassName(index)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Animated background shimmer effect */}
                    <div className="absolute inset-0 transform -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                    
                    <div className="relative z-10 flex items-center space-x-2">
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0 shadow-lg relative overflow-hidden ${
                        index === 0 ? 'bg-gradient-to-br from-pink-400 to-rose-500' :
                        index === 1 ? 'bg-gradient-to-br from-blue-400 to-indigo-500' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-500' :
                        'bg-gradient-to-br from-purple-400 to-violet-500'
                      }`}>
                        {/* Letter glow effect */}
                        <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse"></div>
                        <span className="relative z-10">{String.fromCharCode(65 + index)}</span>
                      </div>
                      <span className="flex-1 text-xs font-medium leading-tight text-white sm:text-sm drop-shadow-sm">
                        {option}
                      </span>
                      {index === currentQuestion.correctAnswer && currentPhase === 'scoring' && (
                        <div className="flex items-center">
                          <CheckCircle className="flex-shrink-0 w-4 h-4 text-green-300 sm:w-5 sm:h-5 animate-bounce" />
                          <span className="ml-1 text-xs font-bold text-green-300 sm:text-sm">Correct!</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-2 border rounded-full bg-blue-900/20 border-blue-700/30">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-blue-300 sm:text-sm">
                    Players are answering on their devices...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Scoring Phase */}
          {currentPhase === 'scoring' && (
            <div className="py-2 text-center sm:py-3">
              <div className="relative mb-2 sm:mb-3">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <CheckCircle className="w-8 h-8 text-green-500 sm:w-10 sm:h-10 animate-bounce" />
                    <div className="absolute rounded-full -inset-2 bg-green-400/20 blur-xl"></div>
                  </div>
                  <div className="mt-1 text-base font-bold text-green-400 sm:text-lg sm:mt-2">
                    Round Complete!
                  </div>
                </div>
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <div className="max-w-xs mx-auto sm:max-w-sm">
                  <div className="p-2 border rounded-lg bg-green-900/20 border-green-700/30 sm:p-3">
                    <p className="text-xs font-medium text-green-200 sm:text-sm lg:text-base">
                      <span className="font-bold">Correct Answer:</span>
                    </p>
                    <p className="mt-1 text-sm font-bold text-green-100 sm:text-base lg:text-lg">
                      {String.fromCharCode(65 + currentQuestion.correctAnswer)} - {currentQuestion.options[currentQuestion.correctAnswer]}
                    </p>
                  </div>
                </div>
                
                <div className="inline-flex items-center gap-2 px-3 py-2 border rounded-full bg-blue-900/20 border-blue-700/30">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-blue-300 sm:text-sm">
                    Calculating scores and updating leaderboard...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Close button - only show during prep phase */}
          {currentPhase === 'prep' && (
            <div className="mt-4 text-center sm:mt-6">
              <button
                onClick={handleClose}
                className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs sm:text-sm font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Cancel Round
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuestionRound
