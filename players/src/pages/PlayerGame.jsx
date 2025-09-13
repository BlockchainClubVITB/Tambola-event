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
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false) // Track real-time connection status
  const questionTimerRef = useRef(null)
  const hasShownRestorationRef = useRef(false) // Track if we've shown restoration message
  const gameSubscriptionRef = useRef(null) // Store real-time subscription

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
    
    // Start initial game polling and set up real-time subscriptions
    startGamePolling()

    return () => {
      // Clean up question timer
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current)
      }
      
      // Clean up real-time subscription
      if (gameSubscriptionRef.current) {
        gameService.unsubscribeFromGameUpdates(gameSubscriptionRef.current)
        setIsRealTimeConnected(false)
      }
      
      // Clean up question state on unmount
      setShowQuestionRound(false)
      setIsQuestionActive(false)
    }
  }, [navigate])

  const startGamePolling = () => {
    // Single initial fetch only - no continuous polling
    fetchGameState()
    
    // Set up real-time subscription for host events
    setupRealTimeSubscription()
  }

  // Set up real-time subscription to listen for host events
  const setupRealTimeSubscription = async () => {
    try {
      const storedPlayer = localStorage.getItem('tambola_player')
      const currentGameId = storedPlayer ? JSON.parse(storedPlayer).gameId : (gameId || playerData?.gameId)
      
      if (!currentGameId) return

      const subscription = gameService.subscribeToGameUpdates(currentGameId, {
        onGameStart: (updatedGame) => {
          console.log('🎯 Real-time: Game started by host!')
          setGameState('playing')
          setGameInfo(prev => ({
            ...prev,
            gameData: updatedGame,
            totalPlayers: updatedGame.playerCount || 0
          }))
          toast.success('🚀 Game started by host! Get ready!', { duration: 4000 })
        },
        
        onNumberCalled: (updatedGame) => {
          console.log('📢 Real-time: New number called by host!')
          handleGameUpdateWithNewNumber(updatedGame)
        },
        
        onGameUpdate: (updatedGame) => {
          console.log('🔄 Real-time: General game update')
          // Update basic game info
          setGameInfo(prev => ({
            ...prev,
            gameData: updatedGame,
            totalPlayers: updatedGame.playerCount || 0
          }))
          
          // Handle status changes
          if (updatedGame.status === 'finished' && gameState !== 'finished') {
            setGameState('finished')
            toast.success('🏆 Game finished by host!')
          } else if (updatedGame.status === 'waiting' && gameState !== 'waiting') {
            setGameState('waiting')
            toast('⏳ Game reset by host...', { icon: '🔄' })
          }
        }
      })

      if (subscription.success) {
        gameSubscriptionRef.current = subscription.subscriptionId
        setIsRealTimeConnected(true)
        console.log('✅ Real-time subscription active!')
        toast.success('🔔 Connected to host for live updates!', { duration: 3000 })
      } else {
        setIsRealTimeConnected(false)
        console.error('❌ Failed to set up real-time subscription:', subscription.error)
        toast.error('⚠️ Real-time updates unavailable, use refresh button')
      }
      
    } catch (error) {
      console.error('❌ Real-time subscription error:', error)
      toast.error('⚠️ Real-time connection failed')
    }
  }

  // Handle game updates with new numbers from real-time events
  const handleGameUpdateWithNewNumber = (updatedGame) => {
    if (updatedGame.calledNumbers) {
      const newCalledNumbers = updatedGame.calledNumbers.map(num => typeof num === 'string' ? parseInt(num) : num)
      const previousCount = calledNumbers.length
      const newCount = newCalledNumbers.length
      
      console.log('🔔 Processing real-time number update:', { previousCount, newCount })
      
      if (newCount > previousCount) {
        // Process new number from host real-time update
        const newNumber = newCalledNumbers[newCalledNumbers.length - 1]
        console.log(`📢 Real-time new number: ${newNumber}`)
        
        // Update state and trigger question immediately
        setCalledNumbers(newCalledNumbers)
        handleNewNumberFromHost(newNumber, newCalledNumbers)
      }
    }
  }

  // Listen for host events (game start, number called)
  const listenForHostEvents = async () => {
    try {
      const storedPlayer = localStorage.getItem('tambola_player')
      const currentGameId = storedPlayer ? JSON.parse(storedPlayer).gameId : (gameId || playerData?.gameId)
      
      if (!currentGameId) return

      // This would be replaced with real-time subscription in production
      // For now, we'll implement a minimal check only when explicitly triggered
      const gameResult = await gameService.getGame(currentGameId)
      if (gameResult.success) {
        const game = gameResult.game
        
        // Update game info
        setGameInfo(prev => ({
          ...prev,
          gameData: game,
          totalPlayers: game.playerCount || 0
        }))
        
        // Check for game state changes
        if (game.status === 'active' && gameState !== 'playing') {
          setGameState('playing')
          toast.success('🎯 Game started by host! Get ready!')
        } else if (game.status === 'finished' && gameState !== 'finished') {
          setGameState('finished')
          toast.success('🏆 Game finished!')
        } else if (game.status === 'waiting' && gameState !== 'waiting') {
          setGameState('waiting')
          toast('⏳ Game reset to waiting...', { icon: '🔄' })
        }
        
        // Check for new numbers only when explicitly called
        if (game.calledNumbers) {
          const newCalledNumbers = game.calledNumbers.map(num => typeof num === 'string' ? parseInt(num) : num)
          const previousCount = calledNumbers.length
          const newCount = newCalledNumbers.length
          
          if (newCount > previousCount) {
            // Process new number from host
            const newNumber = newCalledNumbers[newCalledNumbers.length - 1]
            handleNewNumberFromHost(newNumber, newCalledNumbers)
          }
        }
      }
    } catch (error) {
      console.error('Failed to listen for host events:', error)
      toast.error('Failed to connect to host')
    }
  }

  // Handle new number called by host
  const handleNewNumberFromHost = (newNumber, allNumbers) => {
    if (!processedQuestions.has(newNumber) && !showQuestionRound && !isQuestionActive) {
      console.log(`📢 New number from host: ${newNumber}`)
      setCurrentNumber(newNumber)
      setCalledNumbers(allNumbers)
      setProcessedQuestions(prev => new Set([...prev, newNumber]))
      setIsQuestionActive(true)
      
      // Start question workflow immediately - synchronized with host
      const question = questionsData.find(q => q.id === newNumber)
      if (question) {
        setQuestionData(question)
        setSelectedAnswer(null)
        setHasAnswered(false)
        setShowQuestionRound(true)
        startQuestionWorkflow() // Synchronized 5s+30s+5s workflow
        toast.success(`🎯 Number ${newNumber} called by host!`)
      } else {
        toast.success(`📢 Number ${newNumber} called (No question available)`)
        setIsQuestionActive(false)
      }
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

        // Set initial game state
        if (game.status === 'active') {
          setGameState('playing')
        } else if (game.status === 'finished') {
          setGameState('finished')
        } else {
          setGameState('waiting')
        }

        // Load existing called numbers only on initial fetch
        if (game.calledNumbers && calledNumbers.length === 0) {
          const existingNumbers = game.calledNumbers.map(num => typeof num === 'string' ? parseInt(num) : num)
          setCalledNumbers(existingNumbers)
          
          if (existingNumbers.length > 0) {
            const latestNumber = existingNumbers[existingNumbers.length - 1]
            setCurrentNumber(latestNumber)
            // Mark all existing numbers as processed (restoration)
            setProcessedQuestions(new Set(existingNumbers))
            hasShownRestorationRef.current = true
            toast.success(`Game in progress! Latest number: ${latestNumber}`)
          }
        }

        // Load player's correct answers only once
        if (playerData && game.status === 'active' && correctlyAnsweredNumbers.size === 0) {
          // Note: We're now tracking correct answers locally only since we don't use answers collection
          // Scores are tracked directly in the players table
          console.log('Player answers tracking: Using local state only (no database lookup)')
        }
      }
    } catch (error) {
      console.error('Failed to fetch game state:', error)
    }
  }

  const startQuestionWorkflow = () => {
    console.log('🎯 Starting synchronized question workflow - Phase 1: Preparation (5s)')
    // Phase 1: Exactly 5 seconds preparation (synchronized with host)
    setQuestionPhase('prep')
    setQuestionTimer(5)
    
    // Clear any existing timer
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current)
    }
    
    // Safety timeout to prevent stuck states (total workflow should be 40s max)
    setTimeout(() => {
      if (isQuestionActive) {
        console.warn('⚠️ Question workflow timeout, resetting state')
        setIsQuestionActive(false)
        setShowQuestionRound(false)
      }
    }, 45000) // 45 seconds safety timeout
    
    let timeLeft = 5
    const prepTimer = setInterval(() => {
      timeLeft--
      setQuestionTimer(timeLeft)
      
      if (timeLeft <= 0) {
        clearInterval(prepTimer)
        console.log('✅ Prep phase complete, starting question phase')
        startQuestionPhase()
      }
    }, 1000)
    
    questionTimerRef.current = prepTimer
  }

  const startQuestionPhase = () => {
    console.log('❓ Starting question phase (30s) - synchronized with host')
    // Phase 2: Exactly 30 seconds question (synchronized with host)
    setQuestionPhase('question')
    setQuestionTimer(30)
    
    let timeLeft = 30
    const questionTimer = setInterval(() => {
      timeLeft--
      setQuestionTimer(timeLeft)
      
      if (timeLeft <= 0) {
        clearInterval(questionTimer)
        if (!hasAnswered) {
          toast.error('⏰ Time up! No answer submitted')
        }
        console.log('✅ Question phase complete, starting scoring phase')
        startScoringPhase()
      }
    }, 1000)
    
    questionTimerRef.current = questionTimer
  }

  const startScoringPhase = () => {
    console.log('📊 Starting scoring phase (5s) - synchronized with host')
    // Phase 3: Exactly 5 seconds scoring (synchronized with host)
    setQuestionPhase('scoring')
    setQuestionTimer(5)
    
    let timeLeft = 5
    const scoringTimer = setInterval(() => {
      timeLeft--
      setQuestionTimer(timeLeft)
      
      if (timeLeft <= 0) {
        clearInterval(scoringTimer)
        console.log('✅ Scoring phase complete, ending question round')
        setTimeout(() => endQuestionRound(), 100)
      }
    }, 1000)
    
    questionTimerRef.current = scoringTimer
  }

  const endQuestionRound = () => {
    // Show completion synchronized with host
    if (questionData) {
      toast.success(`✅ Question ${questionData.id} completed! Leaderboard updated.`)
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
      console.log('🔄 Question round ended, ready for next number')
    }, 1000)
  }

  const handleAnswerSubmit = async () => {
    if (selectedAnswer === null || hasAnswered || !questionData || !playerData) {
      console.log('Cannot submit answer:', { selectedAnswer, hasAnswered, questionData: !!questionData, playerData: !!playerData })
      return
    }
    
    setHasAnswered(true)
    const isCorrect = selectedAnswer === questionData.correctAnswer
    
    console.log('🎯 Answer submitted:', { 
      questionId: questionData.id, 
      selectedAnswer, 
      correctAnswer: questionData.correctAnswer, 
      isCorrect 
    })
    
    // Immediate local feedback - no waiting for database
    if (isCorrect) {
      // Update frontend state immediately
      setCorrectlyAnsweredNumbers(prev => new Set([...prev, questionData.id]))
      toast.success('🎉 Correct answer! +10 points')
      
      // Only send database request for correct answers (async, no waiting)
      setTimeout(async () => {
        try {
          const storedPlayer = localStorage.getItem('tambola_player')
          const playerId = storedPlayer ? JSON.parse(storedPlayer).id : playerData.id
          const currentGameId = storedPlayer ? JSON.parse(storedPlayer).gameId : playerData.gameId
          
          if (playerId && currentGameId) {
            console.log('💾 Saving correct answer and updating score...')
            const result = await gameService.recordPlayerAnswer(currentGameId, playerId, questionData.id, selectedAnswer, isCorrect)
            if (result.success) {
              console.log('✅ Correct answer saved and score updated in database')
              toast.success(`💾 Score saved! Total: ${result.newScore || 'N/A'} points`)
            } else {
              console.error('❌ Failed to save answer:', result.error)
            }
          }
        } catch (error) {
          console.error('❌ Failed to save correct answer:', error)
          // Don't show error to user, score is already counted locally
        }
      }, 100) // Small delay to avoid blocking UI
    } else {
      // Wrong answer - immediate feedback, no database call needed
      toast.error('❌ Wrong answer! Better luck next time.')
      console.log('❌ Wrong answer, not sending to database')
    }
    
    // Show submission confirmation
    toast('✅ Answer submitted!', { icon: '📝', duration: 2000 })
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

  // Manual refresh button handler - check for host events and reconnect real-time
  const handleReload = async () => {
    toast.success('🔄 Refreshing connection to host...')
    
    // Re-establish real-time connection if lost
    if (!gameSubscriptionRef.current) {
      await setupRealTimeSubscription()
    }
    
    // Also do a manual check as fallback
    await listenForHostEvents()
    toast.success('✅ Connection refreshed!')
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
              title="Refresh connection to host"
            >
              <RotateCcw className="w-4 h-4" />
              Refresh
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
              <span className="text-white">Numbers: {calledNumbers.length}/50</span>
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
              <div className={`w-3 h-3 rounded-full ${
                isRealTimeConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              <span className="font-medium text-white">
                {isRealTimeConnected ? 'Live Connected' : 'Offline Mode'}
              </span>
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
                <div className="w-full max-w-2xl p-8 border shadow-2xl bg-slate-900 border-slate-700 rounded-xl">
                  {/* Header with number and timer */}
                  <div className="mb-8 text-center">
                    <div className="mb-4 font-bold text-blue-400 text-8xl animate-pulse">
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

                      {/* Waiting message after answer submitted */}
                      {hasAnswered && (
                        <div className="p-4 mt-4 text-center border rounded-lg bg-blue-600/20 border-blue-500/30">
                          <div className="mb-2 text-blue-400">✓ Answer submitted successfully!</div>
                          <div className="text-sm text-blue-300">
                            Waiting for other players to finish... ({questionTimer}s remaining)
                          </div>
                        </div>
                      )}
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
                      {hasAnswered && (
                        <div className="mt-4 text-sm text-green-400">
                          ✓ Your answer has been recorded
                        </div>
                      )}
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
                selectedNumbers={calledNumbers}
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
