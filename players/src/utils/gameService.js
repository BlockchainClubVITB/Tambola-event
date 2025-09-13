import { databases, generateId, APPWRITE_CONFIG } from './appwrite.js'
import { Query } from 'appwrite'

// Game Service for managing Tambola games with Appwrite
export class GameService {
  constructor() {
    this.dbId = APPWRITE_CONFIG.databaseId
    this.collections = APPWRITE_CONFIG.collections
  }

  // Get game by Game ID
  async getGame(gameId) {
    try {
      const response = await databases.listDocuments(
        this.dbId,
        this.collections.games,
        [Query.equal('gameId', gameId)]
      )

      if (response.documents.length === 0) {
        return { success: false, error: 'Game not found' }
      }

      return { success: true, game: response.documents[0] }
    } catch (error) {
      console.error('Failed to get game:', error)
      return { success: false, error: error.message }
    }
  }

  // Register a player to a game
  async registerPlayer(gameId, playerData) {
    try {
      // First check if game exists
      const gameResult = await this.getGame(gameId)
      if (!gameResult.success) {
        return { success: false, error: 'Game not found' }
      }

      // Check if player already registered with same email
      const existingPlayers = await databases.listDocuments(
        this.dbId,
        this.collections.players,
        [
          Query.equal('gameId', gameId),
          Query.equal('email', playerData.email)
        ]
      )

      if (existingPlayers.documents.length > 0) {
        // Return existing player data instead of error
        const existingPlayer = existingPlayers.documents[0]
        return { success: true, player: existingPlayer, isReturning: true }
      }

      // Register new player
      const player = await databases.createDocument(
        this.dbId,
        this.collections.players,
        generateId(),
        {
          gameId,
          name: playerData.name,
          regNo: playerData.regNo,
          email: playerData.email,
          score: 0,
          isActive: true,
          joinedAt: new Date().toISOString()
        }
      )

      // Update game player count
      const allPlayers = await databases.listDocuments(
        this.dbId,
        this.collections.players,
        [Query.equal('gameId', gameId)]
      )

      await databases.updateDocument(
        this.dbId,
        this.collections.games,
        gameResult.game.$id,
        {
          playerCount: allPlayers.documents.length,
          updatedAt: new Date().toISOString()
        }
      )

      return { success: true, player, isReturning: false }
    } catch (error) {
      console.error('Failed to register player:', error)
      return { success: false, error: error.message }
    }
  }

  // Submit player answer
  async submitAnswer(roundId, playerId, hasNumber, gameId) {
    try {
      const answer = await databases.createDocument(
        this.dbId,
        this.collections.answers,
        generateId(),
        {
          roundId,
          playerId,
          gameId,
          hasNumber,
          claimedWin: hasNumber,
          responseTime: new Date().toISOString(),
          points: hasNumber ? 10 : 0
        }
      )

      // Update player score if they have the number
      if (hasNumber) {
        const player = await databases.getDocument(
          this.dbId,
          this.collections.players,
          playerId
        )

        await databases.updateDocument(
          this.dbId,
          this.collections.players,
          playerId,
          {
            score: (player.score || 0) + 10
          }
        )
      }

      return { success: true, answer }
    } catch (error) {
      console.error('Failed to submit answer:', error)
      return { success: false, error: error.message }
    }
  }

  // Get current active round
  async getCurrentRound(gameId) {
    try {
      const response = await databases.listDocuments(
        this.dbId,
        this.collections.rounds,
        [
          Query.equal('gameId', gameId),
          Query.equal('isActive', true),
          Query.orderDesc('roundNumber'),
          Query.limit(1)
        ]
      )

      if (response.documents.length === 0) {
        return { success: false, error: 'No active round found' }
      }

      return { success: true, round: response.documents[0] }
    } catch (error) {
      console.error('Failed to get current round:', error)
      return { success: false, error: error.message }
    }
  }

  // Get leaderboard for a game
  async getLeaderboard(gameId) {
    try {
      const response = await databases.listDocuments(
        this.dbId,
        this.collections.players,
        [
          Query.equal('gameId', gameId),
          Query.orderDesc('score'),
          Query.limit(50)
        ]
      )

      return { success: true, players: response.documents }
    } catch (error) {
      console.error('Failed to get leaderboard:', error)
      return { success: false, error: error.message }
    }
  }

  // Get all players for a game
  async getGamePlayers(gameId) {
    try {
      const response = await databases.listDocuments(
        this.dbId,
        this.collections.players,
        [Query.equal('gameId', gameId)]
      )

      return { success: true, players: response.documents }
    } catch (error) {
      console.error('Failed to get game players:', error)
      return { success: false, error: error.message }
    }
  }

  // Update player score
  async updatePlayerScore(playerId, pointsToAdd) {
    try {
      // Get current player data
      const playerResponse = await databases.getDocument(
        this.dbId,
        this.collections.players,
        playerId
      )

      const currentScore = playerResponse.score || 0
      const newScore = currentScore + pointsToAdd

      // Update player score
      await databases.updateDocument(
        this.dbId,
        this.collections.players,
        playerId,
        {
          score: newScore,
          updatedAt: new Date().toISOString()
        }
      )

      return { success: true, newScore }
    } catch (error) {
      console.error('Failed to update player score:', error)
      return { success: false, error: error.message }
    }
  }

  // Record player answer for a round
  async recordPlayerAnswer(gameId, playerId, questionNumber, selectedAnswer, isCorrect) {
    try {
      const answerData = {
        gameId,
        playerId,
        questionNumber,
        selectedAnswer: selectedAnswer !== null ? selectedAnswer : -1, // -1 for no answer
        isCorrect: isCorrect || false,
        submittedAt: new Date().toISOString()
      }

      const response = await databases.createDocument(
        this.dbId,
        this.collections.answers,
        generateId(),
        answerData
      )

      return { success: true, answer: response }
    } catch (error) {
      console.error('Failed to record player answer:', error)
      return { success: false, error: error.message }
    }
  }

  // Get player's answered questions (for showing green tickets)
  async getPlayerAnswers(gameId, playerId) {
    try {
      const response = await databases.listDocuments(
        this.dbId,
        this.collections.answers,
        [
          Query.equal('gameId', gameId),
          Query.equal('playerId', playerId)
        ]
      )

      return { success: true, answers: response.documents }
    } catch (error) {
      console.error('Failed to get player answers:', error)
      return { success: false, error: error.message }
    }
  }
}

export const gameService = new GameService()
