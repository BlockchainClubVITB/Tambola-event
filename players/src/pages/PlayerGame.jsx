import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  LogOut, 
  User, 
  Users, 
  Trophy, 
  AlertCircle,
  CheckCircle,
  Clock,
  GamepadIcon,
  RotateCcw
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import PlayerTicket from '../components/PlayerTicket'
import CompleteBoard from '../components/CompleteBoard'
import { gameService } from '../utils/gameService'
import questionsData from '../data/questions.json'

const PlayerGame = ({ gameId, playerName, isJoined }) => {
  const navigate = useNavigate()
  const [gameState, setGameState] = useState('loading') // loading, waiting, playing, finished
  const [currentNumber, setCurrentNumber] = useState(null)
  const [calledNumbers, setCalledNumbers] = useState([])
  const [playerTicket, setPlayerTicket] = useState(null)
  const [markedNumbers, setMarkedNumbers] = useState(new Set())
  const [correctlyAnsweredNumbers, setCorrectlyAnsweredNumbers] = useState(new Set())
  const [wins, setWins] = useState([])
  const [gameInfo, setGameInfo] = useState({
    totalPlayers: 0,
    gameStartTime: null,
    gameData: null
  })
  const [currentRound, setCurrentRound] = useState(null)
  const [roundPhase, setRoundPhase] = useState('prepare') // prepare, active, scoring
  const [timeLeft, setTimeLeft] = useState(0)
  const [playerData, setPlayerData] = useState(null)
  const [lastNumberNotified, setLastNumberNotified] = useState(null)
  const [showQuestionRound, setShowQuestionRound] = useState(false)
  const [questionData, setQuestionData] = useState(null)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [questionPhase, setQuestionPhase] = useState('prep') // prep, question, scoring
  const [questionTimer, setQuestionTimer] = useState(0)
  const [processedQuestions, setProcessedQuestions] = useState(new Set()) // Track numbers that have been processed for questions
  const [isQuestionActive, setIsQuestionActive] = useState(false) // Track if a question round is currently active
  const [lastGameStateHash, setLastGameStateHash] = useState('') // Cache game state to avoid unnecessary updates
  const pollIntervalRef = useRef(null)
  const questionTimerRef = useRef(null)
  const hasShownRestorationRef = useRef(false) // Track if we've shown restoration message

  // Redirect if not joined - simple check
  useEffect(() => {
    // Check if we have player data (fresh login or localStorage)
    const storedPlayer = localStorage.getItem('tambola_player')
    
    if (storedPlayer) {
      const player = JSON.parse(storedPlayer)
      setPlayerData(player)
    } else if (!isJoined || !gameId || !playerName) {
      // No stored data and no props - redirect to login
      navigate('/')
      return
    } else {
      // Store new player data
      setPlayerData({
        gameId,
        name: playerName
      })
    }

    // Generate a sample ticket for the player
    generatePlayerTicket()
    
    // Start polling for game updates
    startGamePolling()

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current)
      }
      // Clean up question state on unmount
      setShowQuestionRound(false)
      setIsQuestionActive(false)
    }
  }, [navigate])

  const startGamePolling = () => {
    // Only poll for new numbers every 10 seconds (much less frequent)
    // Players don't need real-time updates except for new numbers
    pollIntervalRef.current = setInterval(async () => {
      // Only check for new numbers - no other data polling
      await checkForNewNumbers()
    }, 10000) // Every 10 seconds instead of 5

    // Initial fetch
    fetchGameState()
  }

  // Separate function to only check for new numbers (minimal database call)
  const checkForNewNumbers = async () => {
    try {
      const storedPlayer = localStorage.getItem('tambola_player')
      const currentGameId = storedPlayer ? JSON.parse(storedPlayer).gameId : (gameId || playerData?.gameId)
      
      if (!currentGameId) return

      // Only fetch the game to check called numbers - minimal data
      const gameResult = await gameService.getGame(currentGameId)
      if (gameResult.success) {
        const game = gameResult.game
        
        // Only check if new numbers were called
        if (game.calledNumbers) {
          const newCalledNumbers = game.calledNumbers.map(num => typeof num === 'string' ? parseInt(num) : num)
          const previousCount = calledNumbers.length
          const newCount = newCalledNumbers.length
          
          console.log('Checking for new numbers:', { previousCount, newCount })
          
          if (newCount > previousCount) {
            // New number detected - trigger full game state update
            console.log('New number detected, fetching full game state')
            await fetchGameState()
          }
        }
      }
    } catch (error) {
      console.error('Failed to check for new numbers:', error)
    }
  }

  const fetchGameState = async () => {
    try {
      const storedPlayer = localStorage.getItem('tambola_player')
      const currentGameId = storedPlayer ? JSON.parse(storedPlayer).gameId : (gameId || playerData?.gameId)
      
      if (!currentGameId) return

      const gameResult = await gameService.getGame(currentGameId)
      if (gameResult.success) {
        const game = gameResult.game
        
        setGameInfo(prev => ({
          ...prev,
          gameData: game,
          totalPlayers: game.playerCount || 0
        }))

        // Update game state
        if (game.status === 'active') {
          setGameState('playing')
        } else if (game.status === 'finished') {
          setGameState('finished')
        } else {
          setGameState('waiting')
        }

        // Update called numbers from game state
        if (game.calledNumbers) {
          const newCalledNumbers = game.calledNumbers.map(num => typeof num === 'string' ? parseInt(num) : num)
          
          // Check if this is initial load (restoration) or a new number was called
          const previousCount = calledNumbers.length
          const newCount = newCalledNumbers.length
          
          console.log('Fetch game state:', { 
            previousCount, 
            newCount, 
            latestNumber: newCalledNumbers[newCalledNumbers.length - 1],
            processedQuestions: Array.from(processedQuestions),
            showQuestionRound,
            isQuestionActive,
            hasShownRestoration: hasShownRestorationRef.current
          })
          
          // Handle initial load - mark all existing numbers as processed (restoration)
          if (previousCount === 0 && newCount > 0 && !hasShownRestorationRef.current) {
            console.log('Initial load detected - marking all existing numbers as processed')
            setProcessedQuestions(new Set(newCalledNumbers))
            hasShownRestorationRef.current = true
            
            const latestNumber = newCalledNumbers[newCalledNumbers.length - 1]
            setCurrentNumber(latestNumber)
            toast.success(`Game in progress! Latest number: ${latestNumber}`)
          }
          // Handle new numbers being called (either after initial load or during gameplay)
          else if (newCount > previousCount) {
            // Check each new number that was added
            for (let i = previousCount; i < newCount; i++) {
              const newNumber = newCalledNumbers[i]
              
              // Only process if not already processed and no active question
              if (!processedQuestions.has(newNumber) && !showQuestionRound && !isQuestionActive) {
                console.log(`Processing truly new number: ${newNumber}`)
                setCurrentNumber(newNumber)
                setProcessedQuestions(prev => new Set([...prev, newNumber]))
                setLastNumberNotified(newNumber)
                setIsQuestionActive(true)
                
                // Find question and start the 3-phase workflow
                const question = questionsData.find(q => q.id === newNumber)
                if (question) {
                  console.log(`Starting question workflow for number ${newNumber}:`, question)
                  setQuestionData(question)
                  setSelectedAnswer(null)
                  setHasAnswered(false)
                  setShowQuestionRound(true)
                  startQuestionWorkflow() // Start full 3-phase workflow
                  toast.success(`New number called: ${newNumber}`)
                } else {
                  console.warn(`No question found for number ${newNumber}`)
                  toast.success(`New number called: ${newNumber} (No question available)`)
                  setIsQuestionActive(false) // Reset if no question found
                }
                break // Only process one new number at a time
              } else {
                console.log(`Skipping number ${newNumber} - already processed, question active, or not new`)
              }
            }
          }
          
          setCalledNumbers(newCalledNumbers)
        }

        // Only load player answers once on initial fetch (not every time)
        if (playerData && game.status === 'active' && correctlyAnsweredNumbers.size === 0 && calledNumbers.length === 0) {
          const answersResult = await gameService.getPlayerAnswers(currentGameId, playerData.id)
          if (answersResult.success && answersResult.answers) {
            const correctNumbers = new Set()
            answersResult.answers.forEach(answer => {
              if (answer.isCorrect && answer.questionNumber) {
                correctNumbers.add(answer.questionNumber)
              }
            })
            setCorrectlyAnsweredNumbers(correctNumbers)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch game state:', error)
    }
  }

  const startQuestionWorkflow = () => {
    console.log('Starting question workflow - Phase 1: Preparation (5s)')
    // Phase 1: Exactly 5 seconds preparation (like host)
    setQuestionPhase('prep')
    setQuestionTimer(5)
    
    // Clear any existing timer
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current)
    }
    
    // Safety timeout to prevent stuck states (total workflow should be 40s max)
    setTimeout(() => {
      if (isQuestionActive) {
        console.warn('Question workflow timeout, resetting state')
        setIsQuestionActive(false)
        setShowQuestionRound(false)
      }
    }, 45000) // 45 seconds safety timeout
    
    let timeLeft = 5
    const prepTimer = setInterval(() => {
      timeLeft--
      setQuestionTimer(timeLeft)
      console.log(`Prep phase: ${timeLeft}s remaining`)
      
      if (timeLeft <= 0) {
        clearInterval(prepTimer)
        console.log('Prep phase complete, starting question phase')
        startQuestionPhase()
      }
    }, 1000)
    
    questionTimerRef.current = prepTimer
  }

  const startQuestionPhase = () => {
    console.log('Starting question phase (30s)')
    // Phase 2: Exactly 30 seconds question (like host)
    setQuestionPhase('question')
    setQuestionTimer(30)
    
    let timeLeft = 30
    const questionTimer = setInterval(() => {
      timeLeft--
      setQuestionTimer(timeLeft)
      console.log(`Question phase: ${timeLeft}s remaining`)
      
      if (timeLeft <= 0) {
        clearInterval(questionTimer)
        if (!hasAnswered) {
          toast.error('Time up! No answer submitted')
        }
        console.log('Question phase complete, starting scoring phase')
        startScoringPhase()
      }
    }, 1000)
    
    questionTimerRef.current = questionTimer
  }

  const startScoringPhase = () => {
    console.log('Starting scoring phase (5s)')
    // Phase 3: Exactly 5 seconds scoring (like host)
    setQuestionPhase('scoring')
    setQuestionTimer(5)
    
    let timeLeft = 5
    const scoringTimer = setInterval(() => {
      timeLeft--
      setQuestionTimer(timeLeft)
      console.log(`Scoring phase: ${timeLeft}s remaining`)
      
      if (timeLeft <= 0) {
        clearInterval(scoringTimer)
        console.log('Scoring phase complete, ending question round')
        setTimeout(() => endQuestionRound(), 100)
      }
    }, 1000)
    
    questionTimerRef.current = scoringTimer
  }

  const endQuestionRound = () => {
    // Show completion like host
    if (questionData) {
      toast.success(`Question ${questionData.id} completed! Leaderboard updated.`)
    }
    
    // Clean up timer
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current)
    }
    
    // Auto-close after 1 second like host
    setTimeout(() => {
      setShowQuestionRound(false)
      setQuestionData(null)
      setQuestionPhase('prep')
      setQuestionTimer(0)
      setSelectedAnswer(null)
      setHasAnswered(false)
      setIsQuestionActive(false) // Reset the active flag
    }, 1000)
  }

  const handleAnswerSubmit = async () => {
    if (selectedAnswer === null || hasAnswered || !questionData || !playerData) {
      console.log('Cannot submit answer:', { selectedAnswer, hasAnswered, questionData: !!questionData, playerData: !!playerData })
      return
    }
    
    setHasAnswered(true)
    const isCorrect = selectedAnswer === questionData.correctAnswer
    
    console.log('Answer submitted:', { 
      questionId: questionData.id, 
      selectedAnswer, 
      correctAnswer: questionData.correctAnswer, 
      isCorrect 
    })
    
    if (isCorrect) {
      // Update frontend state immediately - no need to wait for database
      setCorrectlyAnsweredNumbers(prev => new Set([...prev, questionData.id]))
      toast.success('Correct answer! +10 points')
      
      // Single database call to update score only
      try {
        const storedPlayer = localStorage.getItem('tambola_player')
        const playerId = storedPlayer ? JSON.parse(storedPlayer).id : playerData.id
        const currentGameId = storedPlayer ? JSON.parse(storedPlayer).gameId : playerData.gameId
        
        if (playerId && currentGameId) {
          // Only record the answer and update score - no additional fetches
          await gameService.recordPlayerAnswer(currentGameId, playerId, questionData.id, selectedAnswer, isCorrect)
          console.log('Score updated in database')
        }
      } catch (error) {
        console.error('Failed to update score:', error)
        toast.error('Failed to save answer, but score counted locally')
      }
    } else {
      toast.error('Wrong answer!')
      
      // Still record wrong answers for tracking
      try {
        const storedPlayer = localStorage.getItem('tambola_player')
        const playerId = storedPlayer ? JSON.parse(storedPlayer).id : playerData.id
        const currentGameId = storedPlayer ? JSON.parse(storedPlayer).gameId : playerData.gameId
        
        if (playerId && currentGameId) {
          await gameService.recordPlayerAnswer(currentGameId, playerId, questionData.id, selectedAnswer, isCorrect)
        }
      } catch (error) {
        console.error('Failed to record wrong answer:', error)
      }
    }
    
    toast('Answer submitted!', { icon: '✅' })
  }

  const generatePlayerTicket = () => {
    // Generate a random Tambola ticket (3x5 grid with 15 numbers)
    const ticket = Array(3).fill(null).map(() => Array(5).fill(null))
    const columns = [
      [1, 10], [11, 20], [21, 30], [31, 40], [41, 50]
    ]

    // Fill 5 numbers per row, ensuring each column constraint
    for (let row = 0; row < 3; row++) {
      const selectedCols = []
      while (selectedCols.length < 5) {
        const col = Math.floor(Math.random() * 5)
        if (!selectedCols.includes(col)) {
          selectedCols.push(col)
        }
      }

      selectedCols.forEach(col => {
        const [min, max] = columns[col]
        let num
        do {
          num = Math.floor(Math.random() * (max - min + 1)) + min
        } while (
          ticket.some(r => r.some(cell => cell === num))
        )
        ticket[row][col] = num
      })
    }

    setPlayerTicket(ticket)
  }

  const handleNumberMark = (number) => {
    if (calledNumbers.includes(number)) {
      setMarkedNumbers(prev => {
        const newSet = new Set(prev)
        if (newSet.has(number)) {
          newSet.delete(number)
        } else {
          newSet.add(number)
        }
        return newSet
      })
    }
  }

  const handleClaimWin = async (pattern) => {
    if (!playerData || !currentRound) {
      alert('Unable to claim win at this time')
      return
    }

    try {
      // Submit answer to Appwrite
      const result = await gameService.submitAnswer(
        currentRound.$id,
        playerData.id,
        true // claiming win
      )

      if (result.success) {
        alert(`Win claimed for ${pattern}! Waiting for host verification...`)
        setWins(prev => [...prev, { pattern, time: new Date() }])
      } else {
        alert(result.error || 'Failed to claim win')
      }
    } catch (error) {
      console.error('Failed to claim win:', error)
      alert('Failed to claim win. Please try again.')
    }
  }

  const handleLeaveGame = () => {
    if (confirm('Are you sure you want to leave the game?')) {
      navigate('/')
    }
  }

  // Simple reload button handler - just check for new numbers
  const handleReload = async () => {
    toast.success('Checking for updates...')
    await checkForNewNumbers()
    toast.success('Updates checked!')
  }

  return (
    <div className="min-h-screen p-4 text-white bg-black">
      <div className="max-w-4xl mx-auto">
        {/* Blockchain Club VITB Header */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Blockchain Club VITB" 
              className="object-contain w-8 h-8"
            />
            <div className="text-center">
              <h1 className="text-lg font-bold gradient-text">Blockchain Club VITB</h1>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="mb-1 text-2xl font-bold text-white">Tambola Player</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {playerData?.name || playerName || 'Player'}
              </span>
              <span className="flex items-center gap-1">
                <GamepadIcon className="w-4 h-4" />
                Game: {playerData?.gameId || gameId || 'Unknown'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleReload}
              className="flex items-center gap-2 px-4 py-2 transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
              title="Reload game state"
            >
              <RotateCcw className="w-4 h-4" />
              Reload
            </button>
            
            <button
              onClick={handleLeaveGame}
              className="flex items-center gap-2 px-4 py-2 transition-colors bg-red-600 rounded-lg hover:bg-red-700"
            >
              <LogOut className="w-4 h-4" />
              Leave Game
            </button>
          </div>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
          <div className="p-4 bg-gray-800 border border-gray-600 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                gameState === 'loading' ? 'bg-blue-500' :
                gameState === 'waiting' ? 'bg-yellow-500' :
                gameState === 'playing' ? 'bg-green-500' : 'bg-gray-500'
              }`}></div>
              <span className="font-medium text-white">
                {gameState === 'loading' ? 'Loading' :
                 gameState === 'waiting' ? 'Waiting' :
                 gameState === 'playing' ? 'Playing' : 'Finished'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-gray-800 border border-gray-600 rounded-xl">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-white">Numbers Called: {calledNumbers.length}/50</span>
            </div>
          </div>

          <div className="p-4 bg-gray-800 border border-gray-600 rounded-xl">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-green-400" />
              <span className="text-white">Players: {gameInfo.totalPlayers}</span>
            </div>
          </div>

          <div className="p-4 bg-gray-800 border border-gray-600 rounded-xl">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-white">Wins: {wins.length}</span>
            </div>
          </div>
        </div>

        {gameState === 'loading' && (
          <div className="p-8 mb-6 text-center bg-gray-800 border border-gray-600 rounded-xl">
            <div className="w-16 h-16 mx-auto mb-4 border-4 rounded-full border-blue-500/30 border-t-blue-500 animate-spin"></div>
            <h2 className="mb-2 text-xl font-semibold text-white">Loading Game...</h2>
            <p className="text-gray-400">Checking game status...</p>
          </div>
        )}

        {gameState === 'waiting' && (
          <div className="p-8 mb-6 text-center bg-gray-800 border border-gray-600 rounded-xl">
            <div className="w-16 h-16 mx-auto mb-4 border-4 rounded-full border-blue-500/30 border-t-blue-500 animate-spin"></div>
            <h2 className="mb-2 text-xl font-semibold text-white">Waiting for Game to Start</h2>
            <p className="text-gray-400">The host will begin the game shortly...</p>
            {gameInfo.totalPlayers > 0 && (
              <p className="mt-2 text-gray-300">{gameInfo.totalPlayers} players joined</p>
            )}
          </div>
        )}

        {gameState === 'playing' && (
          <>
            {/* Question Popup - Show when number is called */}
            {showQuestionRound && questionData && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                <div className="w-full max-w-2xl p-8 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
                  {/* Header with number and timer */}
                  <div className="mb-8 text-center">
                    <div className="mb-4 text-8xl font-bold text-blue-400 animate-pulse">
                      {questionData.id}
                    </div>
                    <div className={`text-4xl font-bold mb-2 ${
                      questionPhase === 'prep' ? 'text-yellow-400' :
                      questionPhase === 'question' ? 'text-green-400' : 'text-blue-400'
                    }`}>
                      {questionTimer}
                    </div>
                    <div className={`text-xl ${
                      questionPhase === 'prep' ? 'text-yellow-300' :
                      questionPhase === 'question' ? 'text-green-300' : 'text-blue-300'
                    }`}>
                      {questionPhase === 'prep' && 'Round starting in...'}
                      {questionPhase === 'question' && 'seconds to answer'}
                      {questionPhase === 'scoring' && 'updating leaderboard...'}
                    </div>
                  </div>

                  {/* Preparation Phase */}
                  {questionPhase === 'prep' && (
                    <div className="py-12 text-center">
                      <div className="mb-6 text-5xl font-bold text-yellow-400">
                        Get Ready!
                      </div>
                      <p className="mb-6 text-xl text-slate-300">
                        Question {questionData.id} is about to begin...
                      </p>
                      <div className="text-lg text-slate-400">
                        {questionData.question}
                      </div>
                    </div>
                  )}

                  {/* Question Phase Content */}
                  {questionPhase === 'question' && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h2 className="mb-6 text-2xl font-bold text-white">
                          Question {questionData.id}
                        </h2>
                        <p className="mb-8 text-xl leading-relaxed text-slate-200">
                          {questionData.question}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
                        {questionData.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedAnswer(index)}
                            disabled={hasAnswered}
                            className={`p-6 rounded-xl border text-left transition-all ${
                              selectedAnswer === index
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : hasAnswered
                                ? 'bg-slate-800 border-slate-600 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700 hover:border-blue-400'
                            }`}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center justify-center w-10 h-10 text-lg font-bold text-white bg-blue-600 rounded-full">
                                {String.fromCharCode(65 + index)}
                              </div>
                              <span className="text-lg">{option}</span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Submit Button */}
                      <button
                        onClick={handleAnswerSubmit}
                        disabled={selectedAnswer === null || hasAnswered}
                        className={`w-full px-6 py-4 text-lg font-semibold rounded-lg transition-colors ${
                          hasAnswered 
                            ? 'bg-slate-600 text-slate-300 cursor-not-allowed' 
                            : selectedAnswer !== null
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {hasAnswered ? '✓ Answer Submitted' : selectedAnswer !== null ? 'Submit Answer' : 'Select an answer first'}
                      </button>
                    </div>
                  )}

                  {/* Scoring Phase */}
                  {questionPhase === 'scoring' && (
                    <div className="py-12 text-center">
                      <div className="w-20 h-20 mx-auto mb-6 border-4 rounded-full border-blue-500/30 border-t-blue-500 animate-spin"></div>
                      <div className="mb-4 text-2xl font-bold text-blue-400">
                        Processing Results...
                      </div>
                      <p className="text-lg text-slate-300">
                        Updating leaderboard and calculating scores
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Round Information */}
            {currentRound && (
              <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
                <div className="p-4 text-center bg-gray-800 border border-gray-600 rounded-lg">
                  <div className="mb-1 text-sm text-gray-400">Round Phase</div>
                  <div className="text-lg font-semibold text-white capitalize">
                    {roundPhase}
                  </div>
                </div>
                <div className="p-4 text-center bg-gray-800 border border-gray-600 rounded-lg">
                  <div className="mb-1 text-sm text-gray-400">Time Left</div>
                  <div className="text-lg font-semibold text-white">
                    {timeLeft}s
                  </div>
                </div>
                <div className="p-4 text-center bg-gray-800 border border-gray-600 rounded-lg">
                  <div className="mb-1 text-sm text-gray-400">Round Number</div>
                  <div className="text-lg font-semibold text-white">
                    {currentRound.roundNumber || 1}
                  </div>
                </div>
              </div>
            )}

            {/* Current Number Display */}
            {currentNumber && (
              <div className="p-6 mb-6 text-center bg-gray-800 border border-gray-600 rounded-xl">
                <div className="mb-2 text-sm text-gray-400">Current Number</div>
                <div className="mb-2 text-6xl font-bold text-yellow-400">
                  {currentNumber}
                </div>
                <div className="text-gray-300">
                  {calledNumbers.length > 1 && (
                    <span>Previous: {calledNumbers[calledNumbers.length - 2]}</span>
                  )}
                </div>
              </div>
            )}

            {/* Complete Board */}
            <div className="mb-6">
              <CompleteBoard 
                calledNumbers={calledNumbers}
                currentNumber={currentNumber}
                processedQuestions={processedQuestions}
              />
            </div>

            {/* Player Ticket */}
            {playerTicket && (
              <div className="mb-6">
                <PlayerTicket
                  ticket={playerTicket}
                  calledNumbers={calledNumbers}
                  markedNumbers={markedNumbers}
                  correctlyAnsweredNumbers={correctlyAnsweredNumbers}
                  onNumberMark={handleNumberMark}
                  onClaimWin={handleClaimWin}
                />
              </div>
            )}

            {/* Recent Numbers */}
            <div className="p-4 bg-gray-800 border border-gray-600 rounded-xl">
              <h3 className="mb-3 font-semibold text-white">Recently Called Numbers</h3>
              <div className="flex flex-wrap gap-2">
                {calledNumbers.slice(-10).reverse().map((number, index) => (
                  <div
                    key={number}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {number}
                  </div>
                ))}
                {calledNumbers.length === 0 && (
                  <div className="text-sm text-gray-400">No numbers called yet</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Wins Display */}
        {wins.length > 0 && (
          <div className="p-4 mt-6 bg-gray-800 border border-gray-600 rounded-xl">
            <h3 className="flex items-center gap-2 mb-3 font-semibold text-white">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Your Wins
            </h3>
            <div className="space-y-2">
              {wins.map((win, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-white">{win.pattern}</span>
                  <span className="text-gray-400">
                    {win.time.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlayerGame
