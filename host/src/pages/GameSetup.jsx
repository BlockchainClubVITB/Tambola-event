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
    polkadot: '/assets/polkadot-dot-logo.png',
    chainlink: '/assets/chainlink-link-logo.png',
    avalanche: '/assets/avalanche-avax-logo.png',
    polygon: '/assets/polygon-matic-logo.png',
  }

  return (
    <img 
      src={cryptoUrls[icon]} 
      alt={icon} 
      className="opacity-40 absolute w-28 h-28 animate-float"
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

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 text-white bg-black overflow-hidden">
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
        <div className="p-8 bg-gray-900/60 backdrop-blur-md border border-gray-800 shadow-2xl rounded-xl">
          <div className="flex flex-col items-center mb-6">
            <img 
              src={logo} 
              alt="Blockchain Club VITB" 
              className="h-32 object-contain mb-2"
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
                <li>• Each round: 5s preparation + 30s active + 5s scoring</li>
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
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Game ID will be generated automatically for players to join
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameSetup