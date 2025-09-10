import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
<<<<<<< Updated upstream
import { User, Users, GamepadIcon, ArrowRight, BookOpen } from 'lucide-react'
=======
import { User, Users, GamepadIcon, ArrowRight, BookOpen, Mail, CreditCard } from 'lucide-react'
import { gameService } from '../utils/gameService'
import { User, Users, GamepadIcon, ArrowRight, BookOpen, Mail, Hash } from 'lucide-react'
import { playerGameService } from '../services/playerGameService'
>>>>>>> Stashed changes

const PlayerJoin = ({ onJoin }) => {
  const [gameId, setGameId] = useState('')
  const [playerName, setPlayerName] = useState('')
<<<<<<< Updated upstream
=======
  const [regNo, setRegNo] = useState('')
  const [email, setEmail] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [email, setEmail] = useState('')
>>>>>>> Stashed changes
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleJoinGame = async (e) => {
    e.preventDefault()
    
<<<<<<< Updated upstream
    if (!gameId.trim() || !playerName.trim()) {
      alert('Please enter both Game ID and your name')
=======
    if (!gameId.trim() || !playerName.trim() || !regNo.trim() || !email.trim()) {
      alert('Please fill all fields')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address')
    if (!gameId.trim() || !playerName.trim() || !registrationNumber.trim() || !email.trim()) {
      setError('Please fill in all fields')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
>>>>>>> Stashed changes
      return
    }

    setIsLoading(true)
    
    try {
<<<<<<< Updated upstream
      // Simulate API call to join game
      await new Promise(resolve => setTimeout(resolve, 1000))
=======
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
      // Use Appwrite service to join game
      const player = await playerGameService.joinGame({
        gameCode: gameId.trim(),
        name: playerName.trim(),
        registrationNumber: registrationNumber.trim(),
        email: email.trim()
      })
>>>>>>> Stashed changes
      
      // Call the onJoin callback
      onJoin(gameId.trim(), playerName.trim())
      
      // Navigate to game page
      navigate('/game')
    } catch (error) {
      console.error('Failed to join game:', error)
<<<<<<< Updated upstream
      alert('Failed to join game. Please try again.')
=======
      alert('Failed to join game. Please check your connection and try again.')
      setError(error.message || 'Failed to join game. Please try again.')
>>>>>>> Stashed changes
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewInstructions = () => {
    navigate('/instructions')
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
              <GamepadIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="mb-2 text-4xl font-bold gradient-text">
            Tambola Player
          </h1>
          <p className="text-gray-400">
          <p className="text-gray-400">
            Join an exciting game of Tambola!
          </p>
        </div>

        {/* Join Form */}
<<<<<<< Updated upstream
        <div className="card p-8 mb-6">
=======
        <div className="p-8 mb-6 card">
          {error && (
            <div className="p-3 mb-4 text-sm text-red-400 border rounded-lg bg-red-500/10 border-red-500/30">
              {error}
            </div>
          )}
          
>>>>>>> Stashed changes
          <form onSubmit={handleJoinGame} className="space-y-6">
            <div>
              <label htmlFor="gameId" className="block mb-2 text-sm font-medium text-slate-300">
                Game ID
              </label>
              <div className="relative">
                <Users className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-slate-500" />
                <input
                  type="text"
                  id="gameId"
                  value={gameId}
<<<<<<< Updated upstream
                  onChange={(e) => setGameId(e.target.value)}
=======
                  onChange={(e) => setGameId(e.target.value.toUpperCase())}
                  onChange={(e) => setGameId(e.target.value.toUpperCase())}
>>>>>>> Stashed changes
                  placeholder="Enter Game ID"
                  className="w-full py-3 pl-12 pr-4 text-white transition-all border rounded-lg bg-slate-800/50 border-slate-600/50 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="playerName" className="block mb-2 text-sm font-medium text-slate-300">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-slate-500" />
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full py-3 pl-12 pr-4 text-white transition-all border rounded-lg bg-slate-800/50 border-slate-600/50 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  disabled={isLoading}
                />
              </div>
            </div>

<<<<<<< Updated upstream
            <button
              type="submit"
              disabled={isLoading || !gameId.trim() || !playerName.trim()}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
=======
            <div>
              <label htmlFor="registrationNumber" className="block mb-2 text-sm font-medium text-slate-300">
                Registration Number
              </label>
              <div className="relative">
                <Hash className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-slate-500" />
                <input
                  type="text"
                  id="registrationNumber"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="Enter your registration number"
                  className="w-full py-3 pl-12 pr-4 text-white transition-all border rounded-lg bg-slate-800/50 border-slate-600/50 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-slate-500" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full py-3 pl-12 pr-4 text-white transition-all border rounded-lg bg-slate-800/50 border-slate-600/50 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !gameId.trim() || !playerName.trim() || !registrationNumber.trim() || !email.trim()}
              className="flex items-center justify-center w-full gap-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
>>>>>>> Stashed changes
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 rounded-full border-white/30 border-t-white animate-spin"></div>
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
            className="inline-flex items-center gap-2 font-medium text-blue-400 transition-colors hover:text-blue-300"
          >
            <BookOpen className="w-5 h-5" />
            How to Play Tambola
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-sm text-center text-slate-500">
          Need a Game ID? Ask your game host to share it with you.
        </div>
      </div>
    </div>
  )
}

export default PlayerJoin
