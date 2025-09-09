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
  GamepadIcon
} from 'lucide-react'
import PlayerTicket from '../components/PlayerTicket'

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
    gameStartTime: null
  })

  // Redirect if not joined
  useEffect(() => {
    if (!isJoined || !gameId || !playerName) {
      navigate('/')
      return
    }

    // Generate a sample ticket for the player
    generatePlayerTicket()
    
    // Simulate game state updates (in real app, this would be via WebSocket)
    simulateGameUpdates()
  }, [isJoined, gameId, playerName, navigate])

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

  if (!isJoined) {
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
                {gameInfo.totalPlayers > 0 && (
                  <span>{gameInfo.totalPlayers} players</span>
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

        {/* Game Status */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                gameState === 'waiting' ? 'bg-yellow-500' :
                gameState === 'playing' ? 'bg-green-500' : 'bg-gray-500'
              }`}></div>
              <span className="font-medium">
                {gameState === 'waiting' ? 'Waiting for Game' :
                 gameState === 'playing' ? 'Game in Progress' : 'Game Finished'}
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
              <span>Wins: {wins.length}</span>
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

        {gameState === 'playing' && (
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
