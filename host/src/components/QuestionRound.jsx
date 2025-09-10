import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
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

  useEffect(() => {
    console.log('QuestionRound useEffect:', { isVisible, selectedNumber })
    
    if (!isVisible || !selectedNumber) return

    // Clear any existing timer
    if (timerInterval) {
      clearInterval(timerInterval)
    }

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
    // Phase 2: Exactly 30 seconds question
    setCurrentPhase('question')
    setCountdown(30)
    
    let timeLeft = 30
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
    // Phase 3: Exactly 5 seconds scoring
    setCurrentPhase('scoring')
    setCountdown(5)
    
    let timeLeft = 5
    const scoringTimer = setInterval(() => {
      timeLeft--
      setCountdown(timeLeft)
      
      if (timeLeft <= 0) {
        clearInterval(scoringTimer)
        setTimeout(() => completeRound(), 100)
      }
    }, 1000)
    
    setTimerInterval(scoringTimer)
  }

  const completeRound = useCallback(() => {
    // Show completion notification
    toast.success(`Question ${selectedNumber} completed! Leaderboard updated.`)
    
    // Clean up and close
    if (timerInterval) {
      clearInterval(timerInterval)
    }
    
    // Auto-close popup after notification
    setTimeout(() => {
      onRoundComplete()
    }, 1000)
  }, [selectedNumber, timerInterval, onRoundComplete])

  const handleClose = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
    }
    onClose()
  }

  if (!isVisible || !currentQuestion) return null

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-xl p-8 max-w-2xl w-full mx-4 border border-slate-700 shadow-2xl">
        
        {/* Header with number and timer */}
        <div className="text-center mb-8">
          <div className="text-8xl font-bold text-blue-400 mb-4 animate-pulse">
            {selectedNumber}
          </div>
          <div className={`text-4xl font-bold mb-2 ${
            currentPhase === 'prep' ? 'text-yellow-400' :
            currentPhase === 'question' ? 'text-green-400' : 'text-blue-400'
          }`}>
            {countdown}
          </div>
          <div className={`text-xl ${
            currentPhase === 'prep' ? 'text-yellow-300' :
            currentPhase === 'question' ? 'text-green-300' : 'text-blue-300'
          }`}>
            {currentPhase === 'prep' && 'Round starting in...'}
            {currentPhase === 'question' && 'seconds to answer'}
            {currentPhase === 'scoring' && 'updating leaderboard...'}
          </div>
        </div>

        {/* Preparation Phase */}
        {currentPhase === 'prep' && (
          <div className="text-center py-12">
            <div className="text-5xl font-bold text-yellow-400 mb-6">
              Get Ready!
            </div>
            <p className="text-xl text-slate-300 mb-6">
              Question {selectedNumber} is about to begin...
            </p>
            <div className="text-lg text-slate-400">
              {currentQuestion.question}
            </div>
          </div>
        )}

        {/* Question Phase */}
        {currentPhase === 'question' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-6">
                Question {selectedNumber}
              </h2>
              <p className="text-xl text-slate-200 mb-8 leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <div 
                  key={index}
                  className="bg-slate-800 p-6 rounded-xl border border-slate-600 hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-white text-lg">{option}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center text-slate-400 text-lg">
              <p>Players are answering on their devices...</p>
            </div>
          </div>
        )}

        {/* Scoring Phase */}
        {currentPhase === 'scoring' && (
          <div className="text-center py-12">
            <div className="text-5xl font-bold text-blue-400 mb-6">
              Round Complete!
            </div>
            <p className="text-xl text-slate-200 mb-6">
              <strong>Correct Answer:</strong> {String.fromCharCode(65 + currentQuestion.correctAnswer)} - {currentQuestion.options[currentQuestion.correctAnswer]}
            </p>
            <p className="text-lg text-slate-400">
              Calculating scores and updating leaderboard...
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-8">
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-1000 ${
                currentPhase === 'prep' ? 'bg-yellow-400' :
                currentPhase === 'question' ? 'bg-green-400' : 'bg-blue-400'
              }`}
              style={{
                width: `${((currentPhase === 'prep' ? 5 : currentPhase === 'question' ? 30 : 5) - countdown) / 
                        (currentPhase === 'prep' ? 5 : currentPhase === 'question' ? 30 : 5) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Close button - only show during prep phase */}
        {currentPhase === 'prep' && (
          <div className="text-center mt-8">
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              Cancel Round
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuestionRound
