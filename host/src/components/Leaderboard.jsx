import React from 'react'
import { Trophy, Medal, Award, Star, Crown, Target, Users } from 'lucide-react'

const Leaderboard = ({ 
  players = [],
  gameStats = {
    totalPlayers: 0,
    questionsAnswered: 0,
    averageScore: 0,
    gameTimeElapsed: '00:00'
  }
}) => {
  
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.correctAnswers !== a.correctAnswers) return b.correctAnswers - a.correctAnswers
    return new Date(a.lastAnswerTime) - new Date(b.lastAnswerTime)
  })

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />
      case 2:
        return <Trophy className="w-5 h-5 text-gray-400" />
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />
      default:
        return <Star className="w-4 h-4 text-blue-400" />
    }
  }

  const getRankBadge = (rank) => {
    if (rank <= 3) {
      const colors = {
        1: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
        2: 'bg-gradient-to-r from-gray-400 to-gray-600', 
        3: 'bg-gradient-to-r from-amber-500 to-amber-700'
      }
      return `${colors[rank]} text-white`
    }
    return 'bg-slate-700 text-slate-300'
  }

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold gradient-text">Leaderboard</h2>
        <div className="text-right">
          <div className="text-sm text-slate-300">Game Time</div>
          <div className="text-lg font-bold">{gameStats.gameTimeElapsed}</div>
        </div>
      </div>

      {/* Game Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/30 rounded-lg p-3 text-center">
          <Target className="w-6 h-6 text-blue-400 mx-auto mb-1" />
          <div className="text-lg font-bold">{gameStats.totalPlayers}</div>
          <div className="text-xs text-slate-300">Players</div>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-3 text-center">
          <Trophy className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <div className="text-lg font-bold">{gameStats.questionsAnswered}</div>
          <div className="text-xs text-slate-300">Questions</div>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-3 text-center">
          <Star className="w-6 h-6 text-purple-400 mx-auto mb-1" />
          <div className="text-lg font-bold">{gameStats.averageScore}</div>
          <div className="text-xs text-slate-300">Avg Score</div>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-3 text-center">
          <Medal className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
          <div className="text-lg font-bold">{sortedPlayers.filter(p => p.hasWon).length}</div>
          <div className="text-xs text-slate-300">Winners</div>
        </div>
      </div>

      {/* Players List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedPlayers.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No players joined yet</p>
          </div>
        ) : (
          sortedPlayers.map((player, index) => {
            const rank = index + 1
            return (
              <div key={player.id} className="leaderboard-item">
                <div className="flex items-center space-x-3 flex-1">
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadge(rank)}`}>
                    {rank <= 3 ? getRankIcon(rank) : rank}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold truncate">{player.name}</span>
                      {player.hasWon && (
                        <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      )}
                      {player.isOnline && (
                        <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-400">{player.score}</div>
                  <div className="text-xs text-slate-400">
                    {player.correctAnswers}/{player.totalAnswers} correct
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Leaderboard
