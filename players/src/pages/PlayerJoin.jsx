import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Users, GamepadIcon, ArrowRight, BookOpen, Mail, CreditCard } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { gameService } from '../utils/gameService'

const LOGO_SIZE = 112
const MARGIN = 20
const usedPositions = []

const getRandomPosition = () => {
  let attempts = 0
  const maxAttempts = 50
  
  while (attempts < maxAttempts) {
    const position = {
      top: Math.random() * (window.innerHeight - LOGO_SIZE),
      left: Math.random() * (window.innerWidth - LOGO_SIZE)
    }

    const hasOverlap = usedPositions.some(usedPos => {
      const xOverlap = Math.abs(usedPos.left - position.left) < (LOGO_SIZE + MARGIN)
      const yOverlap = Math.abs(usedPos.top - position.top) < (LOGO_SIZE + MARGIN)
      return xOverlap && yOverlap
    })

    if (!hasOverlap) {
      usedPositions.push(position)
      return {
        top: `${position.top}px`,
        left: `${position.left}px`
      }
    }

    attempts++
  }

  return {
    top: '50%',
    left: '50%'
  }
}

const CryptoIcon = ({ icon }) => {
  const [position] = useState(getRandomPosition())

  React.useEffect(() => {
    return () => {
      const index = usedPositions.findIndex(
        pos => pos.top === parseInt(position.top) && pos.left === parseInt(position.left)
      )
      if (index > -1) {
        usedPositions.splice(index, 1)
      }
    }
  }, [])

  const cryptoUrls = {
    bitcoin: '/assets/bitcoin-btc-logo.png',
    ethereum: '/assets/ethereum-eth-logo.png',
    binance: '/assets/binance-coin-bnb-logo.png',
    doge_coin: '/assets/dogecoin-doge-logo.png',
    black_coin: '/assets/blackcoin-blk-logo.png',
    solana: '/assets/solana-sol-logo.png',
    polkadot: '/assets/polkadot-new-dot-logo.png',
    chainlink: '/assets/chainlink-link-logo.png',
    avalanche: '/assets/avalanche-avax-logo.png',
    polygon: '/assets/polygon-matic-logo.png',
  }

  return (
    <img 
      src={cryptoUrls[icon]} 
      alt={icon} 
      className="absolute opacity-40 w-28 h-28 animate-float"
      style={{ 
        top: position.top,
        left: position.left
      }}
      onError={(e) => {
        console.error(`Failed to load crypto icon: ${icon}`)
        e.target.style.display = 'none'
      }}
    />
  )
}

const PlayerJoin = ({ onJoin }) => {
  const [gameId, setGameId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [regNo, setRegNo] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [playMode, setPlayMode] = useState('') // 'individual' or 'team'
  const [teamName, setTeamName] = useState('')
  const [teamPassword, setTeamPassword] = useState('')
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

  const handleTeamJoinGame = async (e) => {
    e.preventDefault()
    
    if (!gameId.trim() || !teamName.trim() || !teamPassword.trim()) {
      toast.error('Please fill all fields')
      return
    }

    setIsLoading(true)
    
    try {
      // Verify team credentials
      const verificationResult = await gameService.verifyTeamCredentials(
        teamName.trim(), 
        teamPassword.trim(), 
        gameId.trim()
      )

      if (!verificationResult.success) {
        toast.error(verificationResult.error || 'Failed to verify team credentials')
        setIsLoading(false)
        return
      }

      if (!verificationResult.isValid) {
        toast.error(verificationResult.message)
        setIsLoading(false)
        return
      }

      // Register all team members as players
      const registrationResult = await gameService.registerTeamAsPlayers(
        gameId.trim(),
        verificationResult.teamMembers,
        teamName.trim()
      )

      if (!registrationResult.success) {
        toast.error(registrationResult.error || 'Failed to register team members')
        setIsLoading(false)
        return
      }

      if (!registrationResult.allRegistered) {
        console.warn('Some team members could not be registered:', registrationResult.results)
        toast.warning('Some team members were already registered or had issues')
      }

      // Store team info in localStorage
      localStorage.setItem('teamName', teamName.trim())
      localStorage.setItem('gameId', gameId.trim())
      localStorage.setItem('isTeamPlayer', 'true')
      localStorage.setItem('teamMembers', JSON.stringify(verificationResult.teamMembers))
      
      // Store first registered player as primary player for navigation
      const primaryPlayer = registrationResult.registeredPlayers[0]
      if (primaryPlayer) {
        localStorage.setItem('playerId', primaryPlayer.playerId)
        
        // Store player data in the same format as individual players
        localStorage.setItem('tambola_player', JSON.stringify({
          id: primaryPlayer.playerId,
          gameId: gameId.trim().toUpperCase(),
          name: teamName.trim(),
          score: 0
        }))
      }

      toast.success(`Team "${teamName}" joined successfully!`)

      // Call the onJoin callback to update App.jsx state
      onJoin(gameId.trim().toUpperCase(), teamName.trim(), {
        $id: primaryPlayer.playerId,
        name: teamName.trim()
      })

      // Navigate to game page
      setTimeout(() => {
        navigate('/game')
      }, 1000)
      
    } catch (error) {
      console.error('Failed to join as team:', error)
      toast.error('Failed to join as team. Please check your credentials and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewInstructions = () => {
    navigate('/instructions')
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 
      flex items-center justify-center p-2 sm:p-4 lg:p-6 overflow-hidden">
      {/* Add the crypto icons */}
      <CryptoIcon icon="bitcoin" />
      <CryptoIcon icon="ethereum" />
      <CryptoIcon icon="binance" />
      <CryptoIcon icon="doge_coin" />
      <CryptoIcon icon="black_coin" />
      <CryptoIcon icon="avalanche" />
      <CryptoIcon icon="polkadot" />
      <CryptoIcon icon="solana" />
      <CryptoIcon icon="polygon" />
      <CryptoIcon icon="chainlink" />

      {/* Modify the main content wrapper to add backdrop blur */}
      <div className="w-full max-w-[320px] xs:max-w-sm sm:max-w-md lg:max-w-lg relative z-10">
        {/* Header with Logo, Club Name and Decrypt2win in vertical order */}
        <div className="text-center mb-3 sm:mb-4 lg:mb-6">
          <div className="flex justify-center mb-2 sm:mb-3">
            <img 
              src="/assets/logo.png" 
              alt="Blockchain Club VITB" 
              className="object-contain w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16"
            />
          </div>
          <h1 className="text-base xs:text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-300 to-white bg-clip-text text-transparent mb-1 sm:mb-2">
            Blockchain Club VITB
          </h1>
          <h2 className="text-base xs:text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-300 to-white bg-clip-text text-transparent">
            Decrypt2win
          </h2>
        </div>

        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8 text-center">
          <div className="flex justify-center mb-2 sm:mb-3">
            <div className="p-2 xs:p-3 sm:p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
              <GamepadIcon className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-300" />
            </div>
          </div>
          <h1 className="mb-1 sm:mb-2 text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-300 to-white bg-clip-text text-transparent">
            Player
          </h1>
          <p className="text-gray-400 text-xs xs:text-sm sm:text-base">
            Join an exciting game of Tambola!
          </p>
        </div>

        {/* Join Form */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-3 xs:p-4 sm:p-6 lg:p-8 mb-3 sm:mb-4 lg:mb-6">
          {!playMode ? (
            /* Mode Selection */
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold text-center text-gray-300 mb-6">
                Choose How You Want to Play
              </h3>
              
              {/* Play Individually Button */}
              <button
                onClick={() => toast.error('Individual play mode is currently disabled. Please use team mode.')}
                className="w-full p-4 sm:p-6 border border-gray-600 rounded-lg bg-gray-800/50 
                text-gray-500 cursor-not-allowed opacity-50 transition-all duration-300"
                disabled
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  <User className="w-6 h-6 sm:w-8 sm:h-8" />
                  <span className="text-lg sm:text-xl font-semibold">Play Individually</span>
                </div>
                <p className="text-sm text-gray-400">Currently Disabled</p>
              </button>

              {/* Play as Team Button */}
              <button
                onClick={() => setPlayMode('team')}
                className="w-full p-4 sm:p-6 border border-gray-600 rounded-lg bg-gray-800/80 
                text-white transition-all duration-300 hover:border-blue-400 
                hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:bg-blue-600/20"
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8" />
                  <span className="text-lg sm:text-xl font-semibold">Play as a Team</span>
                </div>
                <p className="text-sm text-gray-400">Join with your team credentials</p>
              </button>
            </div>
          ) : playMode === 'individual' ? (
            /* Individual Player Form */
            <form onSubmit={handleJoinGame} className="space-y-3 xs:space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-300">Individual Player</h3>
                <button
                  type="button"
                  onClick={() => setPlayMode('')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ← Back
                </button>
              </div>

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
                    className="w-full py-2.5 sm:py-3 pl-10 sm:pl-12 pr-3 sm:pr-4 text-white placeholder-gray-500 
                    transition-all duration-300 bg-gray-800/80 border border-gray-600 rounded-lg 
                    focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 
                    hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] 
                    focus:shadow-[0_0_20px_rgba(59,130,246,0.25)] text-sm sm:text-base"
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
                    className="w-full py-2.5 sm:py-3 pl-10 sm:pl-12 pr-3 sm:pr-4 text-white placeholder-gray-500 
                    transition-all duration-300 bg-gray-800/80 border border-gray-600 rounded-lg 
                    focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 
                    hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] 
                    focus:shadow-[0_0_20px_rgba(59,130,246,0.25)] text-sm sm:text-base"
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
                    className="w-full py-2.5 sm:py-3 pl-10 sm:pl-12 pr-3 sm:pr-4 text-white placeholder-gray-500 
                    transition-all duration-300 bg-gray-800/80 border border-gray-600 rounded-lg 
                    focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 
                    hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] 
                    focus:shadow-[0_0_20px_rgba(59,130,246,0.25)] text-sm sm:text-base"
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
                    className="w-full py-2.5 sm:py-3 pl-10 sm:pl-12 pr-3 sm:pr-4 text-white placeholder-gray-500 
                    transition-all duration-300 bg-gray-800/80 border border-gray-600 rounded-lg 
                    focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 
                    hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] 
                    focus:shadow-[0_0_20px_rgba(59,130,246,0.25)] text-sm sm:text-base"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !gameId.trim() || !playerName.trim() || !regNo.trim() || !email.trim()}
                className="flex items-center justify-center w-full gap-2 px-4 sm:px-6 py-2.5 sm:py-3 
                  font-semibold text-white transition-all duration-300 
                  bg-gray-800/80 border border-gray-600 rounded-lg
                  hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]
                  focus:shadow-[0_0_20px_rgba(59,130,246,0.25)]
                  hover:bg-blue-600 
                  disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed 
                  disabled:hover:border-gray-600 disabled:hover:shadow-none
                  text-sm sm:text-base"
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
          ) : (
            /* Team Player Form */
            <form onSubmit={handleTeamJoinGame} className="space-y-3 xs:space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-300">Team Login</h3>
                <button
                  type="button"
                  onClick={() => setPlayMode('')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ← Back
                </button>
              </div>

              <div>
                <label htmlFor="teamGameId" className="block mb-2 text-sm font-medium text-gray-300">
                  Game ID
                </label>
                <div className="relative">
                  <GamepadIcon className="absolute w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="text"
                    id="teamGameId"
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value.toUpperCase())}
                    placeholder="Enter Game ID"
                    className="w-full py-2.5 sm:py-3 pl-10 sm:pl-12 pr-3 sm:pr-4 text-white placeholder-gray-500 
                    transition-all duration-300 bg-gray-800/80 border border-gray-600 rounded-lg 
                    focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 
                    hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] 
                    focus:shadow-[0_0_20px_rgba(59,130,246,0.25)] text-sm sm:text-base"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="teamName" className="block mb-2 text-sm font-medium text-gray-300">
                  Team Name
                </label>
                <div className="relative">
                  <Users className="absolute w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="text"
                    id="teamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter your team name"
                    className="w-full py-2.5 sm:py-3 pl-10 sm:pl-12 pr-3 sm:pr-4 text-white placeholder-gray-500 
                    transition-all duration-300 bg-gray-800/80 border border-gray-600 rounded-lg 
                    focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 
                    hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] 
                    focus:shadow-[0_0_20px_rgba(59,130,246,0.25)] text-sm sm:text-base"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="teamPassword" className="block mb-2 text-sm font-medium text-gray-300">
                  Team Password
                </label>
                <div className="relative">
                  <CreditCard className="absolute w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="password"
                    id="teamPassword"
                    value={teamPassword}
                    onChange={(e) => setTeamPassword(e.target.value)}
                    placeholder="Enter your team password"
                    className="w-full py-2.5 sm:py-3 pl-10 sm:pl-12 pr-3 sm:pr-4 text-white placeholder-gray-500 
                    transition-all duration-300 bg-gray-800/80 border border-gray-600 rounded-lg 
                    focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 
                    hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] 
                    focus:shadow-[0_0_20px_rgba(59,130,246,0.25)] text-sm sm:text-base"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !gameId.trim() || !teamName.trim() || !teamPassword.trim()}
                className="flex items-center justify-center w-full gap-2 px-4 sm:px-6 py-2.5 sm:py-3 
                  font-semibold text-white transition-all duration-300 
                  bg-gray-800/80 border border-gray-600 rounded-lg
                  hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]
                  focus:shadow-[0_0_20px_rgba(59,130,246,0.25)]
                  hover:bg-blue-600 
                  disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed 
                  disabled:hover:border-gray-600 disabled:hover:shadow-none
                  text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 rounded-full border-white/30 border-t-white animate-spin"></div>
                    Joining as Team...
                  </>
                ) : (
                  <>
                    Join as Team
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Instructions Link */}
        <div className="text-center mb-3 sm:mb-4">
          <button
            onClick={handleViewInstructions}
            className="inline-flex items-center gap-1 xs:gap-2 font-medium text-gray-300 
            transition-colors hover:text-white text-xs xs:text-sm sm:text-base"
          >
            <BookOpen className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
            How to Play Tambola
          </button>
        </div>

        {/* Footer */}
        <div className="text-[10px] xs:text-xs sm:text-sm text-center text-gray-500 px-2">
          {!playMode ? (
            "Choose your preferred play mode to get started"
          ) : playMode === 'team' ? (
            "Need team credentials? Contact your team leader or game host."
          ) : (
            "Need a Game ID? Ask your game host to share it with you."
          )}
        </div>
      </div>
    </div>
  )
}

export default PlayerJoin
