import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gameService } from '../utils/gameService'
import { Play, Settings, Users } from 'lucide-react'
import logo from '/assets/logo.png'

const LOGO_SIZE = 112;
const MARGIN = 20;
const usedPositions = []

const getRandomPosition = () => {
  let attempts = 0;
  const maxAttempts = 50;
  
  while (attempts < maxAttempts) {
    const position = {
      top: Math.random() * (window.innerHeight - LOGO_SIZE),
      left: Math.random() * (window.innerWidth - LOGO_SIZE)
    };

    const hasOverlap = usedPositions.some(usedPos => {
      const xOverlap = Math.abs(usedPos.left - position.left) < (LOGO_SIZE + MARGIN);
      const yOverlap = Math.abs(usedPos.top - position.top) < (LOGO_SIZE + MARGIN);
      return xOverlap && yOverlap;
    });

    if (!hasOverlap) {
      usedPositions.push(position);
      return {
        top: `${position.top}px`,
        left: `${position.left}px`
      };
    }

    attempts++;
  }

  return {
    top: '50%',
    left: '50%'
  };
};

const CryptoIcon = ({ icon }) => {
  const [position] = useState(getRandomPosition())

  React.useEffect(() => {
    return () => {
      const index = usedPositions.findIndex(
        pos => pos.top === parseInt(position.top) && pos.left === parseInt(position.left)
      );
      if (index > -1) {
        usedPositions.splice(index, 1);
      }
    };
  }, []);

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

const GameSetup = () => {
  const [hostName, setHostName] = useState('')
  const [gameTitle, setGameTitle] = useState('')
  const [customGameId, setCustomGameId] = useState('')
  const [useCustomId, setUseCustomId] = useState(false)
  const [maxPlayers, setMaxPlayers] = useState(50)
  const [isCreating, setIsCreating] = useState(false)
  const navigate = useNavigate()

  // Team Registration State
  const [showTeamRegistration, setShowTeamRegistration] = useState(false)
  const [teamFormData, setTeamFormData] = useState({
    teamName: '',
    teamPassword: ''
  })
  const [registeredTeams, setRegisteredTeams] = useState([])
  const [loadingTeamRegistration, setLoadingTeamRegistration] = useState(false)
  
  // Team Registration Success State
  const [showTeamSuccess, setShowTeamSuccess] = useState(false)
  const [registeredTeamData, setRegisteredTeamData] = useState(null)

  const handleCreateGame = async (e) => {
    e.preventDefault()
    
    if (!hostName.trim()) {
      alert('Please enter host name')
      return
    }

    if (useCustomId && !customGameId.trim()) {
      alert('Please enter a custom Game ID')
      return
    }

    if (useCustomId && customGameId.trim().length < 4) {
      alert('Game ID must be at least 4 characters long')
      return
    }

    setIsCreating(true)
    
    try {
      const gameIdToUse = useCustomId ? customGameId.trim().toUpperCase() : null
      const result = await gameService.createGame(hostName.trim(), gameIdToUse)
      
      if (result.success) {
        console.log('Game created successfully:', result)
        navigate(`/dashboard?gameId=${result.gameId}`, { 
          state: { 
            gameId: result.gameId, 
            hostName: hostName.trim(),
            gameDoc: result.game 
          } 
        })
      } else {
        alert(`Failed to create game: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creating game:', error)
      alert('Error creating game. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  // Team Registration Functions
  const handleTeamFormChange = (field, value) => {
    setTeamFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const generateRandomTeamName = () => {
    const adjectives = ['Cyber', 'Digital', 'Quantum', 'Ninja', 'Elite', 'Fusion', 'Matrix', 'Nova', 'Phoenix', 'Thunder']
    const nouns = ['Warriors', 'Hunters', 'Guardians', 'Masters', 'Legends', 'Knights', 'Titans', 'Rangers', 'Champions', 'Heroes']
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
    const randomNum = Math.floor(Math.random() * 999) + 1
    return `${randomAdj}${randomNoun}${randomNum}`
  }

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleGenerateRandomTeamName = () => {
    setTeamFormData(prev => ({
      ...prev,
      teamName: generateRandomTeamName()
    }))
  }

  const handleGenerateRandomPassword = () => {
    setTeamFormData(prev => ({
      ...prev,
      teamPassword: generateRandomPassword()
    }))
  }

  const handleTeamRegistration = async () => {
    // Validate required fields
    if (!teamFormData.teamName.trim() || !teamFormData.teamPassword.trim()) {
      alert('Please fill all required fields')
      return
    }

    // Team name validation
    if (teamFormData.teamName.trim().length < 3) {
      alert('Team name must be at least 3 characters long')
      return
    }

    // Team password validation
    if (teamFormData.teamPassword.trim().length < 4) {
      alert('Team password must be at least 4 characters long')
      return
    }

    setLoadingTeamRegistration(true)
    try {
      // Register team with only team name and password
      const result = await gameService.registerTeamOnly(teamFormData)
      
      if (result.success) {
        // Store team data and show success modal
        setRegisteredTeamData({
          teamName: result.teamName,
          teamPassword: result.teamPassword
        })
        setShowTeamRegistration(false)
        setShowTeamSuccess(true)
      } else {
        alert(`Failed to register team: ${result.error}`)
      }
    } catch (error) {
      console.error('Error registering team:', error)
      alert('Failed to register team')
    } finally {
      setLoadingTeamRegistration(false)
    }
  }

  const resetTeamForm = () => {
    setTeamFormData({
      teamName: '',
      teamPassword: ''
    })
    setShowTeamRegistration(false)
  }

  const handleRegisterAnotherTeam = () => {
    setShowTeamSuccess(false)
    setRegisteredTeamData(null)
    resetTeamForm()
    setShowTeamRegistration(true)
  }

  const handleCloseTeamSuccess = () => {
    setShowTeamSuccess(false)
    setRegisteredTeamData(null)
    resetTeamForm()
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden text-white bg-black">
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

      <div className="w-full max-w-lg">
        <div className="p-8 border border-gray-800 shadow-2xl bg-gray-900/60 backdrop-blur-md rounded-xl">
          <div className="flex flex-col items-center mb-6">
            <img 
              src={logo} 
              alt="Blockchain Club VITB" 
              className="object-contain h-32 mb-2"
            />
            <h2 className="text-xl font-semibold text-gray-300">Blockchain Club VITB</h2>
          </div>

          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold">Create Tambola Game</h1>
            <p className="text-gray-400">Set up your game and get ready to host!</p>
          </div>

          <form onSubmit={handleCreateGame} className="space-y-6">
            <div>
              <label htmlFor="hostName" className="block mb-2 text-sm font-medium">
                <Users className="inline w-4 h-4 mr-2" />
                Host Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="hostName"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isCreating}
              />
            </div>

            <div>
              <label htmlFor="gameTitle" className="block mb-2 text-sm font-medium">
                <Settings className="inline w-4 h-4 mr-2" />
                Game Title (Optional)
              </label>
              <input
                type="text"
                id="gameTitle"
                value={gameTitle}
                onChange={(e) => setGameTitle(e.target.value)}
                placeholder="e.g., Friday Night Tambola"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isCreating}
              />
            </div>

            <div>
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="useCustomId"
                  checked={useCustomId}
                  onChange={(e) => setUseCustomId(e.target.checked)}
                  className="w-4 h-4 mr-2 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  disabled={isCreating}
                />
                <label htmlFor="useCustomId" className="text-sm font-medium">
                  Use custom Game ID
                </label>
              </div>
              
              {useCustomId && (
                <div>
                  <label htmlFor="customGameId" className="block mb-2 text-sm font-medium">
                    Custom Game ID *
                  </label>
                  <input
                    type="text"
                    id="customGameId"
                    value={customGameId}
                    onChange={(e) => setCustomGameId(e.target.value.toUpperCase())}
                    placeholder="Enter your custom Game ID (min 4 chars)"
                    className="w-full px-4 py-3 font-mono bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isCreating}
                    maxLength={10}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Game ID will be converted to uppercase. Must be unique.
                  </p>
                </div>
              )}
              
              {!useCustomId && (
                <p className="text-sm text-gray-400">
                  A random 6-character Game ID will be generated automatically
                </p>
              )}
            </div>

            <div>
              <label htmlFor="maxPlayers" className="block mb-2 text-sm font-medium">
                Maximum Players
              </label>
              <select
                id="maxPlayers"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isCreating}
              >
                <option value={25}>25 Players</option>
                <option value={50}>50 Players</option>
                <option value={100}>100 Players</option>
                <option value={200}>200 Players</option>
              </select>
            </div>

            <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
              <h3 className="mb-2 font-semibold">Game Rules:</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>• Each round: 5s preparation + 15s active + 5s scoring</li>
                <li>• Players get +10 points for correct answers</li>
                <li>• Real-time leaderboard updates</li>
                <li>• Numbers are locked once selected</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isCreating || !hostName.trim() || (useCustomId && !customGameId.trim())}
              className="flex items-center justify-center w-full px-6 py-3 space-x-2 font-semibold text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <div className="w-5 h-5 border-b-2 border-white rounded-full animate-spin"></div>
                  <span>Creating Game...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Create Game</span>
                </>
              )}
            </button>

            {/* Team Registration Button */}
            <button
              type="button"
              onClick={() => setShowTeamRegistration(true)}
              className="flex items-center justify-center w-full px-6 py-3 mt-3 space-x-2 font-semibold text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Users className="w-5 h-5" />
              <span>Register Team</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Game ID will be generated automatically for players to join
            </p>
          </div>
        </div>
      </div>

      {/* Team Registration Modal */}
      {showTeamRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">Register Team</h3>
              <button
                onClick={resetTeamForm}
                className="p-2 text-gray-400 transition-colors rounded-lg hover:text-white hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                {/* Team Information */}
                <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
                  <h4 className="mb-4 text-lg font-semibold text-white">Team Information</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-300">Team Name *</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={teamFormData.teamName}
                          onChange={(e) => handleTeamFormChange('teamName', e.target.value)}
                          className="flex-1 px-3 py-2 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter team name"
                        />
                        <button
                          type="button"
                          onClick={handleGenerateRandomTeamName}
                          className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          🎲 Random
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-300">Team Password *</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={teamFormData.teamPassword}
                          onChange={(e) => handleTeamFormChange('teamPassword', e.target.value)}
                          className="flex-1 px-3 py-2 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter team password"
                        />
                        <button
                          type="button"
                          onClick={handleGenerateRandomPassword}
                          className="px-4 py-2 text-sm font-medium text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700"
                        >
                          🔑 Random
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-3 mt-4 border-t border-gray-700">
                <button
                  onClick={resetTeamForm}
                  className="px-4 py-2 text-sm text-gray-300 transition-colors bg-gray-700 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTeamRegistration}
                  disabled={loadingTeamRegistration}
                  className="px-4 py-2 text-sm font-medium text-white transition-all rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingTeamRegistration ? 'Registering Team...' : 'Register Team'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Registration Success Modal */}
      {showTeamSuccess && registeredTeamData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="w-full max-w-2xl mx-4 bg-gray-900 border border-gray-700 shadow-2xl rounded-xl">
            <div className="p-6 text-center">
              {/* Success Header */}
              <div className="mb-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-600 rounded-full">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 className="mb-2 text-2xl font-bold text-white">🏆 Team Registered Successfully!</h3>
                <p className="text-gray-400">Please save these credentials to join games</p>
              </div>

              {/* Team Details Card */}
              <div className="p-6 mb-6 bg-gray-800 border border-gray-700 rounded-lg">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <span className="font-medium text-gray-400">Team Name:</span>
                    <span className="text-lg font-bold text-white">{registeredTeamData.teamName}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <span className="font-medium text-gray-400">Team Password:</span>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 text-lg font-bold text-yellow-400 bg-gray-700 border rounded">
                        {registeredTeamData.teamPassword}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(registeredTeamData.teamPassword)
                          alert('Password copied to clipboard!')
                        }}
                        className="p-2 text-gray-400 transition-colors rounded hover:text-white hover:bg-gray-700"
                        title="Copy to clipboard"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Screenshot Hint */}
              <div className="p-4 mb-6 bg-blue-900 border border-blue-700 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-blue-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-sm font-medium">💡  save your team credentials!</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleRegisterAnotherTeam}
                  className="flex items-center px-6 py-3 space-x-2 font-medium text-white transition-all rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Users className="w-4 h-4" />
                  <span>Register Another Team</span>
                </button>
                <button
                  onClick={handleCloseTeamSuccess}
                  className="px-6 py-3 font-medium text-white transition-colors bg-gray-700 rounded-lg hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GameSetup