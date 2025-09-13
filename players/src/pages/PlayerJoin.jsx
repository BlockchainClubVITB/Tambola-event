import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Users, GamepadIcon, ArrowRight, BookOpen, Mail, CreditCard } from 'lucide-react'
import { toast } from 'react-hot-toast'
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
      toast.error('Please fill all fields')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
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
          name: result.player.name,
          regNo: result.player.regNo,
          email: result.player.email,
          score: result.player.score || 0
        }))

        // Show appropriate message
        if (result.isReturning) {
          toast.success('Welcome back! Returning to your game...')
        } else {
          toast.success('Successfully joined the game!')
        }

        // Call the onJoin callback
        onJoin(gameId.trim().toUpperCase(), result.player.name, result.player)
        
        // Navigate to game page
        navigate('/game')
      } else {
        toast.error(result.error || 'Failed to join game. Please try again.')
      }
    } catch (error) {
      console.error('Failed to join game:', error)
      toast.error('Failed to join game. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewInstructions = () => {
    navigate('/instructions')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center p-2 sm:p-4 lg:p-6">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
        {/* Header with Logo, Club Name and Decrypt2win in vertical order */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex justify-center mb-3">
            <img 
              src="/logo.png" 
              alt="Blockchain Club VITB" 
              className="object-contain w-12 h-12 sm:w-16 sm:h-16"
            />
          </div>
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-300 to-white bg-clip-text text-transparent mb-2" style={{fontFamily: 'Fira Code, monospace'}}>
            Blockchain Club VITB
          </h1>
          <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-300 to-white bg-clip-text text-transparent" style={{fontFamily: 'Fira Code, monospace'}}>
            Decrypt2win
          </h2>
        </div>

        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="p-3 sm:p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
              <GamepadIcon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-300" />
            </div>
          </div>
          <h1 className="mb-2 text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-300 to-white bg-clip-text text-transparent" style={{fontFamily: 'Fira Code, monospace'}}>
            Player
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Join an exciting game of Tambola!
          </p>
        </div>

        {/* Join Form */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
          <form onSubmit={handleJoinGame} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="gameId" className="block mb-2 text-sm font-medium text-gray-300">
                Game ID
              </label>
              <div className="relative">
                <Users className="absolute w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="text"
                  id="gameId"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value.toUpperCase())}
                  placeholder="Enter Game ID"
                  className="w-full py-2.5 sm:py-3 pl-10 sm:pl-12 pr-3 sm:pr-4 text-white placeholder-gray-500 transition-all bg-gray-800/80 border border-gray-600 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 text-sm sm:text-base"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="playerName" className="block mb-2 text-sm font-medium text-gray-300">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full py-2.5 sm:py-3 pl-10 sm:pl-12 pr-3 sm:pr-4 text-white placeholder-gray-500 transition-all bg-gray-800/80 border border-gray-600 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 text-sm sm:text-base"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="regNo" className="block mb-2 text-sm font-medium text-gray-300">
                Registration Number
              </label>
              <div className="relative">
                <CreditCard className="absolute w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="text"
                  id="regNo"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  placeholder="Enter your registration number"
                  className="w-full py-2.5 sm:py-3 pl-10 sm:pl-12 pr-3 sm:pr-4 text-white placeholder-gray-500 transition-all bg-gray-800/80 border border-gray-600 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 text-sm sm:text-base"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full py-2.5 sm:py-3 pl-10 sm:pl-12 pr-3 sm:pr-4 text-white placeholder-gray-500 transition-all bg-gray-800/80 border border-gray-600 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 text-sm sm:text-base"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !gameId.trim() || !playerName.trim() || !regNo.trim() || !email.trim()}
              className="flex items-center justify-center w-full gap-2 px-4 sm:px-6 py-2.5 sm:py-3 font-semibold text-white transition-all duration-300 bg-gradient-to-r from-gray-700 to-black hover:from-gray-600 hover:to-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 rounded-full border-white/30 border-t-white animate-spin"></div>
                  Joining Game...
                </>
              ) : (
                <>
                  Join Game
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Instructions Link */}
        <div className="text-center mb-4 sm:mb-6">
          <button
            onClick={handleViewInstructions}
            className="inline-flex items-center gap-2 font-medium text-gray-300 transition-colors hover:text-white text-sm sm:text-base"
          >
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            How to Play Tambola
          </button>
        </div>

        {/* Footer */}
        <div className="text-xs sm:text-sm text-center text-gray-500 px-2">
          Need a Game ID? Ask your game host to share it with you.
        </div>
      </div>
    </div>
  )
}

export default PlayerJoin
