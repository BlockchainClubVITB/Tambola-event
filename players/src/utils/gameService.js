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

      // Check if player already registered with same email AND same details
      const existingPlayers = await databases.listDocuments(
        this.dbId,
        this.collections.players,
        [
          Query.equal('gameId', gameId),
          Query.equal('email', playerData.email),
          Query.equal('name', playerData.name),
          Query.equal('regNo', playerData.regNo)
        ]
      )

      if (existingPlayers.documents.length > 0) {
        // Return existing player data if it's truly the same player (same email, name, and regNo)
        const existingPlayer = existingPlayers.documents[0]
        return { success: true, player: existingPlayer, isReturning: true }
      }

      // Check if someone else already used this email with different details
      const emailConflict = await databases.listDocuments(
        this.dbId,
        this.collections.players,
        [
          Query.equal('gameId', gameId),
          Query.equal('email', playerData.email)
        ]
      )

      if (emailConflict.documents.length > 0) {
        const conflictPlayer = emailConflict.documents[0]
        if (conflictPlayer.name !== playerData.name || conflictPlayer.regNo !== playerData.regNo) {
          return { 
            success: false, 
            error: `Email ${playerData.email} is already registered with different details. Please use a different email or contact support.` 
          }
        }
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
      // Check if any verification request for this condition has been approved
      const verificationResult = await databases.listDocuments(
        this.dbId,
        this.collections.verificationRequests,
        [
          Query.equal('gameId', gameId),
          Query.equal('conditionId', condition),
          Query.equal('status', 'approved'),
          Query.limit(1) // Only need to know if any request has been approved
        ]
      )
      
      // Return true if no verified winner exists for this condition yet
      return verificationResult.documents.length === 0
    } catch (error) {
      // If verification collection doesn't exist, fall back to checking player records
      if (error.message && error.message.includes('Collection with the requested ID could not be found')) {
        console.log('📝 Verification collection not found, falling back to direct player check')
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
        } catch (fallbackError) {
          console.error(`Failed to check ${condition} availability (fallback):`, fallbackError)
          return true
        }
      }
      
      console.error(`Failed to check ${condition} availability:`, error)
      // On error, allow the verification request attempt (fail open)
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

        // Check which winning conditions need verification requests
        const verificationRequests = []
        for (const [condition, won] of Object.entries(winConditions)) {
          if (won && !currentPlayer[condition]) { // Only if player hasn't achieved this condition yet
            // Check if this condition is still available (no other player has been verified for it)
            const isAvailable = await this.checkWinConditionAvailable(gameId, condition)
            if (isAvailable) {
              // Submit verification request instead of directly awarding
              const verificationResult = await this.submitWinVerificationRequest(
                gameId, 
                playerId, 
                condition, 
                currentPlayer.ticketNumbers || [], 
                correctNumbers, 
                new Set() // incorrect numbers - empty for now
              )
              
              if (verificationResult.success) {
                verificationRequests.push({
                  condition,
                  verificationId: verificationResult.verificationRequest.verificationId,
                  status: 'pending'
                })
                console.log(`📝 Verification request submitted for ${condition} by player ${playerId}`)
              } else {
                console.error(`Failed to submit verification request for ${condition}:`, verificationResult.error)
              }
            } else {
              console.log(`🚫 ${condition} already verified for another player, request denied for ${playerId}`)
            }
          }
        }

        // SINGLE REQUEST: Update everything at once
        const response = await databases.updateDocument(
          this.dbId,
          this.collections.players,
          playerId,
          updateData
        )

        console.log(`✅ OPTIMIZED: Player ${playerId} updated in single request: score ${currentScore} -> ${newScore}, verification requests:`, verificationRequests)
        return { 
          success: true, 
          newScore, 
          player: response, 
          verificationRequests, // Return verification requests instead of direct wins
          message: 'Score updated and verification requests submitted' 
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

  // Submit a win verification request
  async submitWinVerificationRequest(gameId, playerId, conditionId, playerTicket, correctNumbers, incorrectNumbers) {
    try {
      console.log('📝 Submitting win verification request:', { gameId, playerId, conditionId })
      
      // Create verification request document
      const verificationRequest = {
        verificationId: generateId(),
        gameId: gameId,
        playerId: playerId,
        conditionId: conditionId,
        playerTicket: playerTicket,
        correctNumbers: Array.from(correctNumbers),
        incorrectNumbers: Array.from(incorrectNumbers),
        status: 'pending', // pending, approved, rejected
        requestedAt: new Date().toISOString(),
        verifiedAt: null,
        verifiedBy: null
      }

      const response = await databases.createDocument(
        this.dbId,
        this.collections.verificationRequests,
        verificationRequest.verificationId,
        verificationRequest
      )

      console.log('✅ Win verification request submitted successfully:', response)
      return { success: true, verificationRequest: response }
    } catch (error) {
      // If verification collection doesn't exist, fall back to direct win assignment
      if (error.message && error.message.includes('Collection with the requested ID could not be found')) {
        console.log('📝 Verification collection not found, falling back to direct win assignment')
        try {
          // Update player record directly with the winning condition
          const timestamp = new Date().toISOString()
          const updateData = {
            [conditionId]: true,
            winTimestamps: JSON.stringify({
              [conditionId]: timestamp
            })
          }

          const response = await databases.updateDocument(
            this.dbId,
            this.collections.players,
            playerId,
            updateData
          )

          console.log(`🏆 Direct win assigned: Player ${playerId} for ${conditionId}`)
          return { 
            success: true, 
            verificationRequest: { 
              verificationId: generateId(), 
              status: 'auto-approved',
              fallback: true 
            } 
          }
        } catch (fallbackError) {
          console.error('❌ Failed to assign direct win (fallback):', fallbackError)
          return { success: false, error: fallbackError.message }
        }
      }
      
      console.error('❌ Failed to submit win verification request:', error)
      return { success: false, error: error.message }
    }
  }

  // Get pending verification requests for a game (host use)
  async getPendingVerificationRequests(gameId) {
    try {
      const response = await databases.listDocuments(
        this.dbId,
        this.collections.verificationRequests,
        [
          Query.equal('gameId', gameId),
          Query.equal('status', 'pending')
        ]
      )

      return { success: true, requests: response.documents }
    } catch (error) {
      // If verification collection doesn't exist, return empty array
      if (error.message && error.message.includes('Collection with the requested ID could not be found')) {
        console.log('📝 Verification collection not found, returning empty requests')
        return { success: true, requests: [] }
      }
      
      console.error('Failed to get pending verification requests:', error)
      return { success: false, error: error.message, requests: [] }
    }
  }

  // Approve or reject a win verification request (host use)
  async updateVerificationRequest(verificationId, status, hostId, reason = null) {
    try {
      console.log('🔍 Updating verification request:', { verificationId, status, hostId })
      
      const updateData = {
        status: status, // 'approved' or 'rejected'
        verifiedAt: new Date().toISOString(),
        verifiedBy: hostId,
        rejectionReason: reason
      }

      const response = await databases.updateDocument(
        this.dbId,
        this.collections.verificationRequests,
        verificationId,
        updateData
      )

      // If approved, also update the player record with the winning condition
      if (status === 'approved') {
        const verificationRequest = response
        await this.declareWinner(verificationRequest.playerId, verificationRequest.conditionId)
      }

      console.log('✅ Verification request updated successfully:', response)
      return { success: true, verificationRequest: response }
    } catch (error) {
      console.error('❌ Failed to update verification request:', error)
      return { success: false, error: error.message }
    }
  }

  // Declare a winner by updating player record with verified winning condition
  async declareWinner(playerId, condition) {
    try {
      console.log('👑 Declaring winner:', { playerId, condition })
      
      const timestamp = new Date().toISOString()
      
      // Get current player data
      const currentPlayer = await databases.getDocument(
        this.dbId,
        this.collections.players,
        playerId
      )

      // Parse existing winTimestamps
      let winTimestamps = {}
      if (currentPlayer.winTimestamps) {
        try {
          winTimestamps = JSON.parse(currentPlayer.winTimestamps)
        } catch (e) {
          console.warn('Failed to parse existing winTimestamps, using empty object')
          winTimestamps = {}
        }
      }

      // Update player record with winning condition
      const updateData = {
        [condition]: true,
        winTimestamps: JSON.stringify({
          ...winTimestamps,
          [condition]: timestamp
        })
      }

      const response = await databases.updateDocument(
        this.dbId,
        this.collections.players,
        playerId,
        updateData
      )

      console.log(`🏆 Winner declared: Player ${playerId} for ${condition}`)
      return { success: true, player: response }
    } catch (error) {
      console.error('❌ Failed to declare winner:', error)
      return { success: false, error: error.message }
    }
  }

  // Get verification status for a player's conditions
  async getPlayerVerificationStatus(gameId, playerId) {
    try {
      const response = await databases.listDocuments(
        this.dbId,
        this.collections.verificationRequests,
        [
          Query.equal('gameId', gameId),
          Query.equal('playerId', playerId)
        ]
      )

      // Convert to status object by condition
      const statusByCondition = {}
      response.documents.forEach(request => {
        statusByCondition[request.conditionId] = {
          status: request.status,
          requestedAt: request.requestedAt,
          verifiedAt: request.verifiedAt,
          rejectionReason: request.rejectionReason
        }
      })

      return { success: true, verificationStatus: statusByCondition }
    } catch (error) {
      // If verification collection doesn't exist, return empty status
      if (error.message && error.message.includes('Collection with the requested ID could not be found')) {
        console.log('📝 Verification collection not found, returning empty status')
        return { success: true, verificationStatus: {} }
      }
      
      console.error('Failed to get player verification status:', error)
      return { success: false, error: error.message, verificationStatus: {} }
    }
  }
}

export const gameService = new GameService()
