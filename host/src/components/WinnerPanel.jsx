import React from 'react'
import { Trophy, Medal, Award, Star, Gift, Crown } from 'lucide-react'

const WinnerPanel = ({ 
  winners = {
    firstLine: null,
    secondLine: null,
    thirdLine: null,
    fullHouse: null,
    earlyFive: null,
    corners: null
  },
  onVerifyWin,
  onAwardPrize
}) => {
  
  const winCategories = [
    {
      key: 'earlyFive',
      title: 'Early 5',
      icon: <Star className="w-5 h-5" />,
      color: 'from-cyan-500 to-blue-500',
      prize: 'Blockchain Stickers'
    },
    {
      key: 'corners',
      title: 'Four Corners',
      icon: <Award className="w-5 h-5" />,
      color: 'from-indigo-500 to-purple-500',
      prize: 'Crypto Keychain'
    },
    {
      key: 'firstLine',
      title: 'First Line',
      icon: <Trophy className="w-5 h-5" />,
      color: 'from-yellow-500 to-orange-500',
      prize: 'NFT Certificate'
    },
    {
      key: 'secondLine',
      title: 'Second Line',
      icon: <Medal className="w-5 h-5" />,
      color: 'from-green-500 to-emerald-500',
      prize: 'Blockchain Book'
    },
    {
      key: 'thirdLine',
      title: 'Third Line',
      icon: <Award className="w-5 h-5" />,
      color: 'from-pink-500 to-rose-500',
      prize: 'Tech Voucher'
    },
    {
      key: 'fullHouse',
      title: 'Full House',
      icon: <Crown className="w-5 h-5" />,
      color: 'from-purple-600 to-pink-600',
      prize: 'Grand Prize Package'
    }
  ]

  const getWinnerStatus = (category) => {
    const winner = winners[category.key]
    if (!winner) return 'pending'
    if (winner.verified) return 'verified'
    return 'claimed'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'border-green-500 bg-green-500/20'
      case 'claimed':
        return 'border-yellow-500 bg-yellow-500/20'
      default:
        return 'border-slate-600 bg-slate-700/30'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'verified':
        return 'Verified ✓'
      case 'claimed':
        return 'Claimed'
      default:
        return 'Pending'
    }
  }

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold gradient-text">Winners</h2>
        <Gift className="w-8 h-8 text-yellow-400" />
      </div>

      {/* Winner Categories */}
      <div className="space-y-4">
        {winCategories.map((category) => {
          const winner = winners[category.key]
          const status = getWinnerStatus(category)
          
          return (
            <div 
              key={category.key} 
              className={`border rounded-lg p-4 transition-all duration-300 ${getStatusColor(status)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${category.color} flex items-center justify-center text-white`}>
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="font-bold">{category.title}</h3>
                    <p className="text-sm text-slate-300">{category.prize}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm px-2 py-1 rounded ${
                    status === 'verified' ? 'bg-green-500 text-white' :
                    status === 'claimed' ? 'bg-yellow-500 text-black' :
                    'bg-slate-600 text-slate-300'
                  }`}>
                    {getStatusText(status)}
                  </div>
                </div>
              </div>

              {/* Winner Details */}
              {winner ? (
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg">{winner.playerName}</div>
                      <div className="text-sm text-slate-300">
                        Won at {new Date(winner.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-blue-400">
                        Score: {winner.score} | Time: {winner.gameTime}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {status === 'claimed' && (
                        <button
                          onClick={() => onVerifyWin && onVerifyWin(category.key, winner)}
                          className="btn-success text-sm py-1 px-3"
                        >
                          Verify
                        </button>
                      )}
                      {status === 'verified' && (
                        <button
                          onClick={() => onAwardPrize && onAwardPrize(category.key, winner)}
                          className="btn-primary text-sm py-1 px-3"
                        >
                          Award Prize
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <div className="text-4xl mb-2">🎯</div>
                  <p className="text-sm">Waiting for winner...</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-slate-800/30 rounded-lg p-3">
            <div className="text-lg font-bold text-green-400">
              {Object.values(winners).filter(w => w?.verified).length}
            </div>
            <div className="text-xs text-slate-300">Verified</div>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-3">
            <div className="text-lg font-bold text-yellow-400">
              {Object.values(winners).filter(w => w && !w.verified).length}
            </div>
            <div className="text-xs text-slate-300">Pending</div>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-3">
            <div className="text-lg font-bold text-blue-400">
              {winCategories.length - Object.values(winners).filter(w => w).length}
            </div>
            <div className="text-xs text-slate-300">Available</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WinnerPanel
