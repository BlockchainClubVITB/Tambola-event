import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import CompleteBoard from '../components/CompleteBoard'
import Leaderboard from '../components/Leaderboard'
import WinnerPanel from '../components/WinnerPanel'
import WinnersPanel from '../components/WinnersPanel'
import QuestionRound from '../components/QuestionRound'
import { gameService } from '../utils/gameService'
import { getWinConditionInfo } from '../utils/winningConditions'
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

  // Polling interval
  const pollIntervalRef = useRef(null)
  const [lastGameStateHash, setLastGameStateHash] = useState('') // Cache to avoid unnecessary updates
  const [lastPlayersCount, setLastPlayersCount] = useState(0) // Track player count changes
  
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

  // Optimized refresh function - fetches all data in minimal requests
  const refreshAllData = async (showToast = true) => {
    try {
      if (showToast) toast.loading('Refreshing all data...')
      
      // Single request for leaderboard/players
      const leaderboardResult = await gameService.getLeaderboard(gameId)
      
      // Single request for game data  
      const gameResult = await gameService.getGame(gameId)
      
      // Single request for all winners
      const winnersResult = await gameService.getAllWinners(gameId)
      
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
        // Flatten all winners into single array for pagination
        const flatWinners = []
        Object.entries(winnersResult.winners).forEach(([condition, winners]) => {
          winners.forEach(winner => {
            flatWinners.push({
              ...winner,
              winCondition: condition,
              correctCount: winner.correctNumbers?.length || 0
            })
          })
        })
        setAllWinners(flatWinners)
      }
      
      if (showToast) toast.dismiss() // Dismiss loading toast
      return true
      
    } catch (error) {
      console.error('Failed to refresh all data:', error)
      if (showToast) {
        toast.dismiss()
        toast.error('Failed to refresh data')
      }
      
      // Auto-retry on error
      setTimeout(() => {
        console.log('🔄 Auto-retrying data refresh...')
        refreshAllData(false) // Retry without toast
      }, 3000)
      
      return false
    }
  }

  // Auto-refresh leaderboard when game is active
  useEffect(() => {
    let autoRefreshInterval
    
    if (gameState === 'active' && gameId) {
      // Auto-refresh all data every 15 seconds during active games
      autoRefreshInterval = setInterval(() => {
        console.log('🔄 Auto-refreshing all data...')
        refreshAllData(false) // Silent refresh
      }, 15000)
    }

    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval)
      }
    }
  }, [gameState, gameId])

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
        refreshAllData(false) // Silent initial load
        
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
    
    // No automatic refresh - host can manually refresh leaderboard if needed
    console.log('Question round completed, number locked on frontend')
    
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
        await refreshAllData()
        
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
  <div className="relative flex items-center justify-center min-h-screen p-4 text-white bg-black overflow-hidden">
      {/* Glassmorphism background shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute left-[-100px] top-[-100px] w-[400px] h-[400px] bg-gradient-to-br from-blue-500/30 to-purple-500/20 rounded-full blur-3xl opacity-70 animate-pulse"></div>
        <div className="absolute right-[-120px] bottom-[-120px] w-[350px] h-[350px] bg-gradient-to-tr from-pink-500/20 to-yellow-500/10 rounded-full blur-2xl opacity-60 animate-pulse"></div>
        <div className="absolute left-1/2 top-1/3 w-[200px] h-[200px] bg-gradient-to-br from-green-400/20 to-blue-400/10 rounded-full blur-2xl opacity-40 animate-pulse"></div>
      </div>
      <div className="max-w-7xl mx-auto w-full z-10">
        {/* Blockchain Club VITB Header (glass card) */}
        <div className="mb-6 p-6 bg-gray-900/60 backdrop-blur-md border border-gray-800 shadow-2xl rounded-xl flex items-center justify-between transform transition-all duration-700 ease-out opacity-0 animate-fade-in-up">
          <div className="flex items-center gap-4">
            <img 
              src="/logo.png" 
              alt="Blockchain Club VITB" 
              className="w-14 h-14 object-contain"
            />
            <div className="text-left">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Blockchain Club VITB</h1>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-yellow-300 drop-shadow-lg animate-gradient-x">
              Decrypt2Win
            </h1>
            <p className="text-base text-gray-200 font-semibold italic tracking-wide mt-1">Blockchain Tambola</p>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/setup')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Setup
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Host Dashboard</h1>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Game ID: <span className="font-mono text-blue-400 text-lg font-bold">{gameId || 'Loading...'}</span>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl">
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

          <div className="p-4 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl transform transition-all duration-500 ease-out opacity-0 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-white">Numbers Called: {selectedNumbers.length}/50</span>
            </div>
          </div>

          <div className="p-4 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl transform transition-all duration-500 ease-out opacity-0 animate-fade-in-up delay-75">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-green-400" />
              <span className="text-white">Players: {players.length}</span>
            </div>
          </div>

          <div className="p-4 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl transform transition-all duration-500 ease-out opacity-0 animate-fade-in-up delay-150">
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
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-center">
          {gameState === 'waiting' && (
            <button
              onClick={handleStartGame}
              className="px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Play className="w-5 h-5 inline mr-2" />
              Start Game
            </button>
          )}
          
          {gameState === 'active' && roundStarted && (
            <div className="text-center">
              <p className="text-xl text-orange-400 font-semibold">
                Question Round in Progress...
              </p>
            </div>
          )}
        </div>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Complete Board */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl shadow-2xl transform transition-all duration-500 ease-out opacity-0 animate-fade-in-up">
              <CompleteBoard
              selectedNumbers={selectedNumbers}
              currentNumber={currentNumber}
              onNumberClick={handleNumberClick}
            />
            </div>
            
            {/* Winners Board Section */}
            <div className="p-6 bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl shadow-2xl transform transition-all duration-500 ease-out opacity-0 animate-fade-in-up delay-100">
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
                <div className="mb-4 text-xs text-gray-400 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Last updated: {winnersLastUpdate.toLocaleTimeString()}
                </div>
              )}

              {/* Winners by Category */}
              <div className="space-y-4">
                {Object.entries(getWinConditionInfo()).map(([condition, info]) => {
                  const conditionWinners = allWinners[condition] || []
                  const hasWinners = conditionWinners.length > 0

                  return (
                    <div
                      key={condition}
                      className={`p-4 rounded-lg border transition-all ${
                        hasWinners 
                          ? 'bg-green-900/30 border-green-600/50' 
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
                          <div className={`text-lg font-bold ${
                            hasWinners ? 'text-green-400' : 'text-gray-500'
                          }`}>
                            {conditionWinners.length}
                          </div>
                          <div className="text-xs text-gray-400">
                            {conditionWinners.length === 1 ? 'Winner' : 'Winners'}
                          </div>
                        </div>
                      </div>

                      {/* Winner List */}
                      {hasWinners && (
                        <div className="space-y-2">
                          {conditionWinners.slice(0, 5).map((winner, index) => (
                            <div 
                              key={winner.$id}
                              className="flex items-center justify-between p-2 bg-gray-800/70 rounded"
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
                                <span className="text-green-400 font-medium">{winner.score || 0} pts</span>
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
                            <div className="text-center text-sm text-gray-400 pt-2">
                              +{conditionWinners.length - 5} more winners
                            </div>
                          )}
                        </div>
                      )}

                      {/* No Winners State */}
                      {!hasWinners && (
                        <div className="text-center py-2 text-gray-500 text-sm">
                          No winners yet
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Leaderboard */}
          <div className="space-y-6 transform transition-all duration-500 ease-out opacity-0 animate-fade-in-up delay-150">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Leaderboard</h3>
                <button
                  onClick={refreshAllData}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:opacity-95 shadow-md transition-all"
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
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <div className="text-center">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">Share Game</h3>
                  <button
                    onClick={() => setShowQRPopup(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Game ID Display */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl border border-blue-500/30">
                  <div className="text-sm text-gray-400 mb-1">Game ID</div>
                  <div className="text-3xl font-bold text-blue-400 font-mono tracking-wider">{gameId}</div>
                </div>

                {/* QR Code */}
                <div className="mb-6 p-6 bg-white rounded-xl">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://blockchain-decrypt2win.vercel.app/?gameId=${gameId}`)}&bgcolor=ffffff&color=000000&qzone=2&format=png`}
                    alt="QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                </div>

                {/* Game Link */}
                <div className="mb-6">
                  <div className="text-sm text-gray-400 mb-2">Game Link</div>
                  <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
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
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Copy Link
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(gameId)
                      toast.success('Game ID copied to clipboard!')
                    }}
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
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
