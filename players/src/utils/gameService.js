import { databases, generateId, APPWRITE_CONFIG } from './appwrite.js'
import { Query } from 'appwrite'
import client from './appwrite.js'

// Game Service for managing Tambola games with Appwrite
export class GameService {
  constructor() {
    this.dbId = APPWRITE_CONFIG.databaseId
    this.collections = APPWRITE_CONFIG.collections
    this.subscribers = new Map() // Store real-time subscribers
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

  // Check if a winning condition has already been won by another player
  async checkWinConditionAvailable(gameId, condition) {
    try {
      const result = await databases.listDocuments(
        this.dbId,
        this.collections.players,
        [
          Query.equal('gameId', gameId),
          Query.equal(condition, true),
          Query.limit(1) // Only need to know if any player has won this condition
        ]
      )
      
      // Return true if no one has won this condition yet
      return result.documents.length === 0
    } catch (error) {
      console.error(`Failed to check ${condition} availability:`, error)
      // On error, allow the win attempt (fail open)
      return true
    }
  }

  // OPTIMIZED: Update player score directly when answer is correct (single request)
  async recordPlayerAnswer(gameId, playerId, questionNumber, selectedAnswer, isCorrect, winConditions = {}, correctNumbers = new Set()) {
    try {
      // Only update if answer is correct - single optimized request
      if (isCorrect) {
        // Get current player data
        const currentPlayer = await databases.getDocument(
          this.dbId,
          this.collections.players,
          playerId
        )

        const currentScore = currentPlayer.score || 0
        const newScore = currentScore + 10

        // Prepare update data with score, wins, and correct numbers in one request
        const updateData = {
          score: newScore,
          correctNumbers: Array.from(correctNumbers)
        }

        // Check which winning conditions are actually available (not already won by others)
        const availableWins = {}
        for (const [condition, won] of Object.entries(winConditions)) {
          if (won && !currentPlayer[condition]) { // Only if player hasn't won it yet
            // Check if this condition is still available (no other player has won it)
            const isAvailable = await this.checkWinConditionAvailable(gameId, condition)
            if (isAvailable) {
              availableWins[condition] = true
            } else {
              console.log(`🚫 ${condition} already won by another player, not awarding to ${playerId}`)
            }
          }
        }

        // Add winning conditions if any new wins are available
        const timestamp = new Date().toISOString()
        let winTimestamps = {}
        
        // Parse existing winTimestamps
        if (currentPlayer.winTimestamps) {
          try {
            winTimestamps = JSON.parse(currentPlayer.winTimestamps)
          } catch (e) {
            console.warn('Failed to parse existing winTimestamps, using empty object')
            winTimestamps = {}
          }
        }

        // Add new available wins
        let hasNewWins = false
        for (const [condition, won] of Object.entries(availableWins)) {
          if (won) {
            updateData[condition] = true
            winTimestamps[condition] = timestamp
            hasNewWins = true
            console.log(`🏆 ${condition} awarded to player ${playerId}`)
          }
        }

        // Update winTimestamps if there are any wins
        if (hasNewWins || Object.keys(winTimestamps).length > 0) {
          updateData.winTimestamps = JSON.stringify(winTimestamps)
        }

        // SINGLE REQUEST: Update everything at once
        const response = await databases.updateDocument(
          this.dbId,
          this.collections.players,
          playerId,
          updateData
        )

        console.log(`✅ OPTIMIZED: Player ${playerId} updated in single request: score ${currentScore} -> ${newScore}, available wins:`, availableWins)
        return { 
          success: true, 
          newScore, 
          player: response, 
          newWins: availableWins, // Return only the wins that were actually awarded
          deniedWins: Object.keys(winConditions).filter(c => winConditions[c] && !availableWins[c]), // Track wins that were denied
          message: 'Score and wins updated successfully' 
        }
      } else {
        // Wrong answer - no database update needed
        return { success: true, message: 'Wrong answer, no score update' }
      }
    } catch (error) {
      console.error('Failed to update player score and wins:', error)
      return { success: false, error: error.message }
    }
  }

  // DEPRECATED: Keep for backward compatibility but prefer recordPlayerAnswer for optimization
  async updatePlayerScore(playerId, pointsToAdd) {
    try {
      // First get current player data
      const currentPlayer = await databases.getDocument(
        this.dbId,
        this.collections.players,
        playerId
      )

      const currentScore = currentPlayer.score || 0
      const newScore = currentScore + pointsToAdd

      // Update player score
      const response = await databases.updateDocument(
        this.dbId,
        this.collections.players,
        playerId,
        { 
          score: newScore,
          updatedAt: new Date().toISOString()
        }
      )

      console.log(`Player ${playerId} score updated: ${currentScore} -> ${newScore} (+${pointsToAdd})`)
      return { success: true, newScore, player: response }
    } catch (error) {
      console.error('Failed to update player score:', error)
      return { success: false, error: error.message }
    }
  }

  // Subscribe to real-time game updates
  subscribeToGameUpdates(gameId, callbacks = {}) {
    try {
      const subscriptionId = `game_${gameId}_${Date.now()}`
      
      // Subscribe to game document changes
      const unsubscribe = client.subscribe(
        `databases.${this.dbId}.collections.${this.collections.games}.documents`,
        (response) => {
          console.log('🔔 Real-time game update received:', response)
          
          // Filter for our specific game
          if (response.payload.gameId === gameId) {
            const eventType = response.events[0]
            
            if (eventType.includes('update')) {
              const updatedGame = response.payload
              
              // Check for game status changes
              if (updatedGame.status === 'active' && callbacks.onGameStart) {
                console.log('🎯 Game started notification')
                callbacks.onGameStart(updatedGame)
              }
              
              // Check for new numbers called
              if (updatedGame.calledNumbers && callbacks.onNumberCalled) {
                console.log('📢 New number called notification')
                callbacks.onNumberCalled(updatedGame)
              }
              
              // General game update callback
              if (callbacks.onGameUpdate) {
                callbacks.onGameUpdate(updatedGame)
              }
            }
          }
        }
      )
      
      // Store subscription for later cleanup
      this.subscribers.set(subscriptionId, unsubscribe)
      
      console.log(`✅ Subscribed to game ${gameId} updates (ID: ${subscriptionId})`)
      return { success: true, subscriptionId, unsubscribe }
      
    } catch (error) {
      console.error('Failed to subscribe to game updates:', error)
      return { success: false, error: error.message }
    }
  }

  // Unsubscribe from real-time updates
  unsubscribeFromGameUpdates(subscriptionId) {
    try {
      if (this.subscribers.has(subscriptionId)) {
        const unsubscribe = this.subscribers.get(subscriptionId)
        unsubscribe()
        this.subscribers.delete(subscriptionId)
        console.log(`✅ Unsubscribed from updates (ID: ${subscriptionId})`)
        return { success: true }
      }
      return { success: false, error: 'Subscription not found' }
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
      return { success: false, error: error.message }
    }
  }

  // Clean up all subscriptions
  unsubscribeAll() {
    try {
      for (const [id, unsubscribe] of this.subscribers) {
        unsubscribe()
      }
      this.subscribers.clear()
      console.log('✅ All subscriptions cleaned up')
      return { success: true }
    } catch (error) {
      console.error('Failed to clean up subscriptions:', error)
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

      return { success: true, winners: response.documents }
    } catch (error) {
      console.error('Failed to get game winners:', error)
      return { success: false, error: error.message }
    }
  }

  // Check if a player has already won a specific condition
  async hasPlayerWon(playerId, condition) {
    try {
      const player = await databases.getDocument(
        this.dbId,
        this.collections.players,
        playerId
      )

      return { success: true, hasWon: player[condition] === true }
    } catch (error) {
      console.error('Failed to check player win status:', error)
      return { success: false, error: error.message }
    }
  }

  // Get player's current score and leaderboard position
  async getPlayerScoreAndPosition(gameId, playerId) {
    try {
      // Get all players in the game sorted by score descending
      const playersResult = await databases.listDocuments(
        this.dbId,
        this.collections.players,
        [
          Query.equal('gameId', gameId),
          Query.orderDesc('score'),
          Query.limit(100) // Get top 100 players for position calculation
        ]
      )

      if (!playersResult.documents.length) {
        return { success: false, error: 'No players found in game' }
      }

      // Find the player's data and position
      const players = playersResult.documents
      let playerData = null
      let position = null

      for (let i = 0; i < players.length; i++) {
        if (players[i].$id === playerId) {
          playerData = players[i]
          position = i + 1 // Position is 1-based
          break
        }
      }

      if (!playerData) {
        return { success: false, error: 'Player not found in game' }
      }

      return {
        success: true,
        score: playerData.score || 0,
        position: position,
        totalPlayers: players.length
      }
    } catch (error) {
      console.error('Failed to get player score and position:', error)
      return { success: false, error: error.message }
    }
  }
}

export const gameService = new GameService()
