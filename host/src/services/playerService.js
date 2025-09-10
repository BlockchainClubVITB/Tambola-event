import { ID, Query } from 'appwrite'
import { databases, appwriteConfig } from '../config/appwrite.js'

/**
 * Player Service - Manages player registration, scoring, and leaderboard
 * Appwrite Integration for Host Dashboard
 */

export class PlayerService {
  constructor() {
    this.databaseId = appwriteConfig.databaseId
    this.collections = appwriteConfig.collections
  }

  /**
   * Get all players for a game
   * @param {string} gameId - Game document ID
   * @returns {Promise<Array>} Array of player documents
   */
  async getGamePlayers(gameId) {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collections.players,
        [Query.equal('gameId', gameId), Query.orderDesc('score')]
      )
      return response.documents
    } catch (error) {
      console.error('Error fetching game players:', error)
      throw new Error('Failed to fetch game players')
    }
  }

  /**
   * Update player score
   * @param {string} playerId - Player document ID
   * @param {number} scoreChange - Score change (can be positive or negative)
   * @param {string} reason - Reason for score change (e.g., 'correct_answer', 'wrong_answer')
   * @returns {Promise<Object>} Updated player document
   */
  async updatePlayerScore(playerId, scoreChange, reason = '') {
    try {
      const player = await databases.getDocument(
        this.databaseId,
        this.collections.players,
        playerId
      )

      const newScore = Math.max(0, player.score + scoreChange) // Ensure score doesn't go below 0
      const newCorrectAnswers = reason === 'correct_answer' 
        ? player.correctAnswers + 1 
        : player.correctAnswers
      const newTotalAnswers = ['correct_answer', 'wrong_answer'].includes(reason)
        ? player.totalAnswers + 1
        : player.totalAnswers

      const updatedPlayer = await databases.updateDocument(
        this.databaseId,
        this.collections.players,
        playerId,
        {
          score: newScore,
          correctAnswers: newCorrectAnswers,
          totalAnswers: newTotalAnswers,
          lastAnswerTime: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      )

      return updatedPlayer
    } catch (error) {
      console.error('Error updating player score:', error)
      throw new Error('Failed to update player score')
    }
  }

  /**
   * Get player by ID
   * @param {string} playerId - Player document ID
   * @returns {Promise<Object>} Player document
   */
  async getPlayer(playerId) {
    try {
      const player = await databases.getDocument(
        this.databaseId,
        this.collections.players,
        playerId
      )
      return player
    } catch (error) {
      console.error('Error fetching player:', error)
      throw new Error('Player not found')
    }
  }

  /**
   * Update player online status
   * @param {string} playerId - Player document ID
   * @param {boolean} isOnline - Online status
   * @returns {Promise<Object>} Updated player document
   */
  async updatePlayerStatus(playerId, isOnline) {
    try {
      const updatedPlayer = await databases.updateDocument(
        this.databaseId,
        this.collections.players,
        playerId,
        {
          isOnline,
          lastSeenAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      )
      return updatedPlayer
    } catch (error) {
      console.error('Error updating player status:', error)
      throw new Error('Failed to update player status')
    }
  }

  /**
   * Mark player as winner for specific category
   * @param {string} playerId - Player document ID
   * @param {string} winType - Type of win (e.g., 'firstLine', 'fullHouse', 'earlyFive')
   * @param {Array} ticketNumbers - Numbers on winning ticket/pattern
   * @returns {Promise<Object>} Updated player document
   */
  async markPlayerWinner(playerId, winType, ticketNumbers = []) {
    try {
      const player = await this.getPlayer(playerId)
      
      const winData = {
        hasWon: true,
        winType,
        winTime: new Date().toISOString(),
        ticketNumbers,
        verified: false,
        updatedAt: new Date().toISOString()
      }

      const updatedPlayer = await databases.updateDocument(
        this.databaseId,
        this.collections.players,
        playerId,
        winData
      )

      return updatedPlayer
    } catch (error) {
      console.error('Error marking player as winner:', error)
      throw new Error('Failed to mark player as winner')
    }
  }

  /**
   * Verify player win
   * @param {string} playerId - Player document ID
   * @returns {Promise<Object>} Updated player document
   */
  async verifyPlayerWin(playerId) {
    try {
      const updatedPlayer = await databases.updateDocument(
        this.databaseId,
        this.collections.players,
        playerId,
        {
          verified: true,
          verifiedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      )
      return updatedPlayer
    } catch (error) {
      console.error('Error verifying player win:', error)
      throw new Error('Failed to verify player win')
    }
  }

  /**
   * Get game leaderboard with statistics
   * @param {string} gameId - Game document ID
   * @returns {Promise<Object>} Leaderboard data and stats
   */
  async getGameLeaderboard(gameId) {
    try {
      const players = await this.getGamePlayers(gameId)
      
      const stats = {
        totalPlayers: players.length,
        onlinePlayers: players.filter(p => p.isOnline).length,
        averageScore: players.length > 0 
          ? Math.round(players.reduce((sum, p) => sum + p.score, 0) / players.length) 
          : 0,
        topScore: players.length > 0 ? players[0].score : 0
      }

      return {
        players,
        stats
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      throw new Error('Failed to fetch leaderboard')
    }
  }

  /**
   * Subscribe to real-time player updates for a game (using polling as fallback)
   * @param {string} gameId - Game document ID
   * @param {Function} callback - Callback function for updates
   * @returns {Function} Unsubscribe function
   */
  subscribeToGamePlayers(gameId, callback) {
    // Use polling as fallback
    let lastPlayerCount = 0
    let lastScoreSum = 0
    
    const interval = setInterval(async () => {
      try {
        const players = await this.getGamePlayers(gameId)
        const currentPlayerCount = players.length
        const currentScoreSum = players.reduce((sum, p) => sum + p.score, 0)
        
        if (currentPlayerCount !== lastPlayerCount || currentScoreSum !== lastScoreSum) {
          lastPlayerCount = currentPlayerCount
          lastScoreSum = currentScoreSum
          
          callback({
            events: ['databases.*.collections.*.documents.*.update'],
            payload: { gameId, players }
          })
        }
      } catch (error) {
        console.error('Error polling player updates:', error)
      }
    }, 3000) // Poll every 3 seconds for players

    return () => clearInterval(interval)
  }

  /**
   * Get answers for a specific round
   * @param {string} roundId - Round document ID
   * @returns {Promise<Array>} Array of answer documents
   */
  async getRoundAnswers(roundId) {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collections.answers,
        [Query.equal('roundId', roundId), Query.orderAsc('submittedAt')]
      )
      return response.documents
    } catch (error) {
      console.error('Error fetching round answers:', error)
      throw new Error('Failed to fetch round answers')
    }
  }

  /**
   * Process answers for a round and update scores
   * @param {string} roundId - Round document ID
   * @param {number} correctAnswer - Index of correct answer
   * @returns {Promise<Object>} Processing results
   */
  async processRoundAnswers(roundId, correctAnswer) {
    try {
      const answers = await this.getRoundAnswers(roundId)
      let correctCount = 0
      let wrongCount = 0
      const processedPlayers = []

      for (const answer of answers) {
        const isCorrect = answer.selectedOption === correctAnswer
        const scoreChange = isCorrect ? 10 : -5 // +10 for correct, -5 for wrong
        
        // Update player score
        await this.updatePlayerScore(
          answer.playerId, 
          scoreChange, 
          isCorrect ? 'correct_answer' : 'wrong_answer'
        )

        // Update answer correctness
        await databases.updateDocument(
          this.databaseId,
          this.collections.answers,
          answer.$id,
          {
            isCorrect,
            scoreAwarded: scoreChange,
            processedAt: new Date().toISOString()
          }
        )

        if (isCorrect) {
          correctCount++
        } else {
          wrongCount++
        }
        
        processedPlayers.push({
          playerId: answer.playerId,
          playerName: answer.playerName,
          isCorrect,
          scoreChange
        })
      }

      return {
        totalAnswers: answers.length,
        correctCount,
        wrongCount,
        processedPlayers
      }
    } catch (error) {
      console.error('Error processing round answers:', error)
      throw new Error('Failed to process round answers')
    }
  }
}

// Create singleton instance
export const playerService = new PlayerService()