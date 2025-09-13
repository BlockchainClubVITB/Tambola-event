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
import { checkAllWinningConditions, getWinConditionInfo } from '../utils/winningConditions'
import questionsData from '../data/questions.json'

const PlayerGame = ({ gameId, playerName, isJoined }) => {
  const navigate = useNavigate()
  const [gameState, setGameState] = useState('loading') // loading, waiting, playing, finished
  const [currentNumber, setCurrentNumber] = useState(null)
  const [calledNumbers, setCalledNumbers] = useState([])
  const [playerTicket, setPlayerTicket] = useState(null)
  const [markedNumbers, setMarkedNumbers] = useState(new Set())
  const [correctlyAnsweredNumbers, setCorrectlyAnsweredNumbers] = useState(new Set())
  const [incorrectlyAnsweredNumbers, setIncorrectlyAnsweredNumbers] = useState(new Set())
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
  const [playerWins, setPlayerWins] = useState({}) // Track player's winning conditions
  const [showRulesPopup, setShowRulesPopup] = useState(false) // Track rules popup visibility
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
      const newCorrectNumbers = new Set([...correctlyAnsweredNumbers, questionData.id])
      setCorrectlyAnsweredNumbers(newCorrectNumbers)
      
      // Check for winning conditions and get new wins
      const newWins = await checkWinningConditions(newCorrectNumbers)
      
      toast.success('🎉 Correct answer! +10 points')
      
      // OPTIMIZED: Single database request with score + wins + correctNumbers (async, non-blocking)
      setTimeout(async () => {
        try {
          const storedPlayer = localStorage.getItem('tambola_player')
          const playerId = storedPlayer ? JSON.parse(storedPlayer).id : playerData.id
          const currentGameId = storedPlayer ? JSON.parse(storedPlayer).gameId : playerData.gameId
          
          if (playerId && currentGameId) {
            console.log('💾 OPTIMIZED: Saving answer, score, and wins in single request...')
            const result = await gameService.recordPlayerAnswer(
              currentGameId, 
              playerId, 
              questionData.id, 
              selectedAnswer, 
              isCorrect,
              newWins, // Pass new wins for single update
              newCorrectNumbers // Pass correct numbers for single update
            )
            
            if (result.success) {
              console.log('✅ OPTIMIZED: All player data updated in single request')
              toast.success(`💾 Progress saved! Score: ${result.newScore || 'N/A'} points`)
              
              // Update local state with only the wins that were actually awarded
              if (result.newWins && Object.keys(result.newWins).length > 0) {
                setPlayerWins(prev => ({ ...prev, ...result.newWins }))
                
                // Show win notifications for actually awarded wins
                const winInfo = getWinConditionInfo()
                for (const [condition, won] of Object.entries(result.newWins)) {
                  if (won) {
                    const info = winInfo[condition]
                    toast.success(`🏆 ${info.icon} ${info.name} - ${info.description}!`, {
                      duration: 6000,
                      style: {
                        background: '#059669',
                        color: 'white',
                        fontWeight: 'bold'
                      }
                    })
                  }
                }
              }
              
              // Show notifications for any denied wins (already won by others)
              if (result.deniedWins && result.deniedWins.length > 0) {
                const winInfo = getWinConditionInfo()
                for (const condition of result.deniedWins) {
                  const info = winInfo[condition]
                  toast(`🚫 ${info.name} already won by another player!`, {
                    duration: 4000,
                    style: {
                      background: '#DC2626',
                      color: 'white',
                    }
                  })
                }
              }
            } else {
              console.error('❌ Failed to save progress:', result.error)
              // Auto-refresh fallback on failure
              toast.error('⚠️ Save failed, will retry automatically')
              setTimeout(() => handleReload(), 2000)
            }
          }
        } catch (error) {
          console.error('❌ Failed to save correct answer:', error)
          // Auto-refresh fallback on error
          toast.error('⚠️ Connection issue, refreshing...')
          setTimeout(() => handleReload(), 3000)
        }
      }, 100) // Small delay to avoid blocking UI
    } else {
      // Wrong answer - immediate feedback, no database call needed
      toast.error('❌ Wrong answer! Better luck next time.')
      console.log('❌ Wrong answer, not sending to database')
      
      // Track incorrect answer for Early Adopter condition
      setIncorrectlyAnsweredNumbers(prev => new Set([...prev, questionData.id]))
    }
    
    // Show submission confirmation
    toast('✅ Answer submitted!', { icon: '📝', duration: 2000 })
  }

  // Check winning conditions after each correct answer (with local caching)
  const checkWinningConditions = async (correctNumbers) => {
    try {
      // LOCAL CHECK FIRST - avoid redundant database calls
      const newWins = checkAllWinningConditions(correctNumbers, playerWins)
      
      if (Object.keys(newWins).length > 0) {
        console.log('🏆 Potential winning conditions achieved:', newWins)
        
        // DON'T update local state immediately - wait for server confirmation
        // This ensures only actual wins (not denied ones) are shown
        
        return newWins // Return for server validation
      }
      
      return {} // No new wins
    } catch (error) {
      console.error('❌ Error checking winning conditions:', error)
      return {}
    }
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

  // Calculate progress for each winning condition
  const calculateWinningProgress = () => {
    const correctNumbers = Array.from(correctlyAnsweredNumbers)
    const incorrectNumbers = Array.from(incorrectlyAnsweredNumbers)
    
    // Early Adopter - first 5 questions must ALL be correct (1-5), if any wrong from 1-5, permanently blocked
    const firstFiveQuestions = [1, 2, 3, 4, 5]
    const hasIncorrectInFirstFive = firstFiveQuestions.some(num => incorrectNumbers.includes(num))
    
    let earlyAdopterProgress = 0
    let earlyAdopterBlocked = false
    
    if (hasIncorrectInFirstFive) {
      // Permanently blocked - any wrong answer in first 5 questions
      earlyAdopterBlocked = true
      earlyAdopterProgress = 0
    } else {
      // Count correct answers from first 5 questions only
      earlyAdopterProgress = firstFiveQuestions.filter(num => correctNumbers.includes(num)).length
    }
    
    // Gas Saver - First Row (1-10)
    const firstRowNumbers = correctNumbers.filter(num => num >= 1 && num <= 10)
    const gasSaverProgress = firstRowNumbers.length
    
    // Corner Nodes - 4 Corners (1,10,41,50)
    const cornerNumbers = [1, 10, 41, 50]
    const cornerProgress = cornerNumbers.filter(num => correctNumbers.includes(num)).length
    
    // Miner of the Day - Complete 2 rows
    const rows = [
      [1,2,3,4,5,6,7,8,9,10],
      [11,12,13,14,15,16,17,18,19,20],
      [21,22,23,24,25,26,27,28,29,30],
      [31,32,33,34,35,36,37,38,39,40],
      [41,42,43,44,45,46,47,48,49,50]
    ]
    const completedRows = rows.filter(row => 
      row.every(num => correctNumbers.includes(num))
    ).length
    
    // Full Blockchain - all 50 numbers
    const fullBlockchainProgress = correctNumbers.length
    
    return {
      earlyAdopter: { 
        current: earlyAdopterProgress, 
        total: 5, 
        blocked: earlyAdopterBlocked,
        status: earlyAdopterBlocked ? 'blocked' : (earlyAdopterProgress === 5 ? 'completed' : 'active')
      },
      gasSaver: { current: gasSaverProgress, total: 10 },
      cornerNodes: { current: cornerProgress, total: 4 },
      minerOfTheDay: { current: completedRows, total: 2 },
      fullBlockchain: { current: fullBlockchainProgress, total: 50 }
    }
  }

  // Enhanced manual refresh with auto-retry and fallback mechanisms
  const handleReload = async () => {
    try {
      toast.success('🔄 Refreshing connection to host...')
      
      // Re-establish real-time connection if lost
      if (!gameSubscriptionRef.current || !isRealTimeConnected) {
        console.log('🔄 Re-establishing real-time connection...')
        await setupRealTimeSubscription()
      }
      
      // Manual game state check as fallback
      console.log('🔄 Performing manual game state check...')
      await listenForHostEvents()
      
      // Refresh leaderboard if available
      try {
        await fetchGameState()
        console.log('✅ Game state refreshed successfully')
      } catch (error) {
        console.warn('⚠️ Game state refresh had issues:', error)
      }
      
      toast.success('✅ Connection refreshed!')
    } catch (error) {
      console.error('❌ Refresh failed:', error)
      toast.error('❌ Refresh failed, retrying in 5 seconds...')
      
      // Auto-retry on failure
      setTimeout(() => {
        console.log('🔄 Auto-retrying refresh...')
        handleReload()
      }, 5000)
    }
  }

  // Auto-refresh fallback when real-time connection fails
  useEffect(() => {
    let autoRefreshInterval

    if (!isRealTimeConnected && gameState === 'playing') {
      console.log('⚠️ Real-time disconnected, starting auto-refresh fallback')
      toast('📡 Real-time lost, using auto-refresh mode', { 
        icon: '⚠️',
        duration: 4000 
      })
      
      // Auto-refresh every 10 seconds when real-time is down
      autoRefreshInterval = setInterval(() => {
        console.log('🔄 Auto-refresh triggered (real-time fallback)')
        listenForHostEvents()
      }, 10000)
    }

    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval)
      }
    }
  }, [isRealTimeConnected, gameState])

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-2 sm:p-4 lg:p-6 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header with Logo, Club Name and Decrypt2win */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <img 
              src="/logo.png" 
              alt="Blockchain Club VITB" 
              className="object-contain w-6 h-6 sm:w-8 sm:h-8"
            />
            <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-gray-300 to-white bg-clip-text text-transparent" style={{fontFamily: 'Fira Code, monospace'}}>
              Blockchain Club VITB
            </h1>
          </div>
          <div className="text-right">
            <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-gray-300 to-white bg-clip-text text-transparent" style={{fontFamily: 'Fira Code, monospace'}}>
              Decrypt2win
            </h2>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="mb-1 text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate" style={{fontFamily: 'Fira Code, monospace'}}>Player</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
              <span className="flex items-center gap-1 truncate">
                <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{playerData?.name || playerName || 'Player'}</span>
              </span>
              <span className="flex items-center gap-1 truncate">
                <GamepadIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Game: {playerData?.gameId || gameId || 'Unknown'}</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <button
              onClick={() => setShowRulesPopup(true)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-colors bg-green-600 rounded-lg hover:bg-green-700"
              title="View game rules and winning conditions"
            >
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Rules</span>
            </button>
            
            <button
              onClick={handleReload}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-colors bg-gray-700 rounded-lg hover:bg-gray-600"
              title="Refresh connection to host"
            >
              <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Refresh</span>
            </button>
            
            <button
              onClick={handleLeaveGame}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-colors bg-red-600 rounded-lg hover:bg-red-700"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Leave</span>
            </button>
          </div>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                gameState === 'loading' ? 'bg-gray-500' :
                gameState === 'waiting' ? 'bg-yellow-500' :
                gameState === 'playing' ? 'bg-green-500' : 'bg-gray-500'
              }`}></div>
              <span className="font-medium text-white text-xs sm:text-sm">
                {gameState === 'loading' ? 'Loading' :
                 gameState === 'waiting' ? 'Waiting' :
                 gameState === 'playing' ? 'Playing' : 'Finished'}
              </span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 flex-shrink-0" />
              <span className="text-white text-xs sm:text-sm">Numbers: {calledNumbers.length}/50</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
              <span className="text-white text-xs sm:text-sm">Players: {gameInfo.totalPlayers}</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                isRealTimeConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              <span className="font-medium text-white text-xs sm:text-sm">
                {isRealTimeConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {gameState === 'loading' && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 border-4 rounded-full border-gray-600/30 border-t-gray-400 animate-spin"></div>
            <h2 className="mb-2 text-lg sm:text-xl font-semibold text-white">Loading Game...</h2>
            <p className="text-gray-400 text-sm sm:text-base">Checking game status...</p>
          </div>
        )}

        {gameState === 'waiting' && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 border-4 rounded-full border-gray-600/30 border-t-gray-400 animate-spin"></div>
            <h2 className="mb-2 text-lg sm:text-xl font-semibold text-white">Waiting for Game to Start</h2>
            <p className="text-gray-400 text-sm sm:text-base">The host will begin the game shortly...</p>
            {gameInfo.totalPlayers > 0 && (
              <p className="mt-2 text-gray-300 text-sm sm:text-base">{gameInfo.totalPlayers} players joined</p>
            )}
            <button
              onClick={() => setShowRulesPopup(true)}
              className="px-3 sm:px-4 py-2 mt-3 sm:mt-4 text-sm sm:text-base text-white transition-all duration-300 bg-gradient-to-r from-gray-700 to-black hover:from-gray-600 hover:to-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Game Rules & Winning Types
            </button>
          </div>
        )}

        {/* Game Rules Popup - Available in all states */}
        {showRulesPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-sm">
            <div className="w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6 lg:p-8 border shadow-2xl bg-slate-900 border-slate-700 rounded-xl">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Game Rules & Winning Types</h2>
                <button
                  onClick={() => setShowRulesPopup(false)}
                  className="p-1.5 sm:p-2 text-gray-400 transition-colors hover:text-white"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                {/* How to Play */}
                <div className="p-3 sm:p-4 lg:p-6 border rounded-lg bg-slate-800 border-slate-600">
                  <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold text-gray-300">How to Play</h3>
                  <div className="space-y-2 sm:space-y-3 text-gray-300 text-sm sm:text-base">
                    <p>1. You will receive a digital Tambola ticket with 50 numbers (1-50)</p>
                    <p>2. When a number is called, a question will appear on your screen</p>
                    <p>3. Answer the question correctly to mark that number on your ticket</p>
                    <p>4. Numbers marked correctly will be highlighted in green</p>
                    <p>5. Complete specific patterns to win different prizes</p>
                    <p>6. The game continues until all winning conditions are achieved</p>
                  </div>
                </div>

                {/* Board Layout */}
                <div className="p-6 border rounded-lg bg-slate-800 border-slate-600">
                  <h3 className="mb-4 text-xl font-semibold text-purple-400">Board Layout</h3>
                  <div className="space-y-2 text-gray-300">
                    <p>Your ticket contains 50 numbers arranged in 5 rows:</p>
                    <div className="grid grid-cols-5 gap-2 mt-4 text-center">
                      <div className="p-2 text-xs border rounded bg-slate-700 border-slate-500">Row 1: 1-10</div>
                      <div className="p-2 text-xs border rounded bg-slate-700 border-slate-500">Row 2: 11-20</div>
                      <div className="p-2 text-xs border rounded bg-slate-700 border-slate-500">Row 3: 21-30</div>
                      <div className="p-2 text-xs border rounded bg-slate-700 border-slate-500">Row 4: 31-40</div>
                      <div className="p-2 text-xs border rounded bg-slate-700 border-slate-500">Row 5: 41-50</div>
                    </div>
                  </div>
                </div>

                {/* Scoring */}
                <div className="p-6 border rounded-lg bg-slate-800 border-slate-600">
                  <h3 className="mb-4 text-xl font-semibold text-red-400">Scoring System</h3>
                  <div className="space-y-2 text-gray-300">
                    <p>• Answer questions correctly to mark numbers on your ticket</p>
                    <p>• Incorrect answers will not mark the number</p>
                    <p>• You can only mark a number if you answer its question correctly</p>
                    <p>• <strong>Only the FIRST player to complete each winning condition wins that prize</strong></p>
                    <p>• Once a condition is won by someone, it cannot be won again</p>
                    <p>• Race against other players to be the first to complete each pattern!</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowRulesPopup(false)}
                  className="px-6 py-3 text-white transition-all duration-300 bg-gray-700 rounded-lg hover:bg-gray-600"
                >
                  Got It!
                </button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <>
            {/* Question Popup - Show when number is called */}
            {showQuestionRound && questionData && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-sm">
                <div className="w-full max-w-sm sm:max-w-lg lg:max-w-2xl p-4 sm:p-6 lg:p-8 border shadow-2xl bg-slate-900 border-slate-700 rounded-xl max-h-[95vh] overflow-y-auto">
                  {/* Header with number and timer */}
                  <div className="mb-4 sm:mb-6 lg:mb-8 text-center">
                    <div className="mb-2 sm:mb-4 font-bold text-gray-300 text-4xl sm:text-6xl lg:text-8xl animate-pulse font-mono">
                      {questionData.id}
                    </div>
                    <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 font-mono ${
                      questionPhase === 'prep' ? 'text-yellow-400' :
                      questionPhase === 'question' ? 'text-green-400' : 'text-gray-300'
                    }`}>
                      {questionTimer}
                    </div>
                    <div className={`text-sm sm:text-lg lg:text-xl ${
                      questionPhase === 'prep' ? 'text-yellow-300' :
                      questionPhase === 'question' ? 'text-green-300' : 'text-gray-400'
                    }`}>
                      {questionPhase === 'prep' && 'Round starting in...'}
                      {questionPhase === 'question' && 'seconds to answer'}
                      {questionPhase === 'scoring' && 'updating leaderboard...'}
                    </div>
                  </div>

                  {/* Preparation Phase */}
                  {questionPhase === 'prep' && (
                    <div className="py-6 sm:py-8 lg:py-12 text-center">
                      <div className="mb-4 sm:mb-6 text-2xl sm:text-4xl lg:text-5xl font-bold text-yellow-400">
                        Get Ready!
                      </div>
                      <p className="mb-4 sm:mb-6 text-base sm:text-lg lg:text-xl text-slate-300">
                        Question {questionData.id} is about to begin...
                      </p>
                      <div className="text-sm sm:text-base lg:text-lg text-slate-400 px-2">
                        {questionData.question}
                      </div>
                    </div>
                  )}

                  {/* Question Phase Content */}
                  {questionPhase === 'question' && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="text-center">
                        <h2 className="mb-3 sm:mb-4 lg:mb-6 text-lg sm:text-xl lg:text-2xl font-bold text-white">
                          Question {questionData.id}
                        </h2>
                        <p className="mb-4 sm:mb-6 lg:mb-8 text-base sm:text-lg lg:text-xl leading-relaxed text-slate-200 px-2">
                          {questionData.question}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        {questionData.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedAnswer(index)}
                            disabled={hasAnswered}
                            className={`p-3 sm:p-4 lg:p-6 rounded-xl border text-left transition-all touch-manipulation min-h-[3rem] sm:min-h-[3.5rem] ${
                              selectedAnswer === index
                                ? 'bg-gray-600 border-gray-500 text-white'
                                : hasAnswered
                                ? 'bg-slate-800 border-slate-600 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700 hover:border-gray-400 active:bg-slate-600'
                            }`}
                          >
                            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                              <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-xs sm:text-sm lg:text-lg font-bold text-white bg-blue-600 rounded-full flex-shrink-0">
                                {String.fromCharCode(65 + index)}
                              </div>
                              <span className="text-sm sm:text-base lg:text-lg break-words">{option}</span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Submit Button */}
                      <button
                        onClick={handleAnswerSubmit}
                        disabled={selectedAnswer === null || hasAnswered}
                        className={`w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-lg transition-colors touch-manipulation min-h-[3rem] sm:min-h-[3.5rem] ${
                          hasAnswered 
                            ? 'bg-slate-600 text-slate-300 cursor-not-allowed' 
                            : selectedAnswer !== null
                            ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white' 
                            : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {hasAnswered ? '✓ Answer Submitted' : selectedAnswer !== null ? 'Submit Answer' : 'Select an answer first'}
                      </button>

                      {/* Waiting message after answer submitted */}
                      {hasAnswered && (
                        <div className="p-3 sm:p-4 mt-3 sm:mt-4 text-center border rounded-lg bg-blue-600/20 border-blue-500/30">
                          <div className="mb-1 sm:mb-2 text-sm sm:text-base text-blue-400">✓ Answer submitted successfully!</div>
                          <div className="text-xs sm:text-sm text-blue-300">
                            Waiting for other players to finish... ({questionTimer}s remaining)
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Scoring Phase */}
                  {questionPhase === 'scoring' && (
                    <div className="py-6 sm:py-8 lg:py-12 text-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto mb-4 sm:mb-6 border-4 rounded-full border-blue-500/30 border-t-blue-500 animate-spin"></div>
                      <div className="mb-2 sm:mb-4 text-lg sm:text-xl lg:text-2xl font-bold text-blue-400">
                        Processing Results...
                      </div>
                      <p className="text-sm sm:text-base lg:text-lg text-slate-300 px-2">
                        Updating leaderboard and calculating scores
                      </p>
                      {hasAnswered && (
                        <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-green-400">
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
                correctlyAnsweredNumbers={correctlyAnsweredNumbers}
                playerWins={playerWins}
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

            {/* Winning Conditions Progress */}
            <div className="mb-6 p-4 bg-gray-800 border border-gray-600 rounded-xl">
              <h3 className="mb-4 font-semibold text-white font-mono">Winning Conditions Progress</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(() => {
                  const progress = calculateWinningProgress()
                  return (
                    <>
                      <div className={`p-3 bg-gray-700 rounded-lg border ${progress.earlyAdopter.blocked ? 'border-red-500 bg-red-900/20' : 'border-gray-600'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-semibold text-sm ${progress.earlyAdopter.blocked ? 'text-red-400' : 'text-yellow-400'}`}>
                            {progress.earlyAdopter.blocked ? '❌' : '⚡'} Early Adopter
                          </span>
                          <span className="text-xs text-gray-400">
                            {progress.earlyAdopter.blocked ? 'BLOCKED' : `${progress.earlyAdopter.current}/${progress.earlyAdopter.total} numbers`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              progress.earlyAdopter.blocked ? 'bg-red-500' : 'bg-yellow-400'
                            }`}
                            style={{ 
                              width: progress.earlyAdopter.blocked ? '100%' : `${(progress.earlyAdopter.current / progress.earlyAdopter.total) * 100}%` 
                            }}
                          ></div>
                        </div>
                        {progress.earlyAdopter.blocked && (
                          <div className="text-xs text-red-300 mt-1">
                            Failed question 1-5. Cannot achieve Early Adopter.
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-blue-400 font-semibold text-sm">⛽ Gas Saver</span>
                          <span className="text-xs text-gray-400">First Row (1-10)</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-blue-400 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${(progress.gasSaver.current / progress.gasSaver.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-purple-400 font-semibold text-sm">📐 Corner Nodes</span>
                          <span className="text-xs text-gray-400">4 Corners (1,10,41,50)</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-purple-400 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${(progress.cornerNodes.current / progress.cornerNodes.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-orange-400 font-semibold text-sm">⛏️ Miner of the Day</span>
                          <span className="text-xs text-gray-400">{progress.minerOfTheDay.current}/{progress.minerOfTheDay.total} rows</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-orange-400 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${(progress.minerOfTheDay.current / progress.minerOfTheDay.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-700 rounded-lg border border-gray-600 sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-green-400 font-semibold text-sm">🏆 Full Blockchain</span>
                          <span className="text-xs text-gray-400">{progress.fullBlockchain.current}/{progress.fullBlockchain.total} numbers</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-green-400 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${(progress.fullBlockchain.current / progress.fullBlockchain.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

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
