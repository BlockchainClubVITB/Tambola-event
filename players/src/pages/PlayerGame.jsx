import React, { useState, useEffect } from 'react'
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
  Loader
} from 'lucide-react'
import PlayerTicket from '../components/PlayerTicket'
import { playerGameService } from '../services/playerGameService'

const PlayerGame = ({ gameId, playerName, player, isJoined }) => {
  const navigate = useNavigate()
  
  // Game state
  const [game, setGame] = useState(null)
  const [gameState, setGameState] = useState('waiting') // waiting, playing, finished
  const [currentRound, setCurrentRound] = useState(null)
  const [currentNumber, setCurrentNumber] = useState(null)
  const [calledNumbers, setCalledNumbers] = useState([])
  const [roundTimer, setRoundTimer] = useState(null)
  const [roundPhase, setRoundPhase] = useState('') // ready, active, scoring, completed
  
  // Player state
  const [playerData, setPlayerData] = useState(player)
  const [playerTicket, setPlayerTicket] = useState(null)
  const [markedNumbers, setMarkedNumbers] = useState(new Set())
  const [leaderboard, setLeaderboard] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  
  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Redirect if not joined
  useEffect(() => {
    if (!isJoined || !gameId || !playerName || !player) {
      navigate('/')
      return
    }

    initializeGame()
  }, [isJoined, gameId, playerName, player, navigate])

  const initializeGame = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Get game information
      const gameData = await playerGameService.getGameByCode(gameId)
      setGame(gameData)
      setGameState(gameData.status)
      setCalledNumbers(gameData.selectedNumbers || [])
      setCurrentNumber(gameData.currentNumber)

      // Get current round if any
      const round = await playerGameService.getCurrentRound(gameData.$id)
      if (round) {
        setCurrentRound(round)
        setRoundPhase(round.status)
        setCurrentNumber(round.selectedNumber)
      }

      // Load leaderboard
      await loadLeaderboard(gameData.$id)

      // Generate ticket for player
      generatePlayerTicket()

      // Subscribe to updates
      subscribeToUpdates(gameData.$id)
    } catch (error) {
      console.error('Error initializing game:', error)
      setError(error.message || 'Failed to load game')
    } finally {
      setIsLoading(false)
    }
  }

  const loadLeaderboard = async (gameId) => {
    try {
      const players = await playerGameService.getLeaderboard(gameId)
      setLeaderboard(players)
      
      // Update current player data
      const updatedPlayer = players.find(p => p.$id === player.$id)
      if (updatedPlayer) {
        setPlayerData(updatedPlayer)
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    }
  }

  const subscribeToUpdates = (gameId) => {
    // Subscribe to game updates
    const gameUnsubscribe = playerGameService.subscribeToGame(gameId, (response) => {
      const updatedGame = response.payload
      setGame(updatedGame)
      setGameState(updatedGame.status)
      setCalledNumbers(updatedGame.selectedNumbers || [])
      setCurrentNumber(updatedGame.currentNumber)
    })

    // Subscribe to rounds updates
    const roundsUnsubscribe = playerGameService.subscribeToRounds(gameId, (response) => {
      const round = response.payload
      setCurrentRound(round)
      setRoundPhase(round.status)
      setCurrentNumber(round.selectedNumber)
      setHasAnswered(false)
      setSelectedAnswer(null)
      
      // Handle round timing
      handleRoundTiming(round)
    })

    // Subscribe to leaderboard updates
    const leaderboardUnsubscribe = playerGameService.subscribeToLeaderboard(gameId, () => {
      loadLeaderboard(gameId)
    })

    // Cleanup on unmount
    return () => {
      gameUnsubscribe()
      roundsUnsubscribe()
      leaderboardUnsubscribe()
    }
  }

  const handleRoundTiming = (round) => {
    if (!round || !round.question) return

    let timeLeft = 0
    let timerMessage = ''

    switch (round.status) {
      case 'ready':
        timeLeft = 5
        timerMessage = 'Get Ready!'
        break
      case 'active':
        timeLeft = 30
        timerMessage = 'Answer Time!'
        break
      case 'scoring':
        timeLeft = 5
        timerMessage = 'Calculating Scores...'
        break
      default:
        return
    }

    setRoundTimer({ timeLeft, message: timerMessage })

    const interval = setInterval(() => {
      setRoundTimer(prev => {
        if (!prev || prev.timeLeft <= 1) {
          clearInterval(interval)
          return null
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })
    }, 1000)

    // Clear timer when round changes
    setTimeout(() => {
      clearInterval(interval)
      setRoundTimer(null)
    }, timeLeft * 1000)
  }

  const generatePlayerTicket = () => {
    // Generate a random Tambola ticket (3x9 grid with 15 numbers)
    const ticket = Array(3).fill(null).map(() => Array(9).fill(null))
    const columns = [
      [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
      [50, 59], [60, 69], [70, 79], [80, 90]
    ]

    // Fill 5 numbers per row, ensuring each column constraint
    for (let row = 0; row < 3; row++) {
      const selectedCols = []
      while (selectedCols.length < 5) {
        const col = Math.floor(Math.random() * 9)
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

  const handleAnswerSubmit = async (optionIndex) => {
    if (!currentRound || !currentRound.question || hasAnswered || roundPhase !== 'active') {
      return
    }

    try {
      setSelectedAnswer(optionIndex)
      setHasAnswered(true)

      await playerGameService.submitAnswer({
        roundId: currentRound.$id,
        playerId: player.$id,
        playerName: playerName,
        selectedOption: optionIndex,
        submissionTime: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error submitting answer:', error)
      setError('Failed to submit answer')
      setSelectedAnswer(null)
      setHasAnswered(false)
    }
  }

  const handleClaimWin = (pattern) => {
    // In real app, this would verify with server
    alert(`Claiming ${pattern}! (This would be verified by the host in a real game)`)
  }

  const handleLeaveGame = async () => {
    if (confirm('Are you sure you want to leave the game?')) {
      try {
        await playerGameService.updatePlayerStatus(player.$id, false)
        navigate('/')
      } catch (error) {
        console.error('Error leaving game:', error)
        navigate('/')
      }
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading game...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-4">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={initializeGame}
              className="btn-primary mr-2"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              Leave Game
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!isJoined || !game) {
    return null
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <GamepadIcon className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Tambola Game</h1>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {playerName}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Game: {gameId}
                </span>
                <span>{leaderboard.length} players</span>
                {playerData && (
                  <span className="text-yellow-400">Score: {playerData.score}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleLeaveGame}
            className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Leave Game
          </button>
        </div>

        {/* Round Timer */}
        {roundTimer && (
          <div className="card p-4 text-center mb-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30">
            <div className="text-lg font-semibold text-blue-300 mb-2">{roundTimer.message}</div>
            <div className="text-3xl font-bold text-white">{roundTimer.timeLeft}s</div>
          </div>
        )}

        {/* Game Status */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                gameState === 'waiting' ? 'bg-yellow-500' :
                gameState === 'active' ? 'bg-green-500' : 'bg-gray-500'
              }`}></div>
              <span className="font-medium">
                {gameState === 'waiting' ? 'Waiting for Game' :
                 gameState === 'active' ? 'Game in Progress' : 'Game Finished'}
              </span>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>Numbers Called: {calledNumbers.length}/90</span>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span>Rank: #{leaderboard.findIndex(p => p.$id === player.$id) + 1}</span>
            </div>
          </div>
        </div>

        {gameState === 'waiting' && (
          <div className="card p-8 text-center mb-6">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Waiting for Game to Start</h2>
            <p className="text-slate-400">The host will begin the game shortly...</p>
          </div>
        )}

        {/* Question Display */}
        {currentRound && currentRound.question && roundPhase === 'active' && (
          <div className="card p-6 mb-6">
            <div className="text-center mb-6">
              <div className="text-sm text-slate-400 mb-2">Round {currentRound.roundNumber} - Number {currentRound.selectedNumber}</div>
              <h3 className="text-xl font-semibold text-white mb-4">{currentRound.question.question}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentRound.question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSubmit(index)}
                    disabled={hasAnswered}
                    className={`p-4 rounded-lg border transition-all text-left ${
                      hasAnswered && selectedAnswer === index
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : hasAnswered
                        ? 'bg-slate-800/50 border-slate-600/50 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-800/50 border-slate-600/50 text-white hover:border-blue-500/50 hover:bg-blue-500/10'
                    }`}
                  >
                    <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                  </button>
                ))}
              </div>
              
              {hasAnswered && (
                <div className="mt-4 flex items-center justify-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>Answer submitted!</span>
                </div>
              )}
            </div>
          </div>
        )}

        {gameState === 'active' && (
          <>
            {/* Current Number Display */}
            {currentNumber && (
              <div className="card p-6 text-center mb-6">
                <div className="text-sm text-slate-400 mb-2">Current Number</div>
                <div className="text-6xl font-bold gradient-text mb-2">
                  {currentNumber}
                </div>
                <div className="text-slate-300">
                  {calledNumbers.length > 1 && (
                    <span>Previous: {calledNumbers[calledNumbers.length - 2]}</span>
                  )}
                </div>
              </div>
            )}

            {/* Player Ticket */}
            {playerTicket && (
              <div className="mb-6">
                <PlayerTicket
                  ticket={playerTicket}
                  calledNumbers={calledNumbers}
                  markedNumbers={markedNumbers}
                  onNumberMark={handleNumberMark}
                  onClaimWin={handleClaimWin}
                />
              </div>
            )}

            {/* Recent Numbers */}
            <div className="card p-4">
              <h3 className="font-semibold mb-3">Recently Called Numbers</h3>
              <div className="flex flex-wrap gap-2">
                {calledNumbers.slice(-10).reverse().map((number, index) => (
                  <div
                    key={number}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {number}
                  </div>
                ))}
                {calledNumbers.length === 0 && (
                  <div className="text-slate-400 text-sm">No numbers called yet</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Wins Display */}
        {wins.length > 0 && (
          <div className="card p-4 mt-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Your Wins
            </h3>
            <div className="space-y-2">
              {wins.map((win, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>{win.pattern}</span>
                  <span className="text-slate-400">
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
