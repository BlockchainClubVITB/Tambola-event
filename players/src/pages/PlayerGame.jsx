import React, { useState, useEffect, useRef } from 'react'
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
  GamepadIcon
} from 'lucide-react'
import PlayerTicket from '../components/PlayerTicket'
<<<<<<< Updated upstream
=======
import CompleteBoard from '../components/CompleteBoard'
import { gameService } from '../utils/gameService'
import { playerGameService } from '../services/playerGameService'
>>>>>>> Stashed changes

const PlayerGame = ({ gameId, playerName, isJoined }) => {
  const navigate = useNavigate()
  const [gameState, setGameState] = useState('waiting') // waiting, playing, finished
  const [currentNumber, setCurrentNumber] = useState(null)
  const [calledNumbers, setCalledNumbers] = useState([])
  const [playerTicket, setPlayerTicket] = useState(null)
  const [markedNumbers, setMarkedNumbers] = useState(new Set())
  const [wins, setWins] = useState([])
  const [gameInfo, setGameInfo] = useState({
    totalPlayers: 0,
<<<<<<< Updated upstream
    gameStartTime: null
  })
=======
    gameStartTime: null,
    gameData: null
    gameStartTime: null,
    gameData: null
  })
  const [currentRound, setCurrentRound] = useState(null)
  const [roundPhase, setRoundPhase] = useState('prepare') // prepare, active, scoring
  const [timeLeft, setTimeLeft] = useState(0)
  const [playerData, setPlayerData] = useState(null)
  const pollIntervalRef = useRef(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  
  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
>>>>>>> Stashed changes

  // Redirect if not joined
  useEffect(() => {
    if (!isJoined || !gameId || !playerName) {
      navigate('/')
      return
    }

<<<<<<< Updated upstream
    // Generate a sample ticket for the player
    generatePlayerTicket()
    
    // Simulate game state updates (in real app, this would be via WebSocket)
    simulateGameUpdates()
  }, [isJoined, gameId, playerName, navigate])
=======
    // Load player data from localStorage
    const storedPlayer = localStorage.getItem('tambola_player')
    if (storedPlayer) {
      setPlayerData(JSON.parse(storedPlayer))
    }

    // Load player data from localStorage
    const storedPlayer = localStorage.getItem('tambola_player')
    if (storedPlayer) {
      setPlayerData(JSON.parse(storedPlayer))
    }

    // Generate a sample ticket for the player
    generatePlayerTicket()
    
    // Start polling for game updates
    startGamePolling()

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
    // Start polling for game updates
    startGamePolling()

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [isJoined, gameId, playerName, navigate])

  const startGamePolling = () => {
    // Poll for game updates every 2 seconds
    pollIntervalRef.current = setInterval(async () => {
      await fetchGameState()
    }, 2000)

    // Initial fetch
    fetchGameState()
  }

  const fetchGameState = async () => {
    try {
      const gameResult = await gameService.getGame(gameId)
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

        // Get current round info
        if (game.status === 'active') {
          const roundResult = await gameService.getCurrentRound(gameId)
          if (roundResult.success && roundResult.round) {
            setCurrentRound(roundResult.round)
            setCurrentNumber(roundResult.round.currentNumber)
            setRoundPhase(roundResult.round.phase || 'prepare')
            
            // Calculate time left
            const now = Date.now()
            const roundStart = new Date(roundResult.round.startTime).getTime()
            const phaseTime = roundResult.round.phase === 'prepare' ? 5000 : 
                            roundResult.round.phase === 'active' ? 30000 : 5000
            const elapsed = now - roundStart
            const remaining = Math.max(0, Math.ceil((phaseTime - elapsed) / 1000))
            setTimeLeft(remaining)
          }
        }

        // Update called numbers from game state
        if (game.calledNumbers) {
          setCalledNumbers(game.calledNumbers)
        }
      }
    } catch (error) {
      console.error('Failed to fetch game state:', error)
    }
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
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
  const simulateGameUpdates = () => {
    // Simulate joining game
    setTimeout(() => {
      setGameInfo({
        totalPlayers: Math.floor(Math.random() * 20) + 5,
        gameStartTime: new Date()
      })
      setGameState('playing')
    }, 2000)

    // Simulate number calls
    const allNumbers = Array.from({ length: 90 }, (_, i) => i + 1)
    let calledCount = 0

    const callNumber = () => {
      if (calledCount < allNumbers.length && gameState !== 'finished') {
        const availableNumbers = allNumbers.filter(num => !calledNumbers.includes(num))
        if (availableNumbers.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableNumbers.length)
          const newNumber = availableNumbers[randomIndex]
          
          setCurrentNumber(newNumber)
          setCalledNumbers(prev => [...prev, newNumber])
          calledCount++
        }
      }
    }

    // Start calling numbers after game starts
    setTimeout(() => {
      const interval = setInterval(callNumber, 3000)
      return () => clearInterval(interval)
    }, 3000)
  }
=======


>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
=======
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
>>>>>>> Stashed changes
  const handleClaimWin = (pattern) => {
    // In real app, this would verify with server
    alert(`Claiming ${pattern}! (This would be verified by the host in a real game)`)
    setWins(prev => [...prev, { pattern, time: new Date() }])
  }

  const handleLeaveGame = () => {
    if (confirm('Are you sure you want to leave the game?')) {
      navigate('/')
    }
  }

<<<<<<< Updated upstream
  if (!isJoined) {
=======
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
          <p className="text-slate-300">Loading game...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md text-center">
          <div className="p-6 mb-4 border rounded-lg bg-red-500/10 border-red-500/30">
            <p className="mb-4 text-red-400">{error}</p>
            <button
              onClick={initializeGame}
              className="mr-2 btn-primary"
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
>>>>>>> Stashed changes
    return null
  }

  return (
    <div className="min-h-screen p-4 text-white bg-black">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 mb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <GamepadIcon className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Tambola Game</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {playerName}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Game: {gameId}
                </span>
                {gameInfo.totalPlayers > 0 && (
                  <span>{gameInfo.totalPlayers} players</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleLeaveGame}
            className="flex items-center gap-2 px-4 py-2 text-red-400 transition-colors border rounded-lg hover:text-red-300 border-red-500/30 hover:border-red-500/50"
          >
            <LogOut className="w-4 h-4" />
            Leave Game
          </button>
        </div>

<<<<<<< Updated upstream
=======
        {/* Round Timer */}
        {roundTimer && (
          <div className="p-4 mb-6 text-center card bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30">
            <div className="mb-2 text-lg font-semibold text-blue-300">{roundTimer.message}</div>
            <div className="text-3xl font-bold text-white">{roundTimer.timeLeft}s</div>
          </div>
        )}

>>>>>>> Stashed changes
        {/* Game Status */}
        <div className="grid gap-4 mb-6 md:grid-cols-3">
          <div className="p-4 bg-gray-800 border border-gray-600 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                gameState === 'waiting' ? 'bg-yellow-500' :
                gameState === 'playing' ? 'bg-green-500' : 'bg-gray-500'
              }`}></div>
              <span className="font-medium text-white">
              <span className="font-medium text-white">
                {gameState === 'waiting' ? 'Waiting for Game' :
                 gameState === 'playing' ? 'Game in Progress' : 'Game Finished'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-gray-800 border border-gray-600 rounded-xl">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-white">Numbers Called: {calledNumbers.length}/90</span>
              <span className="text-white">Numbers Called: {calledNumbers.length}/90</span>
            </div>
          </div>

          <div className="p-4 bg-gray-800 border border-gray-600 rounded-xl">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-yellow-400" />
<<<<<<< Updated upstream
              <span>Wins: {wins.length}</span>
=======
              <span className="text-white">Wins: {wins.length}</span>
              <span>Rank: #{leaderboard.findIndex(p => p.$id === player.$id) + 1}</span>
>>>>>>> Stashed changes
            </div>
          </div>
        </div>

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

<<<<<<< Updated upstream
        {gameState === 'playing' && (
=======
        {/* Question Display */}
        {currentRound && currentRound.question && roundPhase === 'active' && (
          <div className="p-6 mb-6 card">
            <div className="mb-6 text-center">
              <div className="mb-2 text-sm text-slate-400">Round {currentRound.roundNumber} - Number {currentRound.selectedNumber}</div>
              <h3 className="mb-4 text-xl font-semibold text-white">{currentRound.question.question}</h3>
              
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <div className="flex items-center justify-center gap-2 mt-4 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>Answer submitted!</span>
                </div>
              )}
            </div>
          </div>
        )}

        {gameState === 'active' && (
>>>>>>> Stashed changes
          <>
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
              />
            </div>

            {/* Complete Board */}
            <div className="mb-6">
              <CompleteBoard 
                calledNumbers={calledNumbers}
                currentNumber={currentNumber}
              />
            </div>

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
            <div className="p-4 bg-gray-800 border border-gray-600 rounded-xl">
              <h3 className="mb-3 font-semibold text-white">Recently Called Numbers</h3>
              <div className="flex flex-wrap gap-2">
                {calledNumbers.slice(-10).reverse().map((number, index) => (
                  <div
                    key={number}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
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
