import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import CompleteBoard from '../components/CompleteBoard'
import Leaderboard from '../components/Leaderboard'
import WinnerPanel from '../components/WinnerPanel'
import QuestionRound from '../components/QuestionRound'
import { gameService } from '../utils/gameService'
import { Share2, Users, Settings, Download, Play, Pause, RotateCcw, Clock, ArrowLeft } from 'lucide-react'

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

  // Polling interval
  const pollIntervalRef = useRef(null)
  
  // Navigation
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

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
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }
    
    pollIntervalRef.current = setInterval(async () => {
      if (gameId) {
        await fetchGameUpdates()
      }
    }, 2000) // Poll every 2 seconds
  }

  // Fetch game updates
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

      const playersResult = await gameService.getGamePlayers(gameId)
      if (playersResult.success) {
        setPlayers(playersResult.players)
      }

      const leaderboardResult = await gameService.getLeaderboard(gameId)
      if (leaderboardResult.success) {
        setLeaderboard(leaderboardResult.players)
      }
    } catch (error) {
      console.error('Failed to fetch game updates:', error)
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
    // Reset round state
    setShowQuestionRound(false)
    setSelectedQuestionNumber(null)
    setRoundStarted(false)
    setRoundPhase('idle')
    setTimeRemaining(0)
    
    // Update game data first
    await fetchGameUpdates()
    
    // Then clear current number display - don't show previous number
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
    const shareText = `Join my Tambola game with ID: ${gameId}`
    if (navigator.share) {
      navigator.share({
        title: 'Join my Tambola Game!',
        text: shareText,
        url: window.location.origin
      })
    } else {
      navigator.clipboard.writeText(shareText)
      toast.success('Game ID copied to clipboard!')
    }
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
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Blockchain Club VITB Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-4">
            <img 
              src="/logo.png" 
              alt="Blockchain Club VITB" 
              className="w-12 h-12 object-contain"
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold gradient-text">Blockchain Club VITB</h1>
              <p className="text-lg text-gray-300 font-semibold">Blockchain Tambola</p>
            </div>
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
              onClick={handleShareGame}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share Game
            </button>
            
            <button
              onClick={handlePauseGame}
              className={`flex items-center gap-2 px-4 py-2 ${gameState === 'paused' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'} rounded-lg transition-colors`}
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
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Game Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 border border-gray-600 rounded-xl p-4">
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

          <div className="bg-gray-800 border border-gray-600 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-white">Numbers Called: {selectedNumbers.length}/50</span>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-600 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-green-400" />
              <span className="text-white">Players: {players.length}</span>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-600 rounded-xl p-4">
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
            <CompleteBoard
              selectedNumbers={selectedNumbers}
              currentNumber={currentNumber}
              onNumberClick={handleNumberClick}
            />
          </div>

          {/* Right Column - Leaderboard and Winners */}
          <div className="space-y-6">
            <Leaderboard 
              players={leaderboard}
              gameStats={gameStats}
            />
            
            <WinnerPanel
              onVerifyWin={handleVerifyWin}
              onAwardPrize={handleAwardPrize}
            />
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
