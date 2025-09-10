import React, { useState, useEffect, useRef } from 'react'
import CompleteBoard from '../components/CompleteBoard'
import Leaderboard from '../components/Leaderboard'
import WinnerPanel from '../components/WinnerPanel'
import { gameService } from '../utils/gameService'
import { Share2, Users, Settings, Download, Play, Pause, RotateCcw, Clock } from 'lucide-react'

const HostDashboard = () => {
  // Game State
  const [gameId, setGameId] = useState(null)
  const [gameDoc, setGameDoc] = useState(null)
  const [gameState, setGameState] = useState('waiting') // 'waiting', 'active', 'paused', 'ended'
  const [selectedNumbers, setSelectedNumbers] = useState([])
  const [currentNumber, setCurrentNumber] = useState(null)
  const [currentRound, setCurrentRound] = useState(null)
  const [gameTime, setGameTime] = useState(0)
  const [players, setPlayers] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [roundPhase, setRoundPhase] = useState('idle') // 'idle', 'prepare', 'active', 'scoring'
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [roundStarted, setRoundStarted] = useState(false)

  // Polling interval
  const pollIntervalRef = useRef(null)

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
      const result = await gameService.createGame('Host Player')
      if (result.success) {
        setGameId(result.gameId)
        setGameDoc(result.game)
        setGameState('waiting')
        startPolling()
        console.log('Game created with ID:', result.gameId)
      }
    } catch (error) {
      console.error('Error initializing game:', error)
    }
  }

  // Select random number and start round workflow
  const selectRandomNumber = async () => {
    if (gameState !== 'waiting' && gameState !== 'active') return
    if (roundStarted) return // Prevent multiple clicks during round

    // Get available numbers (1-90 that haven't been called)
    const allNumbers = Array.from({ length: 90 }, (_, i) => i + 1)
    const availableNumbers = allNumbers.filter(num => !selectedNumbers.includes(num))
    
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
  }

  const handlePauseGame = () => {
    setGameState('paused')
  }

  const handleResetGame = () => {
    setGameState('waiting')
    setSelectedNumbers([])
    setCurrentNumber(null)
    setGameTime(0)
    setRoundPhase('idle')
    setTimeRemaining(0)
    setRoundStarted(false)
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
      alert('Game ID copied to clipboard!')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Host Dashboard</h1>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Game ID: <span className="font-mono text-blue-400">{gameId}</span>
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-green-400">{formatTime(gameTime)}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShareGame}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share Game ID
            </button>
            
            <button
              onClick={handleResetGame}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Game Status */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
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
              <span className="text-white">Numbers Called: {selectedNumbers.length}/90</span>
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

        {/* Random Number Selection Button */}
        <div className="mb-6 text-center">
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
              gameTime={gameTime}
            />
            
            <WinnerPanel
              onVerifyWin={handleVerifyWin}
              onAwardPrize={handleAwardPrize}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default HostDashboard
