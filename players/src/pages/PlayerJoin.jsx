import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Users, GamepadIcon, ArrowRight, BookOpen, Mail, CreditCard } from 'lucide-react'
import { gameService } from '../utils/gameService'

const PlayerJoin = ({ onJoin }) => {
  const [gameId, setGameId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [regNo, setRegNo] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleJoinGame = async (e) => {
    e.preventDefault()
    
    if (!gameId.trim() || !playerName.trim() || !regNo.trim() || !email.trim()) {
      alert('Please fill all fields')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    
    try {
      // Register player with Appwrite
      const result = await gameService.registerPlayer(gameId.trim().toUpperCase(), {
        name: playerName.trim(),
        regNo: regNo.trim(),
        email: email.trim()
      })

      if (result.success) {
        // Store player data locally
        localStorage.setItem('tambola_player', JSON.stringify({
          id: result.player.$id,
          gameId: gameId.trim().toUpperCase(),
          name: playerName.trim(),
          regNo: regNo.trim(),
          email: email.trim()
        }))

        // Call the onJoin callback
        onJoin(gameId.trim().toUpperCase(), playerName.trim(), result.player)
        
        // Navigate to game page
        navigate('/game')
      } else {
        alert(result.error || 'Failed to join game. Please try again.')
      }
    } catch (error) {
      console.error('Failed to join game:', error)
      alert('Failed to join game. Please check your connection and try again.')
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
        {/* Blockchain Club VITB Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Blockchain Club VITB" 
              className="w-10 h-10 object-contain"
            />
            <div className="text-center">
              <h1 className="text-xl font-bold gradient-text">Blockchain Club VITB</h1>
            </div>
          </div>
        </div>

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
          <p className="text-gray-400">
            Join an exciting game of Tambola!
          </p>
        </div>

        {/* Join Form */}
        <div className="card p-8 mb-6">
          <form onSubmit={handleJoinGame} className="space-y-6">
            <div>
              <label htmlFor="gameId" className="block text-sm font-medium text-gray-300 mb-2">
                Game ID
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  id="gameId"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value.toUpperCase())}
                  placeholder="Enter Game ID"
                  className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-300 mb-2">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="regNo" className="block text-sm font-medium text-gray-300 mb-2">
                Registration Number
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  id="regNo"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  placeholder="Enter your registration number"
                  className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !gameId.trim() || !playerName.trim() || !regNo.trim() || !email.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
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
        <div className="text-center mt-8 text-sm text-gray-500">
          Need a Game ID? Ask your game host to share it with you.
        </div>
      </div>
    </div>
  )
}

export default PlayerJoin
