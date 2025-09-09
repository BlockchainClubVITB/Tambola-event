import React, { useState, useEffect } from 'react'
import HostBoard from '../components/HostBoard'
import Leaderboard from '../components/Leaderboard'
import WinnerPanel from '../components/WinnerPanel'
import { generateGameCode, generateTambolaBoard } from '../utils/gameUtils'
import { getRandomQuestion } from '../utils/questions'
import { Share2, Users, Settings, Download } from 'lucide-react'

const HostDashboard = () => {
  // Game State
  const [gameCode] = useState(generateGameCode())
  const [gameState, setGameState] = useState('waiting') // 'waiting', 'active', 'paused', 'ended'
  const [tambolaNumbers] = useState(generateTambolaBoard())
  const [calledNumbers, setCalledNumbers] = useState([])
  const [currentNumber, setCurrentNumber] = useState(null)
  const [gameTime, setGameTime] = useState(0)

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
  }

  const handleNumberClick = (number) => {
    if (gameState === 'active' && !calledNumbers.includes(number)) {
      setCurrentNumber(number)
      setCalledNumbers(prev => [...prev, number])
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
    const shareText = `Join my Blockchain Tambola game with code: ${gameCode}`
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
    totalPlayers: players.length,
    questionsAnswered: calledNumbers.length,
    averageScore: players.length > 0 ? Math.round(players.reduce((sum, p) => sum + p.score, 0) / players.length) : 0,
    gameTimeElapsed: formatTime(gameTime)
  }

  return (
    <div className="min-h-screen p-4">
      {/* Game Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Host Dashboard</h1>
            <div className="flex items-center space-x-6 text-lg">
              <div className="flex items-center space-x-2">
                <span className="text-slate-300">Game Code:</span>
                <span className="font-mono bg-slate-800/50 px-3 py-1 rounded border border-blue-500/30 text-blue-400">
                  {gameCode}
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
            <li>• Share the game code <strong>{gameCode}</strong> with players to join</li>
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
            onStartGame={handleStartGame}
            onPauseGame={handlePauseGame}
            onResetGame={handleResetGame}
            onNumberClick={handleNumberClick}
          />
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
      <div className="mt-8 text-center text-slate-400 text-sm">
        <p>Blockchain Tambola Host Dashboard v1.0</p>
        <p className="mt-1">Built with ❤️ by BlockchainClubVITB</p>
      </div>
    </div>
  )
}

export default HostDashboard
