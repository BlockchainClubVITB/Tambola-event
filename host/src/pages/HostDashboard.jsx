import React, { useState, useEffect } from 'react'
import HostBoard from '../components/HostBoard'
import Leaderboard from '../components/Leaderboard'
import WinnerPanel from '../components/WinnerPanel'
import { generateGameCode, generateTambolaBoard } from '../utils/gameUtils'
import { getRandomQuestion } from '../utils/questions'
import { gameService } from '../services/gameService'
import { playerService } from '../services/playerService'
import { Share2, Users, Settings, Download } from 'lucide-react'

const HostDashboard = () => {
  // Game State - now using Appwrite
  const [game, setGame] = useState(null)
  const [gameState, setGameState] = useState('waiting') // 'waiting', 'active', 'paused', 'ended'
  const [tambolaNumbers] = useState(generateTambolaBoard())
  const [calledNumbers, setCalledNumbers] = useState([])
  const [currentNumber, setCurrentNumber] = useState(null)
  const [gameTime, setGameTime] = useState(0)
  const [currentRound, setCurrentRound] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Players Data - now from Appwrite
  const [players, setPlayers] = useState([])
  const [leaderboardStats, setLeaderboardStats] = useState({
    totalPlayers: 0,
    onlinePlayers: 0,
    averageScore: 0,
    topScore: 0
  })

  // Initialize game on component mount
  useEffect(() => {
    initializeGame()
  }, [])

  const initializeGame = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // Create new game in Appwrite
      const newGame = await gameService.createGame()
      setGame(newGame)
      setGameState(newGame.status)
      setCalledNumbers(newGame.selectedNumbers || [])
      setCurrentNumber(newGame.currentNumber)
      
      // Load initial players
      await loadPlayers(newGame.$id)
      
      // Subscribe to real-time updates
      subscribeToUpdates(newGame.$id)
    } catch (error) {
      console.error('Error initializing game:', error)
      setError('Failed to initialize game. Please refresh and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadPlayers = async (gameId) => {
    try {
      const leaderboard = await playerService.getGameLeaderboard(gameId)
      setPlayers(leaderboard.players)
      setLeaderboardStats(leaderboard.stats)
    } catch (error) {
      console.error('Error loading players:', error)
    }
  }

  const subscribeToUpdates = (gameId) => {
    // Subscribe to game updates
    const gameUnsubscribe = gameService.subscribeToGame(gameId, (response) => {
      const updatedGame = response.payload
      setGame(updatedGame)
      setGameState(updatedGame.status)
      setCalledNumbers(updatedGame.selectedNumbers || [])
      setCurrentNumber(updatedGame.currentNumber)
    })

    // Subscribe to player updates
    const playersUnsubscribe = playerService.subscribeToGamePlayers(gameId, () => {
      loadPlayers(gameId)
    })

    // Subscribe to rounds updates
    const roundsUnsubscribe = gameService.subscribeToRounds(gameId, (response) => {
      setCurrentRound(response.payload)
    })

    // Cleanup subscriptions on unmount
    return () => {
      gameUnsubscribe()
      playersUnsubscribe()
      roundsUnsubscribe()
    }
  }
  // Winners state
  const [winners, setWinners] = useState({
    firstLine: null,
    secondLine: null,
    thirdLine: null,
    fullHouse: null,
    earlyFive: null,
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

  const handleStartGame = async () => {
    if (!game) return
    
    try {
      setIsLoading(true)
      const status = gameState === 'waiting' || gameState === 'paused' ? 'active' : gameState
      await gameService.updateGameStatus(game.$id, status)
      setGameState(status)
    } catch (error) {
      console.error('Error starting game:', error)
      setError('Failed to start game')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePauseGame = async () => {
    if (!game) return
    
    try {
      setIsLoading(true)
      await gameService.updateGameStatus(game.$id, 'paused')
      setGameState('paused')
    } catch (error) {
      console.error('Error pausing game:', error)
      setError('Failed to pause game')
    } finally {
      setIsLoading(false)
    }
  }

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
  }

  const handleNumberClick = async (number) => {
    if (!game || gameState !== 'active' || calledNumbers.includes(number) || isLoading) {
      return
    }

    try {
      setIsLoading(true)
      
      // Get a question for this round
      const question = getRandomQuestion()
      
      // Create new round in Appwrite
      const round = await gameService.createRound(game.$id, number, question)
      setCurrentRound(round)
      
      // Start round timing sequence
      await startRoundSequence(round)
    } catch (error) {
      console.error('Error calling number:', error)
      setError('Failed to call number')
    } finally {
      setIsLoading(false)
    }
  }

  const startRoundSequence = async (round) => {
    try {
      // Phase 1: Get Ready (5 seconds)
      await gameService.updateRoundStatus(round.$id, 'ready')
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Phase 2: Answer Time (30 seconds)
      await gameService.updateRoundStatus(round.$id, 'active')
      await new Promise(resolve => setTimeout(resolve, 30000))

      // Phase 3: Score Update (5 seconds)
      await gameService.updateRoundStatus(round.$id, 'scoring')
      
      // Process answers and update scores
      if (round.question) {
        await playerService.processRoundAnswers(round.$id, round.question.correct)
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Phase 4: Round Complete
      await gameService.updateRoundStatus(round.$id, 'completed')
      
      // Refresh leaderboard
      await loadPlayers(game.$id)
    } catch (error) {
      console.error('Error in round sequence:', error)
    }
  }

  const handleVerifyWin = (category, winner) => {
    setWinners(prev => ({
      ...prev,
      [category]: { ...winner, verified: true }
    }))
  }

  const handleAwardPrize = (category, winner) => {
    console.log(`Awarding prize for ${category} to ${winner.playerName}`)
  }

  const handleShareGame = () => {
    if (!game) return
    
    const shareText = `Join my Blockchain Tambola game with code: ${game.gameCode}`
    if (navigator.share) {
      navigator.share({
        title: 'Join my Blockchain Tambola Game!',
        text: shareText,
        url: window.location.origin
      })
    } else {
      navigator.clipboard.writeText(shareText)
      alert('Game code copied to clipboard!')
    }
  }

  const gameStats = {
    totalPlayers: leaderboardStats.totalPlayers,
    questionsAnswered: calledNumbers.length,
    averageScore: leaderboardStats.averageScore,
    gameTimeElapsed: formatTime(gameTime)
  }

  // Show loading state
  if (isLoading && !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Initializing game...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error && !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-4">
            <p className="text-red-400 mb-4">{error}</p>
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

  return (
    <div className="min-h-screen p-4">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Game Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Host Dashboard</h1>
            <div className="flex items-center space-x-6 text-lg">
              <div className="flex items-center space-x-2">
                <span className="text-slate-300">Game Code:</span>
                <span className="font-mono bg-slate-800/50 px-3 py-1 rounded border border-blue-500/30 text-blue-400">
                  {game?.gameCode || 'Loading...'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-300">Time:</span>
                <span className="font-mono text-green-400">{formatTime(gameTime)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  gameState === 'active' ? 'bg-green-400' :
                  gameState === 'paused' ? 'bg-yellow-400' :
                  gameState === 'ended' ? 'bg-red-400' : 'bg-blue-400'
                }`}></div>
                <span className="capitalize text-slate-300">{gameState}</span>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleShareGame}
              className="btn-secondary flex items-center space-x-2"
              disabled={!game}
            >
              <Share2 className="w-4 h-4" />
              <span>Share Game</span>
            </button>
            
            <div className="flex items-center space-x-2 bg-slate-800/30 px-4 py-2 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="font-bold">{players.length}</span>
              <span className="text-slate-300">Players</span>
            </div>
          </div>
        </div>

        {/* Game Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h3 className="font-semibold text-blue-300 mb-2">Host Instructions</h3>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• Click "Start Game" to begin calling numbers automatically every 40 seconds</li>
            <li>• Click any number on the board to call it manually</li>
            <li>• Monitor the leaderboard and verify winners in the Winners panel</li>
            <li>• Share the game code <strong>{game?.gameCode || 'Loading...'}</strong> with players to join</li>
            {currentRound && (
              <li className="text-yellow-300">• Round {currentRound.roundNumber} in progress - Status: {currentRound.status}</li>
            )}
          </ul>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Tambola Board */}
        <div className="lg:col-span-2">
          <HostBoard
            numbers={tambolaNumbers}
            calledNumbers={calledNumbers}
            currentNumber={currentNumber}
            isGameActive={gameState === 'active'}
            isLoading={isLoading}
            onStartGame={handleStartGame}
            onPauseGame={handlePauseGame}
            onResetGame={handleResetGame}
            onNumberClick={handleNumberClick}
            currentRound={currentRound}
          />
        </div>

        {/* Right Column - Leaderboard and Winners */}
        <div className="space-y-6">
          <Leaderboard 
            players={players}
            gameStats={gameStats}
            isLoading={isLoading}
          />
          
          <WinnerPanel
            winners={winners}
            onVerifyWin={handleVerifyWin}
            onAwardPrize={handleAwardPrize}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-slate-400 text-sm">
        <p>Blockchain Tambola Host Dashboard v1.0</p>
        <p className="mt-1">Built with ❤️ by BlockchainClubVITB</p>
      </div>
    </div>
  )
}

export default HostDashboard
