import { ID, Query } from 'appwrite'
import { databases, appwriteConfig } from '../config/appwrite.js'

/**
 * Player Game Service - Manages player registration, game joining, and answer submission
 * Appwrite Integration for Player Application
 */

export class PlayerGameService {
  constructor() {
    this.databaseId = appwriteConfig.databaseId
    this.collections = appwriteConfig.collections
  }

  /**
   * Register/Join a player to a game
   * @param {Object} playerData - Player registration data
   * @returns {Promise<Object>} Created player document
   */
  async joinGame(playerData) {
    try {
      const { gameCode, name, registrationNumber, email } = playerData

      // First, find the game by code
      const gameResponse = await databases.listDocuments(
        this.databaseId,
        this.collections.games,
        [Query.equal('gameCode', gameCode)]
      )

      if (gameResponse.documents.length === 0) {
        throw new Error('Game not found')
      }

      const game = gameResponse.documents[0]

      // Check if game is accepting players
      if (game.status === 'ended') {
        throw new Error('Game has ended')
      }

      // Check if player already exists in this game
      const existingPlayerResponse = await databases.listDocuments(
        this.databaseId,
        this.collections.players,
        [
          Query.equal('gameId', game.$id),
          Query.equal('email', email)
        ]
      )

      if (existingPlayerResponse.documents.length > 0) {
        // Player already exists, return existing player
        return existingPlayerResponse.documents[0]
      }

      // Create new player
      const newPlayerData = {
        gameId: game.$id,
        gameCode: gameCode,
        name,
        registrationNumber,
        email,
        score: 0,
        correctAnswers: 0,
        totalAnswers: 0,
        isOnline: true,
        hasWon: false,
        winType: null,
        verified: false,
        joinedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        lastAnswerTime: null
      }

      const player = await databases.createDocument(
        this.databaseId,
        this.collections.players,
        ID.unique(),
        newPlayerData
      )

      return player
    } catch (error) {
      console.error('Error joining game:', error)
      throw new Error(error.message || 'Failed to join game')
    }
  }

  /**
   * Get game information by game code
   * @param {string} gameCode - 6-character game code
   * @returns {Promise<Object>} Game document
   */
  async getGameByCode(gameCode) {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collections.games,
        [Query.equal('gameCode', gameCode)]
      )

      if (response.documents.length === 0) {
        throw new Error('Game not found')
      }

      return response.documents[0]
    } catch (error) {
      console.error('Error fetching game:', error)
      throw new Error('Game not found')
    }
  }

  /**
   * Get player information
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
   * Submit answer for a round
   * @param {Object} answerData - Answer submission data
   * @returns {Promise<Object>} Created answer document
   */
  async submitAnswer(answerData) {
    try {
      const { roundId, playerId, playerName, selectedOption, submissionTime } = answerData

      // Check if player already answered this round
      const existingAnswerResponse = await databases.listDocuments(
        this.databaseId,
        this.collections.answers,
        [
          Query.equal('roundId', roundId),
          Query.equal('playerId', playerId)
        ]
      )

      if (existingAnswerResponse.documents.length > 0) {
        throw new Error('Answer already submitted for this round')
      }

      // Create answer document
      const answerDoc = {
        roundId,
        playerId,
        playerName,
        selectedOption,
        submittedAt: submissionTime || new Date().toISOString(),
        isCorrect: null, // Will be set when round is processed
        scoreAwarded: 0,
        processedAt: null
      }

      const answer = await databases.createDocument(
        this.databaseId,
        this.collections.answers,
        ID.unique(),
        answerDoc
      )

      return answer
    } catch (error) {
      console.error('Error submitting answer:', error)
      throw new Error(error.message || 'Failed to submit answer')
    }
  }

  /**
   * Get current active round for a game
   * @param {string} gameId - Game document ID
   * @returns {Promise<Object|null>} Active round document or null
   */
  async getCurrentRound(gameId) {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collections.rounds,
        [
          Query.equal('gameId', gameId),
          Query.orderDesc('roundNumber'),
          Query.limit(1)
        ]
      )

      return response.documents.length > 0 ? response.documents[0] : null
    } catch (error) {
      console.error('Error fetching current round:', error)
      return null
    }
  }

  /**
   * Get leaderboard for a game
   * @param {string} gameId - Game document ID
   * @returns {Promise<Array>} Array of players sorted by score
   */
  async getLeaderboard(gameId) {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collections.players,
        [
          Query.equal('gameId', gameId),
          Query.orderDesc('score'),
          Query.limit(50)
        ]
      )
      return response.documents
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      throw new Error('Failed to fetch leaderboard')
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
          lastSeenAt: new Date().toISOString()
        }
      )
      return updatedPlayer
    } catch (error) {
      console.error('Error updating player status:', error)
      throw new Error('Failed to update player status')
    }
  }

  /**
   * Subscribe to real-time game updates (using polling as fallback)
   * @param {string} gameId - Game document ID
   * @param {Function} callback - Callback function for updates
   * @returns {Function} Unsubscribe function
   */
  subscribeToGame(gameId, callback) {
    // Use polling as fallback
    let lastUpdate = null
    const interval = setInterval(async () => {
      try {
        const game = await databases.getDocument(
          this.databaseId,
          this.collections.games,
          gameId
        )
        if (!lastUpdate || game.updatedAt !== lastUpdate) {
          lastUpdate = game.updatedAt
          callback({
            events: ['databases.*.collections.*.documents.*.update'],
            payload: game
          })
        }
      } catch (error) {
        console.error('Error polling game updates:', error)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }

  /**
   * Subscribe to real-time rounds updates (using polling as fallback)
   * @param {string} gameId - Game document ID
   * @param {Function} callback - Callback function for updates
   * @returns {Function} Unsubscribe function
   */
  subscribeToRounds(gameId, callback) {
    // Use polling as fallback
    let lastRoundNumber = 0
    const interval = setInterval(async () => {
      try {
        const currentRound = await this.getCurrentRound(gameId)
        if (currentRound && currentRound.roundNumber !== lastRoundNumber) {
          lastRoundNumber = currentRound.roundNumber
          callback({
            events: ['databases.*.collections.*.documents.*.create'],
            payload: currentRound
          })
        }
      } catch (error) {
        console.error('Error polling rounds updates:', error)
      }
    }, 1000) // Poll every 1 second for rounds

    return () => clearInterval(interval)
  }

  /**
   * Subscribe to real-time leaderboard updates (using polling as fallback)
   * @param {string} gameId - Game document ID
   * @param {Function} callback - Callback function for updates
   * @returns {Function} Unsubscribe function
   */
  subscribeToLeaderboard(gameId, callback) {
    // Use polling as fallback
    let lastScoreSum = 0
    const interval = setInterval(async () => {
      try {
        const players = await this.getLeaderboard(gameId)
        const currentScoreSum = players.reduce((sum, p) => sum + p.score, 0)
        
        if (currentScoreSum !== lastScoreSum) {
          lastScoreSum = currentScoreSum
          callback({
            events: ['databases.*.collections.*.documents.*.update'],
            payload: { gameId, players }
          })
        }
      } catch (error) {
        console.error('Error polling leaderboard updates:', error)
      }
    }, 3000) // Poll every 3 seconds for leaderboard

    return () => clearInterval(interval)
  }

  /**
   * Get player's answer for a specific round
   * @param {string} roundId - Round document ID
   * @param {string} playerId - Player document ID
   * @returns {Promise<Object|null>} Answer document or null
   */
  async getPlayerAnswer(roundId, playerId) {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collections.answers,
        [
          Query.equal('roundId', roundId),
          Query.equal('playerId', playerId)
        ]
      )

      return response.documents.length > 0 ? response.documents[0] : null
    } catch (error) {
      console.error('Error fetching player answer:', error)
      return null
    }
  }
}

// Create singleton instance
export const playerGameService = new PlayerGameService()