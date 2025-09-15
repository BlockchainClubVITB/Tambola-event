import React, { useState, useEffect } from 'react'
import { Trophy, Users, Clock, CheckCircle } from 'lucide-react'
import { gameService } from '../utils/gameService'
import { getWinConditionInfo } from '../utils/winningConditions'

const WinnersPanel = ({ gameId, isActive }) => {
  const [winners, setWinners] = useState({})
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)

  // Get winning condition info
  const winConditionInfo = getWinConditionInfo()

  // Enhanced fetch with error handling and auto-retry
  const fetchWinners = async (forceRefresh = false) => {
    if (!gameId) return

    setLoading(true)
    try {
      const result = await gameService.getAllWinners(gameId, !forceRefresh) // Use cache unless forced
      if (result.success) {
        setWinners(result.winners)
        setLastUpdate(new Date())
        console.log('🏆 Winners data loaded:', result.winners)
      } else {
        console.error('Failed to fetch winners:', result.error)
        // Auto-retry on failure
        setTimeout(() => {
          console.log('🔄 Auto-retrying winner fetch...')
          fetchWinners(true) // Force refresh on retry
        }, 3000)
      }
    } catch (error) {
      console.error('Error fetching winners:', error)
      // Auto-retry on error
      setTimeout(() => {
        console.log('🔄 Auto-retrying winner fetch after error...')
        fetchWinners(true)
      }, 5000)
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh with smart intervals
  useEffect(() => {
    fetchWinners()
    
    let interval
    if (isActive) {
      // Faster refresh when game is active, slower when idle
      const refreshInterval = winners && Object.values(winners).some(w => w.length > 0) ? 3000 : 5000
      interval = setInterval(() => fetchWinners(), refreshInterval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [gameId, isActive])

  // Manual refresh with cache clearing
  const handleRefresh = () => {
    gameService.clearWinnerCache(gameId) // Clear cache for fresh data
    fetchWinners(true) // Force refresh
  }

  // Calculate total winners
  const getTotalWinners = () => {
    const uniqueWinners = new Set()
    Object.values(winners).forEach(winnerList => {
      winnerList.forEach(winner => uniqueWinners.add(winner.$id))
    })
    return uniqueWinners.size
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-semibold">Winners Board</h3>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users className="w-4 h-4" />
            <span>{getTotalWinners()} Winners</span>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              loading 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {lastUpdate && (
        <div className="mb-4 text-xs text-gray-400 flex items-center gap-2">
          <Clock className="w-3 h-3" />
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      {/* Winners by Category */}
      <div className="space-y-4">
        {Object.entries(winConditionInfo).map(([condition, info]) => {
          const conditionWinners = winners[condition] || []
          const hasWinners = conditionWinners.length > 0

          return (
            <div
              key={condition}
              className={`p-4 rounded-lg border transition-all ${
                hasWinners 
                  ? 'bg-green-900/30 border-green-600/50' 
                  : 'bg-gray-800/50 border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{info.icon}</span>
                  <div>
                    <h4 className="font-semibold text-white">{info.name}</h4>
                    <p className="text-sm text-gray-400">{info.description}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    hasWinners ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    {hasWinners ? '1' : '0'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {hasWinners ? 'Winner' : 'Available'}
                  </div>
                </div>
              </div>

              {/* Winner Display */}
              {hasWinners && (
                <div className="space-y-2">
                  {/* Show only the first winner (should be only one anyway due to new logic) */}
                  {conditionWinners.slice(0, 1).map((winner, index) => (
                    <div 
                      key={winner.$id}
                      className="flex items-center justify-between p-3 bg-green-900/30 border border-green-600/50 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-yellow-500 text-black">
                          👑
                        </div>
                        <div>
                          <span className="font-medium text-white">{winner.name}</span>
                          <div className="text-sm text-gray-400">({winner.regNo})</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-green-400 font-medium">{winner.score || 0} pts</span>
                        {winner.winTimestamps && (() => {
                          try {
                            const timestamps = JSON.parse(winner.winTimestamps)
                            if (timestamps[condition]) {
                              return (
                                <span className="text-gray-400">
                                  {formatTime(timestamps[condition])}
                                </span>
                              )
                            }
                          } catch (e) {
                            console.warn('Failed to parse winTimestamps:', e)
                          }
                          return null
                        })()}
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                    </div>
                  ))}
                  
                  {/* Show if there are somehow multiple winners (legacy data) */}
                  {conditionWinners.length > 1 && (
                    <div className="text-center text-xs text-yellow-400 pt-2">
                      ⚠️ Legacy: {conditionWinners.length} total winners found
                    </div>
                  )}
                </div>
              )}

              {/* No Winners State */}
              {!hasWinners && (
                <div className="text-center py-3 text-gray-500 text-sm border border-gray-600 rounded bg-gray-800/30">
                  🏁 Available to win - First player to complete this condition wins!
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary Stats */}
      {getTotalWinners() > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-yellow-900/30 to-green-900/30 rounded-lg border border-yellow-600/30">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              {getTotalWinners()}
            </div>
            <div className="text-sm text-yellow-300 mb-2">
              Total Winners
            </div>
            <div className="grid grid-cols-5 gap-2 text-xs">
              {Object.entries(winConditionInfo).map(([condition, info]) => (
                <div key={condition} className="text-center">
                  <div className="text-lg">{info.icon}</div>
                  <div className="font-bold text-white">{(winners[condition] || []).length}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WinnersPanel