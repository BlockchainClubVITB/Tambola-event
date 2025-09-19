import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import CompleteBoard from '../components/CompleteBoard'
import Leaderboard from '../components/Leaderboard'
import WinnerPanel from '../components/WinnerPanel'
import QuestionRound from '../components/QuestionRound'
import { gameService } from '../utils/gameService'
import { getWinConditionInfo, checkAllWinningConditions } from '../utils/winningConditions'
import { Share2, Users, Settings, Download, Play, Pause, RotateCcw, Clock, ArrowLeft, Trophy, CheckCircle, QrCode } from 'lucide-react'

const HostDashboard = () => {
  // Game State
  const [gameId, setGameId] = useState(null)
  const [gameDoc, setGameDoc] = useState(null)
  const [hostName, setHostName] = useState('')
  const [gameState, setGameState] = useState('waiting') // 'waiting', 'active', 'paused', 'ended'
  const [selectedNumbers, setSelectedNumbers] = useState([])
  const [currentNumber, setCurrentNumber] = useState(null)
  const [currentRound, setCurrentRound] = useState(null)
  const [gameTime, setGameTime] = useState(0)
  const [gameTimerRunning, setGameTimerRunning] = useState(false)
  const [players, setPlayers] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [roundPhase, setRoundPhase] = useState('idle') // 'idle', 'prepare', 'active', 'scoring'
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [roundStarted, setRoundStarted] = useState(false)
  
  // Question Round State
  const [showQuestionRound, setShowQuestionRound] = useState(false)
  const [selectedQuestionNumber, setSelectedQuestionNumber] = useState(null)
  
  // UI State
  const [showQRPopup, setShowQRPopup] = useState(false)
  const [winnersCurrentPage, setWinnersCurrentPage] = useState(1)
  const [allWinners, setAllWinners] = useState({})
  const [loadingWinners, setLoadingWinners] = useState(false)
  const [winnersLastUpdate, setWinnersLastUpdate] = useState(null)
  const winnersPerPage = 10

  // Verification State
  const [pendingVerifications, setPendingVerifications] = useState([])
  const [loadingVerifications, setLoadingVerifications] = useState(false)

  // Polling interval
  const pollIntervalRef = useRef(null)
  const [lastGameStateHash, setLastGameStateHash] = useState('') // Cache to avoid unnecessary updates
  const [lastPlayersCount, setLastPlayersCount] = useState(0) // Track player count changes
  
  // Cache for data optimization
  const [dataCache, setDataCache] = useState({
    leaderboard: null,
    winners: null,
    lastUpdate: 0,
    gameHash: ''
  })
  
  // Cache duration (30 seconds)
  const CACHE_DURATION = 30000
  
  // Navigation
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Calculate total winners
  const totalWinners = Object.values(allWinners).reduce((total, winners) => total + (winners?.length || 0), 0)

  // Winners refresh function
  const refreshWinnersData = async () => {
    if (!gameId) return
    
    setLoadingWinners(true)
    try {
      const result = await gameService.getAllWinners(gameId)
      if (result.success) {
        setAllWinners(result.winners)
        setWinnersLastUpdate(new Date())
        console.log('🏆 Winners data refreshed:', result.winners)
      } else {
        console.error('Failed to refresh winners:', result.error)
      }
    } catch (error) {
      console.error('Error refreshing winners:', error)
    } finally {
      setLoadingWinners(false)
    }
  }

  const refreshVerificationRequests = async () => {
    if (!gameId) return
    
    setLoadingVerifications(true)
    try {
      const result = await gameService.getPendingVerificationRequests(gameId)
      if (result.success) {
        setPendingVerifications(result.requests)
        console.log('📝 Verification requests refreshed:', result.requests)
      } else {
        if (result.fallback) {
          console.log('📝 Verification system not available, no pending requests')
          setPendingVerifications([])
        } else {
          console.error('Failed to refresh verification requests:', result.error)
        }
      }
    } catch (error) {
      console.error('Error refreshing verification requests:', error)
      setPendingVerifications([])
    } finally {
      setLoadingVerifications(false)
    }
  }

  const handleVerificationDecision = async (verificationId, decision, reason = null) => {
    try {
      const result = await gameService.updateVerificationRequest(
        verificationId, 
        decision, 
        hostName, // Using hostName as hostId
        reason
      )
      
      if (result.success) {
        console.log(`✅ Verification ${decision}:`, result.verificationRequest)
        // Refresh both verification requests and winners data
        await Promise.all([
          refreshVerificationRequests(),
          refreshWinnersData()
        ])
      } else {
        if (result.fallback) {
          console.log('📝 Verification system not available, using fallback')
          // If this was an approval and we have fallback, try to declare winner directly
          if (decision === 'approved') {
            // We need to extract player and condition info from somewhere
            console.log('⚠️ Cannot complete verification without verification system')
          }
        } else {
          console.error(`Failed to ${decision} verification:`, result.error)
        }
      }
    } catch (error) {
      console.error(`Error ${decision} verification:`, error)
    }
  }

  // Initialize game on component mount
  useEffect(() => {
    initializeGame()
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  // Game Timer - runs when game is active
  useEffect(() => {
    let gameTimerInterval = null
    
    if (gameTimerRunning && gameState === 'active') {
      gameTimerInterval = setInterval(() => {
        setGameTime(prevTime => prevTime + 1)
      }, 1000) // Update every second
    }
    
    return () => {
      if (gameTimerInterval) {
        clearInterval(gameTimerInterval)
      }
    }
  }, [gameTimerRunning, gameState])

  // Start polling for updates
  const startPolling = () => {
    // Remove continuous polling - only manual refresh now
    console.log('Continuous polling disabled - use manual refresh for updates')
  }

  // Fetch only basic game updates (called when needed)
  const fetchGameUpdates = async () => {
    try {
      // Get current game state
      const gameResult = await gameService.getGame(gameId)
      if (gameResult.success) {
        const game = gameResult.game
        setGameDoc(game)
        setGameState(game.status)
        setSelectedNumbers(game.calledNumbers || [])
        setCurrentNumber(game.currentNumber)
        
        // If game is active and timer isn't running, start it
        if (game.status === 'active' && !gameTimerRunning) {
          setGameTimerRunning(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch game updates:', error)
    }
  }

  // Enhanced leaderboard refresh with error handling and auto-retry
  const refreshLeaderboard = async (showToast = true) => {
    try {
      const leaderboardResult = await gameService.getLeaderboard(gameId)
      if (leaderboardResult.success) {
        setLeaderboard(leaderboardResult.players)
        if (showToast) toast.success('Leaderboard updated!')
        return true
      } else {
        console.error('Failed to refresh leaderboard:', leaderboardResult.error)
        if (showToast) toast.error('Failed to refresh leaderboard')
        return false
      }
    } catch (error) {
      console.error('Failed to refresh leaderboard:', error)
      if (showToast) toast.error('Failed to refresh leaderboard')
      
      // Auto-retry on error
      setTimeout(() => {
        console.log('🔄 Auto-retrying leaderboard refresh...')
        refreshLeaderboard(false) // Retry without toast
      }, 3000)
      
      return false
    }
  }

  // Optimized refresh function with caching - fetches all data in minimal requests
  const refreshAllData = async (showToast = true, forceRefresh = false) => {
    try {
      const now = Date.now()
      
      // Check cache first (unless forced refresh)
      if (!forceRefresh && dataCache.lastUpdate && (now - dataCache.lastUpdate) < CACHE_DURATION) {
        console.log('📋 Using cached data, skipping API calls')
        if (showToast) toast.success('Data refreshed from cache!')
        return
      }
      
      if (showToast) toast.loading('Refreshing all data...')
      
      // Generate current game state hash for change detection
      const currentGameHash = `${selectedNumbers.length}-${currentNumber}-${gameState}`
      
      // Only fetch if game state changed or cache expired
      if (forceRefresh || currentGameHash !== dataCache.gameHash || (now - dataCache.lastUpdate) > CACHE_DURATION) {
        console.log('🔄 Game state changed or cache expired, fetching fresh data...')
        
        // Single request for leaderboard/players
        const leaderboardResult = await gameService.getLeaderboard(gameId)
        
        // Single request for game data  
        const gameResult = await gameService.getGame(gameId)
        
        // Single request for all winners
        const winnersResult = await gameService.getAllWinners(gameId)
        
        // Single request for pending verification requests
        const verificationsResult = await gameService.getPendingVerificationRequests(gameId)
        
        // Process results
        if (leaderboardResult.success) {
          setLeaderboard(leaderboardResult.players)
          setPlayers(leaderboardResult.players) // Use same data for players count
        }
        
        if (gameResult.success) {
          setGameDoc(gameResult.game)
          // Update player count from game data
          const playerCount = gameResult.game.playerCount || 0
          if (showToast) toast.success(`Refreshed! ${playerCount} players, ${leaderboardResult.players?.length || 0} scores`)
        }
        
        if (winnersResult.success) {
          // Keep the original object structure with condition keys
          setAllWinners(winnersResult.winners)
          setWinnersLastUpdate(new Date())
          console.log('🏆 Winners data refreshed:', winnersResult.winners)
        } else {
          console.error('Failed to refresh winners in refreshAllData:', winnersResult.error)
        }

        if (verificationsResult.success) {
          setPendingVerifications(verificationsResult.requests)
          console.log('📝 Verification requests refreshed:', verificationsResult.requests)
        } else {
          console.error('Failed to refresh verification requests:', verificationsResult.error)
        }
        
        // Update cache
        setDataCache({
          leaderboard: leaderboardResult.players,
          winners: winnersResult.winners,
          lastUpdate: now,
          gameHash: currentGameHash
        })
        
        console.log('✅ Data refreshed and cached')
        
        // Run automatic win detection after refreshing leaderboard
        if (gameState === 'active') {
          setTimeout(() => autoDetectWins(), 500) // Small delay to ensure state is updated
        }
      } else {
        console.log('📋 No changes detected, using existing data')
        if (showToast) toast.success('Data is up to date!')
      }
      
      if (showToast) toast.dismiss() // Dismiss loading toast
      return true
      
    } catch (error) {
      console.error('Failed to refresh all data:', error)
      if (showToast) {
        toast.dismiss()
        toast.error('Failed to refresh data')
      }
      
      // Auto-retry on error with exponential backoff
      setTimeout(() => {
        console.log('🔄 Auto-retrying data refresh...')
        refreshAllData(false, false) // Retry without toast, no force refresh
      }, 5000) // Increased retry delay
      
      return false
    }
  }

  // Auto-detect wins for all players based on their tickets and scores
  const autoDetectWins = async () => {
    if (!gameId || !leaderboard || leaderboard.length === 0) return

    console.log('🔍 Starting automatic win detection...')
    
    try {
      let anyWinsDetected = false
      
      for (const player of leaderboard) {
        if (!player.ticket || !Array.isArray(player.ticket) || player.ticket.length === 0) {
          continue // Skip players without valid tickets
        }

        // Get player's current win status from database
        const currentWins = {
          earlyAdopter: player.earlyAdopter || false,
          gasSaver: player.gasSaver || false, 
          fullBlockchain: player.fullBlockchain || false
        }

        // Check for new wins using the score-based Early Five logic
        const correctNumbers = new Set(selectedNumbers)
        const incorrectNumbers = new Set() // Will need to implement tracking incorrect answers
        const playerScore = player.score || 0

        const newWins = checkAllWinningConditions(
          correctNumbers,
          currentWins,
          player.ticket,
          incorrectNumbers,
          playerScore
        )

        // If new wins detected, update the database
        if (Object.keys(newWins).length > 0) {
          console.log(`🎉 Auto-detected new wins for ${player.name}:`, newWins)
          
          // Update player in database with new wins
          const updateData = { ...newWins }
          
          // Calculate points for new wins
          const winConditionInfo = getWinConditionInfo()
          Object.keys(newWins).forEach(condition => {
            const points = winConditionInfo[condition]?.points || 0
            updateData.score = (player.score || 0) + points
          })

          const result = await gameService.updatePlayerWins(gameId, player.id, updateData)
          
          if (result.success) {
            anyWinsDetected = true
            toast.success(`🎉 ${player.name} automatically won ${Object.keys(newWins).map(w => winConditionInfo[w]?.name).join(', ')}!`)
          } else {
            console.error('Failed to update auto-detected wins:', result.error)
          }
        }
      }

      if (anyWinsDetected) {
        // Refresh leaderboard to show updated wins and scores
        setTimeout(() => refreshAllData(false, true), 1000)
      }

    } catch (error) {
      console.error('Error in automatic win detection:', error)
    }
  }

  // Smart auto-refresh leaderboard when game is active with adaptive frequency
  useEffect(() => {
    let autoRefreshInterval
    
    if (gameState === 'active' && gameId) {
      // Adaptive refresh frequency based on game activity
      const getRefreshInterval = () => {
        const recentActivity = Date.now() - (dataCache.lastUpdate || 0)
        
        // If recent activity (< 5 minutes), refresh more frequently
        if (recentActivity < 300000) { // 5 minutes
          return 20000 // 20 seconds for active periods
        } else {
          return 45000 // 45 seconds for quiet periods
        }
      }
      
      const scheduleNextRefresh = () => {
        const interval = getRefreshInterval()
        autoRefreshInterval = setTimeout(() => {
          console.log(`🔄 Smart auto-refresh (${interval/1000}s interval)...`)
          refreshAllData(false, false) // Silent refresh, no force
          scheduleNextRefresh() // Schedule next refresh
        }, interval)
      }
      
      // Start the adaptive refresh cycle
      scheduleNextRefresh()
    }

    return () => {
      if (autoRefreshInterval) {
        clearTimeout(autoRefreshInterval)
      }
    }
  }, [gameState, gameId, selectedNumbers.length]) // Also depend on game activity

  // Separate function to fetch players (only when needed)
  const fetchPlayers = async () => {
    try {
      const playersResult = await gameService.getGamePlayers(gameId)
      if (playersResult.success) {
        setPlayers(playersResult.players)
      }
    } catch (error) {
      console.error('Failed to fetch players:', error)
    }
  }

  // Initialize a new game
  const initializeGame = async () => {
    try {
      // Get game ID from URL params or location state
      const gameIdFromParams = searchParams.get('gameId')
      const stateData = location.state
      
      if (gameIdFromParams && stateData) {
        // Game created from setup page
        setGameId(gameIdFromParams)
        setGameDoc(stateData.gameDoc)
        setHostName(stateData.hostName || 'Host')
        setGameState('waiting')
        
        // Start polling for updates
        startPolling()
        
        // Load initial winners data
        refreshAllData(false, false) // Silent initial load
        
        console.log('Game loaded with ID:', gameIdFromParams)
      } else {
        // No game ID provided, redirect to setup
        navigate('/setup')
      }
    } catch (error) {
      console.error('Error initializing game:', error)
      navigate('/setup')
    }
  }

  // Handle question round completion
  const handleQuestionRoundComplete = async () => {
    console.log('🎯 handleQuestionRoundComplete called - closing popup')
    
    // Update frontend state immediately
    if (selectedQuestionNumber && !selectedNumbers.includes(selectedQuestionNumber)) {
      setSelectedNumbers(prev => [...prev, selectedQuestionNumber])
    }
    
    // Reset round state
    setShowQuestionRound(false)
    setSelectedQuestionNumber(null)
    setRoundStarted(false)
    setRoundPhase('idle')
    setTimeRemaining(0)
    
    // Invalidate cache to force fresh data after round completion
    setDataCache(prev => ({ ...prev, lastUpdate: 0 }))
    
    // Smart refresh - only fetch if significant time has passed or force needed
    setTimeout(() => {
      refreshAllData(false, false) // Silent refresh, will use cache if recent
      // Run auto-detection after the refresh to check for new wins
      setTimeout(() => autoDetectWins(), 1000) 
    }, 2000) // Small delay to ensure all players have submitted
    
    // Clear current number display
    setCurrentNumber(null)
  }

  // Handle question round cancellation
  const handleQuestionRoundClose = () => {
    setShowQuestionRound(false)
    setSelectedQuestionNumber(null)
    setRoundStarted(false)
    setRoundPhase('idle')
    setTimeRemaining(0)
  }

  // Handle number click from board - start question round
  const handleNumberClick = async (number) => {
    console.log('Number clicked:', number)
    console.log('gameState:', gameState)
    console.log('roundStarted:', roundStarted)
    
    // Check if game is active and round not started
    if (gameState !== 'active') {
      console.log('Game must be active to select numbers')
      return
    }
    
    if (roundStarted) {
      console.log('Round already in progress')
      return
    }
    
    // Check if number already selected
    if (selectedNumbers.includes(number)) {
      console.log('Number already selected')
      return
    }

    console.log(`Selected number from board: ${number}`)

    // Invalidate cache on game events for immediate updates
    setDataCache(prev => ({ ...prev, lastUpdate: 0 }))

    // Set the current number and start the round
    // Do NOT update selectedNumbers here - let the QuestionRound component handle database update
    // and then we'll fetch the updated state after
    setCurrentNumber(number)
    setRoundStarted(true)
    
    // Show the question round modal with timer workflow
    setSelectedQuestionNumber(number)
    setShowQuestionRound(true)
    
    console.log('Question round should now be visible')
  }

  const handlePauseGame = () => {
    if (gameState === 'active') {
      setGameState('paused')
      setGameTimerRunning(false) // Pause the timer
    } else if (gameState === 'paused') {
      setGameState('active')
      setGameTimerRunning(true) // Resume the timer
    }
  }

  const handleResetGame = async () => {
    try {
      // Reset database state first
      if (gameDoc) {
        await gameService.resetGame(gameId)
      }
      
      // Invalidate cache on reset
      setDataCache({ leaderboard: null, winners: null, lastUpdate: 0, gameHash: '' })
      
      // Then reset local state
      setGameState('waiting')
      setSelectedNumbers([])
      setCurrentNumber(null)
      setGameTime(0)
      setGameTimerRunning(false) // Stop the timer
      setRoundPhase('idle')
      setTimeRemaining(0)
      setRoundStarted(false)
      
      // Fetch updated game state
      await fetchGameUpdates()
      
      toast.success('Game reset successfully')
    } catch (error) {
      console.error('Failed to reset game:', error)
      toast.error('Failed to reset game')
    }
  }

  const handleVerifyWin = (category, winner) => {
    console.log(`Verifying win for ${category} by ${winner.playerName}`)
    // Add win verification logic here
  }

  const handleAwardPrize = (category, winner) => {
    console.log(`Awarding prize for ${category} to ${winner.playerName}`)
  }

  const handleShareGame = () => {
    setShowQRPopup(true)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartGame = async () => {
    if (!gameId) {
      alert('No game ID available')
      return
    }

    try {
      // First clear any existing called numbers
      await gameService.resetGame(gameId)
      
      // Then start the game
      const result = await gameService.startGame(gameId)
      if (result.success) {
        setGameState('active')
        setGameDoc(result.game)
        // Clear any current number when starting
        setCurrentNumber(null)
        setSelectedNumbers([])
        // Start the game timer
        setGameTime(0) // Reset timer to 0
        setGameTimerRunning(true) // Start the timer
        
        // Fetch initial players and leaderboard after starting
        await fetchPlayers()
        await refreshAllData(true, true) // Force refresh on reset
        
        toast.success('Game started successfully!')
        console.log('Game started successfully')
      } else {
        toast.error(`Failed to start game: ${result.error}`)
      }
    } catch (error) {
      console.error('Error starting game:', error)
      toast.error('Error starting game. Please try again.')
    }
  }

  const gameStats = {
    totalPlayers: players.length,
    questionsAnswered: selectedNumbers.length,
    averageScore: players.length > 0 ? Math.round(players.reduce((sum, p) => sum + p.score, 0) / players.length) : 0,
    gameTimeElapsed: formatTime(gameTime)
  }

  return (
  <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden text-white bg-black">
      {/* Glassmorphism background shapes */}
      <div className="absolute top-0 left-0 z-0 w-full h-full pointer-events-none">
        <div className="absolute left-[-100px] top-[-100px] w-[400px] h-[400px] bg-gradient-to-br from-blue-500/30 to-purple-500/20 rounded-full blur-3xl opacity-70 animate-pulse"></div>
        <div className="absolute right-[-120px] bottom-[-120px] w-[350px] h-[350px] bg-gradient-to-tr from-pink-500/20 to-yellow-500/10 rounded-full blur-2xl opacity-60 animate-pulse"></div>
        <div className="absolute left-1/2 top-1/3 w-[200px] h-[200px] bg-gradient-to-br from-green-400/20 to-blue-400/10 rounded-full blur-2xl opacity-40 animate-pulse"></div>
      </div>
      <div className="z-10 w-full mx-auto max-w-7xl">
        {/* Blockchain Club VITB Header (glass card) */}
        <div className="flex items-center justify-between p-6 mb-6 transition-all duration-700 ease-out transform border border-gray-800 shadow-2xl opacity-0 bg-gray-900/60 backdrop-blur-md rounded-xl animate-fade-in-up">
          <div className="flex items-center gap-4">
            <img 
              src="/logo.png" 
              alt="Blockchain Club VITB" 
              className="object-contain w-14 h-14"
            />
            <div className="text-left">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Blockchain Club VITB</h1>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-extrabold tracking-wide text-transparent lg:text-4xl bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-yellow-300 drop-shadow-lg animate-gradient-x">
              Decrypt2Win
            </h1>
            <p className="mt-1 text-base italic font-semibold tracking-wide text-gray-200">Blockchain Tambola</p>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 mb-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/setup')}
              className="flex items-center gap-2 px-3 py-2 transition-colors bg-gray-800 rounded-lg hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Setup
            </button>
            <div>
              <h1 className="mb-2 text-3xl font-bold text-white">Host Dashboard</h1>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Game ID: <span className="font-mono text-lg font-bold text-blue-400">{gameId || 'Loading...'}</span>
                </span>
                <span className="flex items-center gap-2">
                  Host: <span className="text-green-400">{hostName}</span>
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono text-green-400">{formatTime(gameTime)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshAllData}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0.5"
            >
              <RotateCcw className="w-4 h-4" />
              Refresh All
            </button>
            
            <button
              onClick={handleShareGame}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0.5"
            >
              <Share2 className="w-4 h-4" />
              Share Game
            </button>
            
            <button
              onClick={handlePauseGame}
              className={`flex items-center gap-2 px-4 py-2 ${gameState === 'paused' ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700' : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'} rounded-lg shadow-md transition-all text-white`}
            >
              {gameState === 'paused' ? (
                <>
                  <Play className="w-4 h-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              )}
            </button>
            
            <button
              onClick={handleResetGame}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0.5 text-white"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Game Status Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
          <div className="p-4 border border-gray-800 bg-gray-900/50 backdrop-blur-sm rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                gameState === 'waiting' ? 'bg-yellow-500' :
                gameState === 'active' ? 'bg-green-500' : 'bg-gray-500'
              }`}></div>
              <span className="font-medium text-white">
                {gameState === 'waiting' ? 'Waiting for Game' :
                 gameState === 'active' ? 'Game in Progress' : 'Game Finished'}
              </span>
            </div>
          </div>

          <div className="p-4 transition-all duration-500 ease-out transform border border-gray-800 opacity-0 bg-gray-900/50 backdrop-blur-sm rounded-xl animate-fade-in-up">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-white">Numbers Called: {selectedNumbers.length}/50</span>
            </div>
          </div>

          <div className="p-4 transition-all duration-500 ease-out delay-75 transform border border-gray-800 opacity-0 bg-gray-900/50 backdrop-blur-sm rounded-xl animate-fade-in-up">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-green-400" />
              <span className="text-white">Players: {players.length}</span>
            </div>
          </div>

          <div className="p-4 transition-all duration-500 ease-out delay-150 transform border border-gray-800 opacity-0 bg-gray-900/50 backdrop-blur-sm rounded-xl animate-fade-in-up">
            <div className="flex items-center gap-3">
              <span className="text-white">Phase: </span>
              <span className={`font-bold ${
                roundPhase === 'prepare' ? 'text-yellow-400' :
                roundPhase === 'active' ? 'text-green-400' :
                roundPhase === 'scoring' ? 'text-blue-400' : 'text-gray-400'
              }`}>
                {roundPhase.toUpperCase()} {timeRemaining > 0 && `(${timeRemaining}s)`}
              </span>
            </div>
          </div>
        </div>

        {/* Game Control Buttons */}
        <div className="flex flex-col justify-center gap-4 mb-6 sm:flex-row">
          {gameState === 'waiting' && (
            <button
              onClick={handleStartGame}
              className="px-8 py-4 text-lg font-bold text-white transition-all shadow-lg rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl"
            >
              <Play className="inline w-5 h-5 mr-2" />
              Start Game
            </button>
          )}
          
          {gameState === 'active' && roundStarted && (
            <div className="text-center">
              <p className="text-xl font-semibold text-orange-400">
                Question Round in Progress...
              </p>
            </div>
          )}
        </div>

        {/* Main Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Complete Board */}
          <div className="space-y-6 lg:col-span-2">
            <div className="p-6 transition-all duration-500 ease-out transform border border-gray-800 shadow-2xl opacity-0 bg-gray-900/60 backdrop-blur-md rounded-xl animate-fade-in-up">
              <CompleteBoard
              selectedNumbers={selectedNumbers}
              currentNumber={currentNumber}
              onNumberClick={handleNumberClick}
            />
            </div>
            
            {/* Winners Board Section */}
            <div className="p-6 transition-all duration-500 ease-out delay-100 transform border border-gray-800 shadow-2xl opacity-0 bg-gray-900/60 backdrop-blur-md rounded-xl animate-fade-in-up">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-xl font-semibold">Winners Board</h3>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>{totalWinners} Winners</span>
                  </div>
                  
                  <button
                    onClick={refreshWinnersData}
                    disabled={loadingWinners}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      loadingWinners 
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {loadingWinners ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
              </div>

              {winnersLastUpdate && (
                <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  Last updated: {winnersLastUpdate.toLocaleTimeString()}
                </div>
              )}

              {/* Winners by Category */}
              <div className="space-y-4">
                {Object.entries(getWinConditionInfo()).map(([condition, info]) => {
                  const conditionWinners = allWinners[condition] || []
                  const conditionPending = pendingVerifications.filter(req => req.conditionId === condition)
                  const hasWinners = conditionWinners.length > 0
                  const hasPending = conditionPending.length > 0

                  return (
                    <div
                      key={condition}
                      className={`p-4 rounded-lg border transition-all ${
                        hasWinners 
                          ? 'bg-green-900/30 border-green-600/50' 
                          : hasPending
                          ? 'bg-yellow-900/30 border-yellow-600/50'
                          : 'bg-gray-800/50 border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{info.icon}</span>
                          <div>
                            <h4 className="font-semibold text-white">{info.name}</h4>
                            <p className="text-sm text-gray-400">{info.description}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <div className={`text-lg font-bold ${
                              hasWinners ? 'text-green-400' : 'text-gray-500'
                            }`}>
                              {conditionWinners.length}
                            </div>
                            <div className="text-xs text-gray-400">
                              {conditionWinners.length === 1 ? 'Winner' : 'Winners'}
                            </div>
                            {hasPending && (
                              <div className="ml-2 px-2 py-1 text-xs font-bold bg-yellow-600 text-black rounded">
                                {conditionPending.length} Pending
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Pending Verification Requests */}
                      {hasPending && (
                        <div className="mb-4">
                          <h5 className="mb-2 text-sm font-semibold text-yellow-400">Pending Verification:</h5>
                          <div className="space-y-2">
                            {conditionPending.map((request) => {
                              // Find player details from leaderboard
                              const player = leaderboard.find(p => p.$id === request.playerId)
                              return (
                                <div 
                                  key={request.verificationId}
                                  className="flex items-center justify-between p-3 rounded bg-yellow-900/50 border border-yellow-600/30"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-yellow-600 text-black">
                                      ?
                                    </div>
                                    <span className="font-medium text-white">{player?.name || 'Unknown Player'}</span>
                                    <span className="text-sm text-gray-400">({player?.regNo || 'N/A'})</span>
                                    <span className="text-sm text-yellow-400">{player?.score || 0} pts</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleVerificationDecision(request.verificationId, 'approved')}
                                      className="px-3 py-1 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                                    >
                                      ✓ Verify & Award
                                    </button>
                                    <button
                                      onClick={() => handleVerificationDecision(request.verificationId, 'rejected', 'Host decision')}
                                      className="px-3 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                    >
                                      ✗ Reject
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Winner List */}
                      {hasWinners && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-semibold text-green-400">Verified Winners:</h5>
                          {conditionWinners.slice(0, 5).map((winner, index) => (
                            <div 
                              key={winner.$id}
                              className="flex items-center justify-between p-2 rounded bg-gray-800/70"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  index === 0 ? 'bg-yellow-500 text-black' : 
                                  index === 1 ? 'bg-gray-400 text-black' :
                                  index === 2 ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                                }`}>
                                  {index + 1}
                                </div>
                                <span className="font-medium text-white">{winner.name}</span>
                                <span className="text-sm text-gray-400">({winner.regNo})</span>
                              </div>
                              
                              <div className="flex items-center gap-3 text-sm">
                                <span className="font-medium text-green-400">{winner.score || 0} pts</span>
                                {winner.winTimestamps && winner.winTimestamps[condition] && (
                                  <span className="text-gray-400">
                                    {(() => {
                                      try {
                                        const timestamps = typeof winner.winTimestamps === 'string' 
                                          ? JSON.parse(winner.winTimestamps) 
                                          : winner.winTimestamps
                                        return new Date(timestamps[condition]).toLocaleTimeString('en-US', {
                                          hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
                                        })
                                      } catch (e) {
                                        return ''
                                      }
                                    })()}
                                  </span>
                                )}
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              </div>
                            </div>
                          ))}
                          
                          {conditionWinners.length > 5 && (
                            <div className="pt-2 text-sm text-center text-gray-400">
                              +{conditionWinners.length - 5} more winners
                            </div>
                          )}
                        </div>
                      )}

                      {/* Empty State */}
                      {!hasWinners && !hasPending && (
                        <div className="py-4 text-center text-gray-500">
                          <p className="text-sm">No winners yet</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Leaderboard */}
          <div className="space-y-6 transition-all duration-500 ease-out delay-150 transform opacity-0 animate-fade-in-up">
            {/* Leaderboard */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Leaderboard</h3>
                <button
                  onClick={refreshAllData}
                  className="px-4 py-2 text-sm font-medium text-white transition-all rounded-lg shadow-md bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-95"
                >
                  Refresh All
                </button>
              </div>
              <Leaderboard 
                players={leaderboard}
                gameStats={gameStats}
              />
            </div>
          </div>
        </div>

        {/* Question Round Modal */}
        <QuestionRound
          selectedNumber={selectedQuestionNumber}
          isVisible={showQuestionRound}
          onRoundComplete={handleQuestionRoundComplete}
          onClose={handleQuestionRoundClose}
          gameId={gameId}
        />

        {/* QR Code Share Popup */}
        {showQRPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md p-8 border shadow-2xl bg-slate-900 border-slate-700 rounded-2xl">
              <div className="text-center">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">Share Game</h3>
                  <button
                    onClick={() => setShowQRPopup(false)}
                    className="text-gray-400 transition-colors hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Game ID Display */}
                <div className="p-4 mb-6 border bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl border-blue-500/30">
                  <div className="mb-1 text-sm text-gray-400">Game ID</div>
                  <div className="font-mono text-3xl font-bold tracking-wider text-blue-400">{gameId}</div>
                </div>

                {/* QR Code */}
                <div className="p-6 mb-6 bg-white rounded-xl">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://blockchain-decrypt2win.vercel.app/?gameId=${gameId}`)}&bgcolor=ffffff&color=000000&qzone=2&format=png`}
                    alt="QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                </div>

                {/* Game Link */}
                <div className="mb-6">
                  <div className="mb-2 text-sm text-gray-400">Game Link</div>
                  <div className="p-3 bg-gray-800 border border-gray-600 rounded-lg">
                    <div className="text-sm text-blue-400 break-all">
                      https://blockchain-decrypt2win.vercel.app/?gameId={gameId}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://blockchain-decrypt2win.vercel.app/?gameId=${gameId}`)
                      toast.success('Game link copied to clipboard!')
                    }}
                    className="flex-1 px-4 py-3 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Copy Link
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(gameId)
                      toast.success('Game ID copied to clipboard!')
                    }}
                    className="flex-1 px-4 py-3 font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    Copy ID
                  </button>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  Players can scan the QR code or visit the link to join your game!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1f2937',
              color: '#ffffff',
              border: '1px solid #374151',
            },
            success: {
              style: {
                background: '#059669',
              },
            },
            error: {
              style: {
                background: '#dc2626',
              },
            },
          }}
        />
      </div>
    </div>
  )
}

export default HostDashboard
