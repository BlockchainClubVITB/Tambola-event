import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Users, GamepadIcon, ArrowRight, BookOpen, Mail, Hash } from 'lucide-react'
import { playerGameService } from '../services/playerGameService'

const PlayerJoin = ({ onJoin }) => {
  const [gameId, setGameId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleJoinGame = async (e) => {
    e.preventDefault()
    
    if (!gameId.trim() || !playerName.trim()) {
      alert('Please enter both Game ID and your name')
      return
    }

    setIsLoading(true)
    
    try {
      // Simulate API call to join game
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Call the onJoin callback
      onJoin(gameId.trim(), playerName.trim())
      
      // Navigate to game page
      navigate('/game')
    } catch (error) {
      console.error('Failed to join game:', error)
      alert('Failed to join game. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewInstructions = () => {
    navigate('/instructions')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gray-800 border border-gray-600 rounded-full">
              <GamepadIcon className="w-12 h-12 text-gray-300" />
            </div>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Tambola Player
          </h1>
          <p className="text-slate-400">
            Join an exciting game of Tambola!
          </p>
        </div>

        {/* Join Form */}
        <div className="card p-8 mb-6">
          <form onSubmit={handleJoinGame} className="space-y-6">
            <div>
              <label htmlFor="gameId" className="block text-sm font-medium text-slate-300 mb-2">
                Game ID
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="text"
                  id="gameId"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  placeholder="Enter Game ID"
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-slate-300 mb-2">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !gameId.trim() || !playerName.trim()}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Joining Game...
                </>
              ) : (
                <>
                  Join Game
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Instructions Link */}
        <div className="text-center">
          <button
            onClick={handleViewInstructions}
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            <BookOpen className="w-5 h-5" />
            How to Play Tambola
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-500">
          Need a Game ID? Ask your game host to share it with you.
        </div>
      </div>
    </div>
  )
}

export default PlayerJoin
