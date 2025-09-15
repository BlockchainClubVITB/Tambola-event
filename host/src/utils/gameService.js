import { databases, generateId, APPWRITE_CONFIG } from './appwrite.js'
import { Query } from 'appwrite'

// Game Service for managing Tambola games with Appwrite
export class GameService {
  constructor() {
    this.dbId = APPWRITE_CONFIG.databaseId
    this.collections = APPWRITE_CONFIG.collections
  }

  // Create a new game
  async createGame(hostName, customGameId = null) {
    try {
      const gameId = customGameId || Math.random().toString(36).substring(2, 8).toUpperCase()
      
      // Check if game ID already exists
      const existingGame = await this.getGame(gameId)
      if (existingGame.success) {
        return { success: false, error: 'Game ID already exists. Please choose a different ID.' }
      }
      
      const gameData = {
        gameId,
        hostName,
        status: 'waiting',
        playerCount: 0,
        calledNumbers: [],
        currentNumber: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const response = await databases.createDocument(
        this.dbId,
        this.collections.games,
        generateId(),
        gameData
      )

      return { success: true, game: response, gameId }
    } catch (error) {
      console.error('Failed to create game:', error)
      return { success: false, error: error.message }
    }
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

      // Check if player already registered
      const existingPlayers = await databases.listDocuments(
        this.dbId,
        this.collections.players,
        [
          Query.equal('gameId', gameId),
          Query.equal('email', playerData.email)
        ]
      )

      if (existingPlayers.documents.length > 0) {
        return { success: false, error: 'Player already registered with this email' }
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

      return { success: true, player }
    } catch (error) {
      console.error('Failed to register player:', error)
      return { success: false, error: error.message }
    }
  }

    // Start the game
  async startGame(gameId) {
    try {
      const gameResult = await this.getGame(gameId)
      if (!gameResult.success) {
        return { success: false, error: 'Game not found' }
      }

      const game = gameResult.game
      
      await databases.updateDocument(
        this.dbId,
        this.collections.games,
        game.$id,
        {
          status: 'active',
          updatedAt: new Date().toISOString()
        }
      )

      return { success: true, game: { ...game, status: 'active' } }
    } catch (error) {
      console.error('Failed to start game:', error)
      return { success: false, error: error.message }
    }
  }

  // Start a round with selected number
  async startRound(gameId, selectedNumber) {
    try {
      const gameResult = await this.getGame(gameId)
      if (!gameResult.success) {
        return { success: false, error: 'Game not found' }
      }

      const game = gameResult.game
      
      // Check if number already called
      if (game.calledNumbers && game.calledNumbers.includes(selectedNumber)) {
        return { success: false, error: 'Number already called' }
      }

      // Get current round number
      const existingRounds = await databases.listDocuments(
        this.dbId,
        this.collections.rounds,
        [Query.equal('gameId', gameId)]
      )

      const roundNumber = existingRounds.documents.length + 1

      // Create new round
      const round = await databases.createDocument(
        this.dbId,
        this.collections.rounds,
        generateId(),
        {
          gameId,
          roundNumber,
          currentNumber: selectedNumber,
          phase: 'prepare',
          startTime: new Date().toISOString(),
          endTime: null,
          isActive: true
        }
      )

      // Update game with new number and status
      const updatedCalledNumbers = [...(game.calledNumbers || []), selectedNumber.toString()]
      
      await databases.updateDocument(
        this.dbId,
        this.collections.games,
        game.$id,
        {
          status: 'active',
          currentNumber: selectedNumber,
          calledNumbers: updatedCalledNumbers,
          updatedAt: new Date().toISOString()
        }
      )

      return { success: true, round, game: { ...game, calledNumbers: updatedCalledNumbers, currentNumber: selectedNumber } }
    } catch (error) {
      console.error('Failed to start round:', error)
      return { success: false, error: error.message }
    }
  }

  // Update round phase
  async updateRoundPhase(roundId, phase) {
    try {
      await databases.updateDocument(
        this.dbId,
        this.collections.rounds,
        roundId,
        {
          phase,
          updatedAt: new Date().toISOString()
        }
      )
      return { success: true }
    } catch (error) {
      console.error('Failed to update round phase:', error)
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

  // End current round
  async endRound(roundId) {
    try {
      await databases.updateDocument(
        this.dbId,
        this.collections.rounds,
        roundId,
        {
          isActive: false,
          endTime: new Date().toISOString(),
          phase: 'completed'
        }
      )
      return { success: true }
    } catch (error) {
      console.error('Failed to end round:', error)
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

  // Update game with called numbers
  async updateGameNumbers(gameId, calledNumber) {
    try {
      // Get current game
      const gameResult = await this.getGame(gameId)
      if (!gameResult.success) {
        return { success: false, error: 'Game not found' }
      }

      const game = gameResult.game
      const currentNumbers = game.calledNumbers || []
      
      console.log('Current numbers from database:', currentNumbers)
      console.log('Adding number:', calledNumber)
      
      // Ensure we're working with integers
      const numberAsInt = parseInt(calledNumber)
      
      // Add the new number if it's not already called
      if (!currentNumbers.includes(numberAsInt)) {
        currentNumbers.push(numberAsInt)
      }

      console.log('Updating game with numbers:', currentNumbers)

      // Update the game document
      await databases.updateDocument(
        this.dbId,
        this.collections.games,
        game.$id,
        {
          calledNumbers: currentNumbers,
          currentNumber: numberAsInt,
          updatedAt: new Date().toISOString()
        }
      )

      return { success: true, calledNumbers: currentNumbers }
    } catch (error) {
      console.error('Failed to update game numbers:', error)
      return { success: false, error: error.message }
    }
  }

  // Reset game - clear called numbers and reset status
  async resetGame(gameId) {
    try {
      // Get current game
      const gameResult = await this.getGame(gameId)
      if (!gameResult.success) {
        return { success: false, error: 'Game not found' }
      }

      const game = gameResult.game

      // Reset the game document
      await databases.updateDocument(
        this.dbId,
        this.collections.games,
        game.$id,
        {
          calledNumbers: [],
          currentNumber: null,
          status: 'waiting',
          updatedAt: new Date().toISOString()
        }
      )

      return { success: true }
    } catch (error) {
      console.error('Failed to reset game:', error)
      return { success: false, error: error.message }
    }
  }

  // Get all winners for a specific game and condition
  async getGameWinners(gameId, condition = null) {
    try {
      const queries = [Query.equal('gameId', gameId)]
      
      if (condition) {
        queries.push(Query.equal(condition, true))
      }

      const response = await databases.listDocuments(
        this.dbId,
        this.collections.players,
        queries
      )

      // Parse winTimestamps JSON strings for each player
      const playersWithParsedTimestamps = response.documents.map(player => ({
        ...player,
        winTimestamps: player.winTimestamps ? (() => {
          try {
            return JSON.parse(player.winTimestamps)
          } catch (e) {
            console.warn(`Failed to parse winTimestamps for player ${player.$id}`)
            return {}
          }
        })() : {}
      }))

      return { success: true, winners: playersWithParsedTimestamps }
    } catch (error) {
      console.error('Failed to get game winners:', error)
      return { success: false, error: error.message }
    }
  }

  // OPTIMIZED: Get comprehensive winner data with caching
  async getAllWinners(gameId, useCache = true) {
    try {
      // Simple cache key
      const cacheKey = `winners_${gameId}`
      const cacheExpiry = 5000 // 5 seconds cache
      
      // Check cache first if enabled
      if (useCache && this._winnerCache && this._winnerCache[cacheKey]) {
        const cached = this._winnerCache[cacheKey]
        if (Date.now() - cached.timestamp < cacheExpiry) {
          console.log('🔄 Using cached winner data')
          return cached.data
        }
      }

      const winConditions = ['earlyAdopter', 'gasSaver', 'cornerNodes', 'minerOfDay', 'fullBlockchain']
      const winnerData = {}

      // Get all players with any wins in single query (optimized)
      const allPlayersResult = await databases.listDocuments(
        this.dbId,
        this.collections.players,
        [
          Query.equal('gameId', gameId),
          Query.orderDesc('score') // Order by score for better UX
        ]
      )

      if (allPlayersResult.documents) {
        // Filter winners by condition locally (reduces DB queries from 5 to 1)
        for (const condition of winConditions) {
          winnerData[condition] = allPlayersResult.documents.filter(player => player[condition] === true)
        }
      } else {
        // Fallback to individual queries if needed
        for (const condition of winConditions) {
          const result = await this.getGameWinners(gameId, condition)
          winnerData[condition] = result.success ? result.winners : []
        }
      }

      const result = { success: true, winners: winnerData }
      
      // Cache the result
      if (!this._winnerCache) this._winnerCache = {}
      this._winnerCache[cacheKey] = {
        data: result,
        timestamp: Date.now()
      }

      return result
    } catch (error) {
      console.error('Failed to get all winners:', error)
      return { success: false, error: error.message }
    }
  }

  // Clear winner cache manually
  clearWinnerCache(gameId = null) {
    if (!this._winnerCache) return
    
    if (gameId) {
      delete this._winnerCache[`winners_${gameId}`]
    } else {
      this._winnerCache = {}
    }
  }
}

export const gameService = new GameService()
