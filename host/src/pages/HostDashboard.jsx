import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import CompleteBoard from '../components/CompleteBoard'
import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import CompleteBoard from '../components/CompleteBoard'
import Leaderboard from '../components/Leaderboard'
import WinnerPanel from '../components/WinnerPanel'
import { gameService } from '../utils/gameService'
import { Share2, Users, Settings, Download, Play, Pause, RotateCcw, Clock, ArrowLeft } from 'lucide-react'
import { generateGameCode, generateTambolaBoard } from '../utils/gameUtils'
import { getRandomQuestion } from '../utils/questions'
import { Share2, Users, Settings, Download } from 'lucide-react'

const HostDashboard = () => {
  // Game State
<<<<<<< Updated upstream
  const [gameCode] = useState(generateGameCode())
=======
  const [gameId, setGameId] = useState(null)
  const [gameDoc, setGameDoc] = useState(null)
  const [hostName, setHostName] = useState('')
  // Game State - now using Appwrite
  const [game, setGame] = useState(null)
>>>>>>> Stashed changes
  const [gameState, setGameState] = useState('waiting') // 'waiting', 'active', 'paused', 'ended'
  const [selectedNumbers, setSelectedNumbers] = useState([])
  const [selectedNumbers, setSelectedNumbers] = useState([])
  const [currentNumber, setCurrentNumber] = useState(null)
  const [currentRound, setCurrentRound] = useState(null)
  const [currentRound, setCurrentRound] = useState(null)
  const [gameTime, setGameTime] = useState(0)
<<<<<<< Updated upstream
=======
  const [players, setPlayers] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [roundPhase, setRoundPhase] = useState('idle') // 'idle', 'prepare', 'active', 'scoring'
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [roundStarted, setRoundStarted] = useState(false)

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

  // Select random number and start round workflow
  const selectRandomNumber = async () => {
    if (gameState !== 'waiting' && gameState !== 'active') return
    if (roundStarted) return // Prevent multiple clicks during round

    // Get available numbers (1-90 that haven't been called)
    const allNumbers = Array.from({ length: 90 }, (_, i) => i + 1)
    const calledNumbersAsNumbers = selectedNumbers.map(num => typeof num === 'string' ? parseInt(num) : num)
    const availableNumbers = allNumbers.filter(num => !calledNumbersAsNumbers.includes(num))
    
    if (availableNumbers.length === 0) {
      alert('All numbers have been called!')
      return
    }

    // Select random number
    const randomIndex = Math.floor(Math.random() * availableNumbers.length)
    const selectedNumber = availableNumbers[randomIndex]

    try {
      // Start the round in Appwrite
      const result = await gameService.startRound(gameId, selectedNumber)
      if (result.success) {
        setCurrentNumber(selectedNumber)
        setSelectedNumbers(prev => [...prev, selectedNumber])
        setCurrentRound(result.round)
        setGameState('active')
        setRoundStarted(true)
        
        // Start the round workflow: 5sec prepare -> 30sec active -> 5sec scoring
        startRoundWorkflow(result.round)
      } else {
        alert('Failed to start round: ' + result.error)
      }
    } catch (error) {
      console.error('Failed to select number:', error)
      alert('Failed to start round')
    }
  }

  // Start the round workflow with proper timing
  const startRoundWorkflow = async (round) => {
    // Phase 1: Prepare (5 seconds)
    setRoundPhase('prepare')
    setTimeRemaining(5)
    await gameService.updateRoundPhase(round.$id, 'prepare')

    // Countdown for prepare phase
    let timeLeft = 5
    const prepareInterval = setInterval(() => {
      timeLeft--
      setTimeRemaining(timeLeft)
      if (timeLeft <= 0) {
        clearInterval(prepareInterval)
        startActivePhase(round)
      }
    }, 1000)
  }

  const startActivePhase = async (round) => {
    // Phase 2: Active (30 seconds)
    setRoundPhase('active')
    setTimeRemaining(30)
    await gameService.updateRoundPhase(round.$id, 'active')

    // Countdown for active phase
    let timeLeft = 30
    const activeInterval = setInterval(() => {
      timeLeft--
      setTimeRemaining(timeLeft)
      if (timeLeft <= 0) {
        clearInterval(activeInterval)
        startScoringPhase(round)
      }
    }, 1000)
  }

  const startScoringPhase = async (round) => {
    // Phase 3: Scoring (5 seconds)
    setRoundPhase('scoring')
    setTimeRemaining(5)
    await gameService.updateRoundPhase(round.$id, 'scoring')

    // Countdown for scoring phase
    let timeLeft = 5
    const scoringInterval = setInterval(async () => {
      timeLeft--
      setTimeRemaining(timeLeft)
      if (timeLeft <= 0) {
        clearInterval(scoringInterval)
        // End round and reset for next
        await gameService.endRound(round.$id)
        setRoundPhase('idle')
        setTimeRemaining(0)
        setRoundStarted(false)
        setCurrentRound(null)
        // Update leaderboard
        await fetchGameUpdates()
      }
    }, 1000)
  }

  // Handle number click from board
  const handleNumberClick = (number) => {
    if (gameState === 'active' && !selectedNumbers.includes(number)) {
      setCurrentNumber(number)
      setSelectedNumbers(prev => [...prev, number])
    }
  const [currentRound, setCurrentRound] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
>>>>>>> Stashed changes

  // Sample Players Data
  const [players, setPlayers] = useState([
    {
      id: '1',
      name: 'Alice Johnson',
      score: 85,
      correctAnswers: 12,
      totalAnswers: 15,
      isOnline: true,
      hasWon: false,
      winType: null,
      lastAnswerTime: new Date().toISOString()
    },
    {
      id: '2', 
      name: 'Bob Smith',
      score: 92,
      correctAnswers: 14,
      totalAnswers: 16,
      isOnline: true,
      hasWon: true,
      winType: 'First Line',
      lastAnswerTime: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Carol Davis',
      score: 78,
      correctAnswers: 10,
      totalAnswers: 13,
      isOnline: false,
      hasWon: false,
      winType: null,
      lastAnswerTime: new Date().toISOString()
    }
  ])

  const [winners, setWinners] = useState({
    firstLine: {
      playerName: 'Bob Smith',
      score: 92,
      timestamp: new Date().toISOString(),
      gameTime: '12:34',
      verified: false,
      ticketNumbers: [5, 12, 23, 34, 45]
    },
    secondLine: null,
    thirdLine: null,
    fullHouse: null,
    earlyFive: {
      playerName: 'Alice Johnson',
      score: 85,
      timestamp: new Date().toISOString(),
      gameTime: '05:23',
      verified: false,
      ticketNumbers: [7, 15, 28, 39, 56]
    },
    corners: null
  })

  // Game Timer
  useEffect(() => {
    let interval = null
    if (gameState === 'active') {
      interval = setInterval(() => {
        setGameTime(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [gameState])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartGame = () => {
    if (gameState === 'waiting' || gameState === 'paused') {
      setGameState('active')
    }
  }

  const handlePauseGame = () => {
    setGameState('paused')
  }

  const handleResetGame = () => {
    setGameState('waiting')
<<<<<<< Updated upstream
    setCalledNumbers([])
    setCurrentNumber(null)
    setGameTime(0)
    setWinners({
      firstLine: null,
      secondLine: null,
      thirdLine: null,
      fullHouse: null,
      earlyFive: null,
      corners: null
    })
=======
    setSelectedNumbers([])
    setSelectedNumbers([])
    setCurrentNumber(null)
    setGameTime(0)
    setRoundPhase('idle')
    setTimeRemaining(0)
    setRoundStarted(false)
  const handleResetGame = async () => {
    if (!game) return
    
    try {
      setIsLoading(true)
      await gameService.resetGame(game.$id)
      setGameState('waiting')
      setCalledNumbers([])
      setCurrentNumber(null)
      setGameTime(0)
      setCurrentRound(null)
      setWinners({
        firstLine: null,
        secondLine: null,
        thirdLine: null,
        fullHouse: null,
        earlyFive: null,
        corners: null
      })
      await loadPlayers(game.$id)
    } catch (error) {
      console.error('Error resetting game:', error)
      setError('Failed to reset game')
    } finally {
      setIsLoading(false)
    }
>>>>>>> Stashed changes
  }

  const handleNumberClick = (number) => {
    if (gameState === 'active' && !calledNumbers.includes(number)) {
      setCurrentNumber(number)
      setCalledNumbers(prev => [...prev, number])
    }
  }

  const handleVerifyWin = (category, winner) => {
    console.log(`Verifying win for ${category} by ${winner.playerName}`)
    // Add win verification logic here
    console.log(`Verifying win for ${category} by ${winner.playerName}`)
    // Add win verification logic here
  }

  const handleAwardPrize = (category, winner) => {
    console.log(`Awarding prize for ${category} to ${winner.playerName}`)
  }

  const handleShareGame = () => {
<<<<<<< Updated upstream
    const shareText = `Join my Blockchain Tambola game with code: ${gameCode}`
=======
    const shareText = `Join my Tambola game with ID: ${gameId}`
    if (!game) return
    
    const shareText = `Join my Blockchain Tambola game with code: ${game.gameCode}`
>>>>>>> Stashed changes
    if (navigator.share) {
      navigator.share({
        title: 'Join my Tambola Game!',
        title: 'Join my Tambola Game!',
        text: shareText,
        url: window.location.origin
      })
    } else {
      navigator.clipboard.writeText(shareText)
      alert('Game ID copied to clipboard!')
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
      const result = await gameService.startGame(gameId)
      if (result.success) {
        setGameState('active')
        setGameDoc(result.game)
        console.log('Game started successfully')
      } else {
        alert(`Failed to start game: ${result.error}`)
      }
    } catch (error) {
      console.error('Error starting game:', error)
      alert('Error starting game. Please try again.')
      alert('Game ID copied to clipboard!')
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
      const result = await gameService.startGame(gameId)
      if (result.success) {
        setGameState('active')
        setGameDoc(result.game)
        console.log('Game started successfully')
      } else {
        alert(`Failed to start game: ${result.error}`)
      }
    } catch (error) {
      console.error('Error starting game:', error)
      alert('Error starting game. Please try again.')
    }
  }

  const gameStats = {
    totalPlayers: players.length,
<<<<<<< Updated upstream
=======
    questionsAnswered: selectedNumbers.length,
    questionsAnswered: selectedNumbers.length,
    averageScore: players.length > 0 ? Math.round(players.reduce((sum, p) => sum + p.score, 0) / players.length) : 0,
    totalPlayers: leaderboardStats.totalPlayers,
>>>>>>> Stashed changes
    questionsAnswered: calledNumbers.length,
    averageScore: players.length > 0 ? Math.round(players.reduce((sum, p) => sum + p.score, 0) / players.length) : 0,
    gameTimeElapsed: formatTime(gameTime)
  }

<<<<<<< Updated upstream
=======
  // Show loading state
  if (isLoading && !game) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 rounded-full border-blue-500/30 border-t-blue-500 animate-spin"></div>
          <p className="text-slate-300">Initializing game...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error && !game) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md text-center">
          <div className="p-6 mb-4 border rounded-lg bg-red-500/10 border-red-500/30">
            <p className="mb-4 text-red-400">{error}</p>
            <button
              onClick={initializeGame}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

>>>>>>> Stashed changes
  return (
    <div className="min-h-screen p-4 text-white bg-black">
      <div className="mx-auto max-w-7xl">
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
    <div className="min-h-screen p-4">
<<<<<<< Updated upstream
=======
      {/* Error Message */}
      {error && (
        <div className="p-3 mb-4 text-sm text-red-400 border rounded-lg bg-red-500/10 border-red-500/30">
          {error}
        </div>
      )}

>>>>>>> Stashed changes
      {/* Game Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="mb-2 text-4xl font-bold gradient-text">Host Dashboard</h1>
            <div className="flex items-center space-x-6 text-lg">
              <div className="flex items-center space-x-2">
                <span className="text-slate-300">Game Code:</span>
<<<<<<< Updated upstream
                <span className="font-mono bg-slate-800/50 px-3 py-1 rounded border border-blue-500/30 text-blue-400">
                  {gameCode}
=======
                <span className="px-3 py-1 font-mono text-blue-400 border rounded bg-slate-800/50 border-blue-500/30">
                  {game?.gameCode || 'Loading...'}
>>>>>>> Stashed changes
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">

          <div className="flex items-center gap-3">
            <button
              onClick={handleShareGame}
<<<<<<< Updated upstream
              className="btn-secondary flex items-center space-x-2"
=======
              className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
              className="flex items-center space-x-2 btn-secondary"
              disabled={!game}
>>>>>>> Stashed changes
            >
              <Share2 className="w-4 h-4" />
              Share Game ID
              Share Game ID
            </button>
            
            <button
              onClick={handleResetGame}
              className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-gray-600 rounded-lg hover:bg-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Game Status */}
        <div className="grid gap-4 mb-6 md:grid-cols-4">
          <div className="p-4 bg-gray-800 border border-gray-600 rounded-xl">
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

          <div className="p-4 bg-gray-800 border border-gray-600 rounded-xl">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-white">Numbers Called: {selectedNumbers.length}/90</span>
            </div>
          </div>

          <div className="p-4 bg-gray-800 border border-gray-600 rounded-xl">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-green-400" />
              <span className="text-white">Players: {players.length}</span>
            </div>
          </div>

          <div className="p-4 bg-gray-800 border border-gray-600 rounded-xl">
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
          
          {gameState === 'active' && (
            <button
              onClick={selectRandomNumber}
              disabled={roundStarted}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                roundStarted 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {roundStarted ? 'Round in Progress...' : 'Select Random Number'}
            </button>
          )}
        </div>
        {/* Game Instructions */}
        <div className="p-4 border rounded-lg bg-blue-500/10 border-blue-500/30">
          <h3 className="mb-2 font-semibold text-blue-300">Host Instructions</h3>
          <ul className="space-y-1 text-sm text-blue-200">
            <li>• Click "Start Game" to begin calling numbers automatically every 40 seconds</li>
            <li>• Click any number on the board to call it manually</li>
            <li>• Monitor the leaderboard and verify winners in the Winners panel</li>
            <li>• Share the game code <strong>{gameCode}</strong> with players to join</li>
          </ul>
        </div>
      </div>

        {/* Main Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Complete Board */}
          <div className="space-y-6 lg:col-span-2">
            <CompleteBoard
              selectedNumbers={selectedNumbers}
              currentNumber={currentNumber}
              onNumberClick={handleNumberClick}
            />
          </div>
      {/* Main Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Tambola Board */}
        <div className="lg:col-span-2">
          <HostBoard
            numbers={tambolaNumbers}
            calledNumbers={calledNumbers}
            currentNumber={currentNumber}
            isGameActive={gameState === 'active'}
            onStartGame={handleStartGame}
            onPauseGame={handlePauseGame}
            onResetGame={handleResetGame}
            onNumberClick={handleNumberClick}
          />
        </div>

          {/* Right Column - Leaderboard and Winners */}
          <div className="space-y-6">
            <Leaderboard 
              players={leaderboard}
              gameTime={gameTime}
            />
            
            <WinnerPanel
              onVerifyWin={handleVerifyWin}
              onAwardPrize={handleAwardPrize}
            />
          </div>
        </div>
        {/* Right Column - Leaderboard and Winners */}
        <div className="space-y-6">
          <Leaderboard 
            players={players}
            gameStats={gameStats}
          />
          
          <WinnerPanel
            winners={winners}
            onVerifyWin={handleVerifyWin}
            onAwardPrize={handleAwardPrize}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-sm text-center text-slate-400">
        <p>Blockchain Tambola Host Dashboard v1.0</p>
        <p className="mt-1">Built with ❤️ by BlockchainClubVITB</p>
      </div>
    </div>
  )
}

export default HostDashboard
