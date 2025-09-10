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
import CompleteBoard from '../components/CompleteBoard'
import { gameService } from '../utils/gameService'

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
    gameStartTime: null,
    gameData: null
  })
  const [currentRound, setCurrentRound] = useState(null)
  const [roundPhase, setRoundPhase] = useState('prepare') // prepare, active, scoring
  const [timeLeft, setTimeLeft] = useState(0)
  const [playerData, setPlayerData] = useState(null)
  const pollIntervalRef = useRef(null)

  // Redirect if not joined
  useEffect(() => {
    if (!isJoined || !gameId || !playerName) {
      navigate('/')
      return
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
          setCalledNumbers(game.calledNumbers.map(num => typeof num === 'string' ? parseInt(num) : num))
        }
      }
    } catch (error) {
      console.error('Failed to fetch game state:', error)
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

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Blockchain Club VITB Header */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Blockchain Club VITB" 
              className="w-8 h-8 object-contain"
            />
            <div className="text-center">
              <h1 className="text-lg font-bold gradient-text">Blockchain Club VITB</h1>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Tambola Player</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {playerName}
              </span>
              <span className="flex items-center gap-1">
                <GamepadIcon className="w-4 h-4" />
                Game: {gameId}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleLeaveGame}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Leave Game
          </button>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 border border-gray-600 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                gameState === 'waiting' ? 'bg-yellow-500' :
                gameState === 'playing' ? 'bg-green-500' : 'bg-gray-500'
              }`}></div>
              <span className="font-medium text-white">
                {gameState === 'waiting' ? 'Waiting' :
                 gameState === 'playing' ? 'Playing' : 'Finished'}
              </span>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-600 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-white">Numbers Called: {calledNumbers.length}/50</span>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-600 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-green-400" />
              <span className="text-white">Players: {gameInfo.totalPlayers}</span>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-600 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-white">Wins: {wins.length}</span>
            </div>
          </div>
        </div>

        {gameState === 'waiting' && (
          <div className="bg-gray-800 border border-gray-600 rounded-xl p-8 text-center mb-6">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2 text-white">Waiting for Game to Start</h2>
            <p className="text-gray-400">The host will begin the game shortly...</p>
            {gameInfo.totalPlayers > 0 && (
              <p className="text-gray-300 mt-2">{gameInfo.totalPlayers} players joined</p>
            )}
          </div>
        )}

        {gameState === 'playing' && (
          <>
            {/* Round Information */}
            {currentRound && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-400 mb-1">Round Phase</div>
                  <div className="text-lg font-semibold text-white capitalize">
                    {roundPhase}
                  </div>
                </div>
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-400 mb-1">Time Left</div>
                  <div className="text-lg font-semibold text-white">
                    {timeLeft}s
                  </div>
                </div>
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-400 mb-1">Round Number</div>
                  <div className="text-lg font-semibold text-white">
                    {currentRound.roundNumber || 1}
                  </div>
                </div>
              </div>
            )}

            {/* Current Number Display */}
            {currentNumber && (
              <div className="bg-gray-800 border border-gray-600 rounded-xl p-6 text-center mb-6">
                <div className="text-sm text-gray-400 mb-2">Current Number</div>
                <div className="text-6xl font-bold text-yellow-400 mb-2">
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
            <div className="bg-gray-800 border border-gray-600 rounded-xl p-4">
              <h3 className="font-semibold mb-3 text-white">Recently Called Numbers</h3>
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
                  <div className="text-gray-400 text-sm">No numbers called yet</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Wins Display */}
        {wins.length > 0 && (
          <div className="bg-gray-800 border border-gray-600 rounded-xl p-4 mt-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-white">
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
