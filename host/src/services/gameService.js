import { ID, Query } from 'appwrite'
import { databases, appwriteConfig } from '../config/appwrite.js'
import { generateGameCode } from '../utils/gameUtils.js'

/**
 * Game Service - Manages game creation, state, and rounds
 * Appwrite Integration for Host Dashboard
 */

export class GameService {
  constructor() {
    this.databaseId = appwriteConfig.databaseId
    this.collections = appwriteConfig.collections
  }

  /**
   * Create a new game session
   * @returns {Promise<Object>} Created game document
   */
  async createGame() {
    try {
      const gameCode = generateGameCode()
      const gameData = {
        gameCode,
        status: 'waiting', // waiting, active, paused, ended
        selectedNumbers: [],
        currentNumber: null,
        createdAt: new Date().toISOString(),
        totalRounds: 0,
        maxPlayers: 50,
        gameTime: 0
      }

      const game = await databases.createDocument(
        this.databaseId,
        this.collections.games,
        ID.unique(),
        gameData
      )

      return game
    } catch (error) {
      console.error('Error creating game:', error)
      throw new Error('Failed to create game')
    }
  }

  /**
   * Get game by ID
   * @param {string} gameId - Game document ID
   * @returns {Promise<Object>} Game document
   */
  async getGame(gameId) {
    try {
      const game = await databases.getDocument(
        this.databaseId,
        this.collections.games,
        gameId
      )
      return game
    } catch (error) {
      console.error('Error fetching game:', error)
      throw new Error('Game not found')
    }
  }

  /**
   * Get game by game code
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
      console.error('Error fetching game by code:', error)
      throw new Error('Game not found')
    }
  }

  /**
   * Update game status
   * @param {string} gameId - Game document ID
   * @param {string} status - New status (waiting, active, paused, ended)
   * @returns {Promise<Object>} Updated game document
   */
  async updateGameStatus(gameId, status) {
    try {
      const updatedGame = await databases.updateDocument(
        this.databaseId,
        this.collections.games,
        gameId,
        { status, updatedAt: new Date().toISOString() }
      )
      return updatedGame
    } catch (error) {
      console.error('Error updating game status:', error)
      throw new Error('Failed to update game status')
    }
  }

  /**
   * Create a new round with selected number and question
   * @param {string} gameId - Game document ID
   * @param {number} selectedNumber - Number selected for this round
   * @param {Object} question - Question object for this round
   * @returns {Promise<Object>} Created round document
   */
  async createRound(gameId, selectedNumber, question) {
    try {
      // First update the game with the selected number
      const game = await this.getGame(gameId)
      const updatedNumbers = [...game.selectedNumbers, selectedNumber]
      
      await databases.updateDocument(
        this.databaseId,
        this.collections.games,
        gameId,
        {
          selectedNumbers: updatedNumbers,
          currentNumber: selectedNumber,
          totalRounds: game.totalRounds + 1,
          updatedAt: new Date().toISOString()
        }
      )

      // Create the round document
      const roundData = {
        gameId,
        roundNumber: game.totalRounds + 1,
        selectedNumber,
        question: question ? {
          id: question.id,
          question: question.question,
          options: question.options,
          correct: question.correct,
          difficulty: question.difficulty,
          category: question.category
        } : null,
        startTime: new Date().toISOString(),
        readyTime: 5, // 5 seconds get-ready time
        answerTime: 30, // 30 seconds answer time
        scoreTime: 5, // 5 seconds score update time
        status: 'ready' // ready, active, scoring, completed
      }

      const round = await databases.createDocument(
        this.databaseId,
        this.collections.rounds,
        ID.unique(),
        roundData
      )

      return round
    } catch (error) {
      console.error('Error creating round:', error)
      throw new Error('Failed to create round')
    }
  }

  /**
   * Update round status
   * @param {string} roundId - Round document ID
   * @param {string} status - New status (ready, active, scoring, completed)
   * @returns {Promise<Object>} Updated round document
   */
  async updateRoundStatus(roundId, status) {
    try {
      const updatedRound = await databases.updateDocument(
        this.databaseId,
        this.collections.rounds,
        roundId,
        { status, updatedAt: new Date().toISOString() }
      )
      return updatedRound
    } catch (error) {
      console.error('Error updating round status:', error)
      throw new Error('Failed to update round status')
    }
  }

  /**
   * Get all rounds for a game
   * @param {string} gameId - Game document ID
   * @returns {Promise<Array>} Array of round documents
   */
  async getGameRounds(gameId) {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collections.rounds,
        [Query.equal('gameId', gameId), Query.orderDesc('roundNumber')]
      )
      return response.documents
    } catch (error) {
      console.error('Error fetching game rounds:', error)
      throw new Error('Failed to fetch game rounds')
    }
  }

  /**
   * Subscribe to real-time game updates (using polling as fallback)
   * @param {string} gameId - Game document ID
   * @param {Function} callback - Callback function for updates
   * @returns {Function} Unsubscribe function
   */
  subscribeToGame(gameId, callback) {
    // Use polling as fallback since realtime is not available in client SDK
    let lastUpdate = null
    const interval = setInterval(async () => {
      try {
        const game = await this.getGame(gameId)
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
    let lastRoundCount = 0
    const interval = setInterval(async () => {
      try {
        const rounds = await this.getGameRounds(gameId)
        if (rounds.length !== lastRoundCount) {
          lastRoundCount = rounds.length
          if (rounds.length > 0) {
            callback({
              events: ['databases.*.collections.*.documents.*.create'],
              payload: rounds[0] // Latest round
            })
          }
        }
      } catch (error) {
        console.error('Error polling rounds updates:', error)
      }
    }, 1000) // Poll every 1 second for rounds

    return () => clearInterval(interval)
  }

  /**
   * Reset game state (for host reset functionality)
   * @param {string} gameId - Game document ID
   * @returns {Promise<Object>} Updated game document
   */
  async resetGame(gameId) {
    try {
      const resetData = {
        status: 'waiting',
        selectedNumbers: [],
        currentNumber: null,
        totalRounds: 0,
        gameTime: 0,
        updatedAt: new Date().toISOString()
      }

      const updatedGame = await databases.updateDocument(
        this.databaseId,
        this.collections.games,
        gameId,
        resetData
      )

      return updatedGame
    } catch (error) {
      console.error('Error resetting game:', error)
      throw new Error('Failed to reset game')
    }
  }
}

// Create singleton instance
export const gameService = new GameService()