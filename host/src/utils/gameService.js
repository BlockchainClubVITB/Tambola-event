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

      const winConditions = ['earlyAdopter', 'gasSaver', 'fullBlockchain']
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

  // Get pending win requests for a game (host use) - supports both winRequests and verificationRequests
  async getPendingWinRequests(gameId) {
    try {
      // Try winRequests collection first
      try {
        const response = await databases.listDocuments(
          this.dbId,
          'winRequests',
          [
            Query.equal('gameId', gameId),
            Query.equal('status', 'pending'),
            Query.orderDesc('createdAt')
          ]
        )

        console.log(`📝 Found ${response.documents.length} pending win requests`)
        return { success: true, requests: response.documents }
      } catch (error) {
        // Fall back to verificationRequests collection
        if (error.message && error.message.includes('Collection with the requested ID could not be found')) {
          console.log('📝 winRequests collection not found, trying verificationRequests')
          const response = await databases.listDocuments(
            this.dbId,
            'verificationRequests',
            [
              Query.equal('gameId', gameId),
              Query.equal('status', 'pending'),
              Query.orderDesc('createdAt')
            ]
          )

          console.log(`📝 Found ${response.documents.length} pending verification requests`)
          return { success: true, requests: response.documents }
        }
        throw error
      }
    } catch (error) {
      // If both collections don't exist, return empty array
      if (error.message && error.message.includes('Collection with the requested ID could not be found')) {
        console.log('📝 No win request collections found, returning empty requests')
        return { success: true, requests: [] }
      }
      
      console.error('Failed to get pending win requests:', error)
      return { success: false, error: error.message, requests: [] }
    }
  }

  // Approve a win request and declare the winner
  async approveWinRequest(requestId, playerId, playerName, condition) {
    try {
      console.log(`🏆 Approving win request: ${playerName} for ${condition}`)

      // First, try to update the request status to approved
      let requestUpdateResult = null
      try {
        // Try winRequests collection first
        requestUpdateResult = await databases.updateDocument(
          this.dbId,
          'winRequests',
          requestId,
          {
            status: 'approved',
            approvedAt: new Date().toISOString()
          }
        )
      } catch (error) {
        // Fall back to verificationRequests collection
        if (error.message && error.message.includes('Collection with the requested ID could not be found')) {
          requestUpdateResult = await databases.updateDocument(
            this.dbId,
            'verificationRequests',
            requestId,
            {
              status: 'approved',
              verifiedAt: new Date().toISOString(),
              verifiedBy: 'host'
            }
          )
        } else {
          throw error
        }
      }

      // Then declare the winner (update player record)
      const declareResult = await this.declareWinner(playerId, condition)
      
      if (declareResult.success) {
        console.log(`✅ Win request approved and winner declared: ${playerName} for ${condition}`)
        return { 
          success: true, 
          request: requestUpdateResult,
          winner: declareResult.player 
        }
      } else {
        console.error('Failed to declare winner after approving request:', declareResult.error)
        return { success: false, error: declareResult.error }
      }
    } catch (error) {
      console.error('Failed to approve win request:', error)
      return { success: false, error: error.message }
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
      // If verification collection doesn't exist, handle gracefully
      if (error.message && error.message.includes('Collection with the requested ID could not be found')) {
        console.log('📝 Verification collection not found, cannot update verification request')
        return { success: false, error: 'Verification system not available', fallback: true }
      }
      
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
      
      // After declaring winner, decline all other pending requests for this condition
      await this.declineOtherVerificationRequests(currentPlayer.gameId, condition, playerId)
      
      return { success: true, player: response }
    } catch (error) {
      console.error('❌ Failed to declare winner:', error)
      return { success: false, error: error.message }
    }
  }

  // Decline all other pending verification requests for a specific condition (after winner is declared)
  async declineOtherVerificationRequests(gameId, condition, winnerPlayerId) {
    try {
      console.log(`🚫 Declining other pending requests for ${condition} (winner: ${winnerPlayerId})`)
      
      // Get all pending verification requests for this condition and game
      const result = await databases.listDocuments(
        this.dbId,
        this.collections.verificationRequests,
        [
          Query.equal('gameId', gameId),
          Query.equal('conditionId', condition),
          Query.equal('status', 'pending')
        ]
      )

      if (result.documents && result.documents.length > 0) {
        // Filter out the winner's request and decline all others
        const requestsToDecline = result.documents.filter(req => req.playerId !== winnerPlayerId)
        
        console.log(`📝 Found ${requestsToDecline.length} other pending requests to decline`)
        
        // Decline each request
        for (const request of requestsToDecline) {
          await databases.updateDocument(
            this.dbId,
            this.collections.verificationRequests,
            request.$id,
            {
              status: 'rejected',
              verifiedAt: new Date().toISOString(),
              verifiedBy: 'system_auto_decline',
              rejectionReason: `${condition} already won by another player`
            }
          )
          console.log(`✅ Auto-declined request ${request.$id} for player ${request.playerId}`)
        }
        
        return { success: true, declinedCount: requestsToDecline.length }
      } else {
        console.log('📝 No other pending requests found to decline')
        return { success: true, declinedCount: 0 }
      }
    } catch (error) {
      // If verification collection doesn't exist, log and continue
      if (error.message && error.message.includes('Collection with the requested ID could not be found')) {
        console.log('📝 Verification collection not found, skipping auto-decline')
        return { success: true, declinedCount: 0, fallback: true }
      }
      
      console.error('❌ Failed to decline other verification requests:', error)
      return { success: false, error: error.message }
    }
  }

  // Generate random team name
  generateRandomTeamName() {
    const adjectives = [
      'Lightning', 'Thunder', 'Blazing', 'Mighty', 'Swift', 'Golden', 'Silver', 'Diamond',
      'Phoenix', 'Dragon', 'Eagle', 'Tiger', 'Wolf', 'Storm', 'Fire', 'Ice',
      'Royal', 'Elite', 'Prime', 'Supreme', 'Alpha', 'Beta', 'Omega', 'Cosmic',
      'Quantum', 'Cyber', 'Neon', 'Turbo', 'Ultra', 'Mega', 'Super', 'Hyper',
      'Shadow', 'Ghost', 'Spirit', 'Phantom', 'Mystic', 'Magic', 'Crystal', 'Emerald',
      'Ruby', 'Sapphire', 'Platinum', 'Steel', 'Iron', 'Bronze', 'Crimson', 'Scarlet',
      'Azure', 'Violet', 'Amber', 'Jade', 'Onyx', 'Pearl', 'Obsidian', 'Titanium',
      'Stellar', 'Galactic', 'Solar', 'Lunar', 'Astral', 'Nebula', 'Meteor', 'Comet',
      'Arctic', 'Volcanic', 'Electric', 'Magnetic', 'Atomic', 'Nuclear', 'Digital', 'Virtual',
      'Sonic', 'Supersonic', 'Hypersonic', 'Velocity', 'Accelerated', 'Boosted', 'Enhanced', 'Advanced'
    ]
    
    const nouns = [
      'Warriors', 'Knights', 'Champions', 'Legends', 'Heroes', 'Titans', 'Giants', 'Masters',
      'Guardians', 'Defenders', 'Crusaders', 'Gladiators', 'Vikings', 'Spartans', 'Ninjas', 'Samurai',
      'Rockets', 'Eagles', 'Hawks', 'Falcons', 'Lions', 'Panthers', 'Wolves', 'Bears',
      'Coders', 'Hackers', 'Wizards', 'Mages', 'Sorcerers', 'Alchemists', 'Engineers', 'Architects',
      'Destroyers', 'Conquerors', 'Dominators', 'Terminators', 'Eliminators', 'Annihilators', 'Obliterators', 'Devastators',
      'Strikers', 'Raiders', 'Hunters', 'Trackers', 'Scouts', 'Rangers', 'Commandos', 'Marines',
      'Aces', 'Pilots', 'Navigators', 'Explorers', 'Pioneers', 'Voyagers', 'Adventurers', 'Wanderers',
      'Builders', 'Creators', 'Inventors', 'Innovators', 'Designers', 'Craftsmen', 'Artisans', 'Makers',
      'Rebels', 'Rogues', 'Mavericks', 'Outlaws', 'Bandits', 'Pirates', 'Corsairs', 'Buccaneers',
      'Phoenixes', 'Dragons', 'Griffins', 'Hydras', 'Krakens', 'Leviathans', 'Behemoths', 'Goliaths'
    ]
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    
    return `${adjective} ${noun}`
  }

  // Generate unique team name (checks for duplicates)
  async generateUniqueTeamName(maxAttempts = 50) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const teamName = this.generateRandomTeamName()
      
      try {
        // Check if team name already exists
        const existingTeams = await databases.listDocuments(
          this.dbId,
          this.collections.teamMembers,
          [Query.equal('teamName', teamName)]
        )
        
        if (existingTeams.documents.length === 0) {
          return teamName // Unique name found
        }
      } catch (error) {
        console.warn('Error checking team name uniqueness:', error)
        // If there's an error checking, just return the generated name
        return teamName
      }
    }
    
    // Fallback: add timestamp if all attempts failed
    const fallbackName = this.generateRandomTeamName()
    const timestamp = Date.now().toString().slice(-4)
    return `${fallbackName} ${timestamp}`
  }

  // Generate random password
  generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let password = ''
    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  // Register a team only (without game creation)
  async registerTeamOnly(teamData) {
    try {
      console.log('🏆 Registering team with data:', teamData)
      
      // Validate that we have required fields
      if (!teamData || !teamData.teamName || !teamData.teamPassword) {
        return { success: false, error: 'Team name and password are required' }
      }

      // Check if team name already exists
      try {
        const existingTeam = await databases.listDocuments(
          this.dbId,
          this.collections.teamMembers,
          [Query.equal('teamName', teamData.teamName)]
        )
        
        if (existingTeam.documents.length > 0) {
          return { success: false, error: 'Team name already exists. Please choose a different name.' }
        }
      } catch (error) {
        console.log('No existing team found, proceeding with registration')
      }

      // Create team document with only teamName and teamPassword
      const teamDoc = await databases.createDocument(
        this.dbId,
        this.collections.teamMembers,
        generateId(),
        {
          teamName: teamData.teamName.trim(),
          teamPassword: teamData.teamPassword.trim()
        }
      )

      console.log('✅ Team registered successfully:', { teamName: teamData.teamName, teamPassword: teamData.teamPassword })
      
      return { 
        success: true, 
        teamName: teamData.teamName,
        teamPassword: teamData.teamPassword,
        teamDoc: teamDoc,
        message: `Team "${teamData.teamName}" registered successfully` 
      }
    } catch (error) {
      console.error('❌ Failed to register team:', error)
      return { success: false, error: error.message }
    }
  }

  // Verify team credentials for game joining
  async verifyTeamCredentials(teamName, teamPassword) {
    try {
      const response = await databases.listDocuments(
        this.dbId,
        this.collections.teamMembers,
        [
          Query.equal('teamName', teamName),
          Query.equal('teamPassword', teamPassword)
        ]
      )

      if (response.documents.length > 0) {
        // Team credentials are valid
        return { 
          success: true, 
          isValid: true, 
          teamName,
          message: 'Team credentials verified successfully' 
        }
      } else {
        return { 
          success: true, 
          isValid: false, 
          message: 'Invalid team name or password' 
        }
      }
    } catch (error) {
      console.error('Failed to verify team credentials:', error)
      return { success: false, error: error.message, isValid: false }
    }
  }

  // Get all registered teams (for admin purposes)
  async getAllRegisteredTeams() {
    try {
      const response = await databases.listDocuments(
        this.dbId,
        this.collections.teamMembers,
        [
          Query.equal('isRegistered', true),
          Query.orderDesc('createdAt')
        ]
      )

      // Group members by team name
      const teamGroups = {}
      response.documents.forEach(member => {
        if (!teamGroups[member.teamName]) {
          teamGroups[member.teamName] = {
            teamName: member.teamName,
            teamPassword: member.teamPassword,
            members: [],
            createdAt: member.createdAt
          }
        }
        teamGroups[member.teamName].members.push({
          name: member.name,
          regNo: member.regNo,
          email: member.email
        })
      })

      return { success: true, teams: Object.values(teamGroups) }
    } catch (error) {
      console.error('Failed to get registered teams:', error)
      return { success: false, error: error.message, teams: [] }
    }
  }
  async registerTeam(gameId, members) {
    try {
      console.log('🏆 Registering team for game:', gameId, 'with members:', members)
      
      // Validate that we have exactly 4 members
      if (!members || members.length !== 4) {
        return { success: false, error: 'Team must have exactly 4 members' }
      }

      // Validate member data
      for (let i = 0; i < members.length; i++) {
        const member = members[i]
        if (!member.name || !member.regNo || !member.email) {
          return { success: false, error: `Member ${i + 1} is missing required fields (name, regNo, email)` }
        }
      }

      // Generate unique team name and password
      const teamName = await this.generateUniqueTeamName()
      const teamPassword = this.generateRandomPassword()

      // Create team member documents
      const teamMemberPromises = members.map(member => 
        databases.createDocument(
          this.dbId,
          this.collections.teamMembers,
          generateId(),
          {
            name: member.name,
            regNo: member.regNo,
            email: member.email,
            teamName: teamName,
            teamPassword: teamPassword,
            gameId: gameId,
            createdAt: new Date().toISOString()
          }
        )
      )

      // Execute all team member creations
      const teamMemberResults = await Promise.all(teamMemberPromises)

      // Update game with team info (add teamName and teamPassword columns)
      const gameResult = await databases.getDocument(
        this.dbId,
        this.collections.games,
        gameId
      )

      // Update game document with team information
      await databases.updateDocument(
        this.dbId,
        this.collections.games,
        gameResult.$id,
        {
          teamName: teamName,
          teamPassword: teamPassword,
          updatedAt: new Date().toISOString()
        }
      )

      console.log('✅ Team registered successfully:', { teamName, teamPassword })
      
      return { 
        success: true, 
        teamName, 
        teamPassword,
        teamMembers: teamMemberResults,
        message: `Team "${teamName}" registered successfully with password "${teamPassword}"` 
      }
    } catch (error) {
      console.error('❌ Failed to register team:', error)
      return { success: false, error: error.message }
    }
  }

  // Get all teams for a game
  async getGameTeams(gameId) {
    try {
      const response = await databases.listDocuments(
        this.dbId,
        this.collections.teamMembers,
        [
          Query.equal('gameId', gameId),
          Query.orderDesc('createdAt')
        ]
      )

      // Group members by team name
      const teamGroups = {}
      response.documents.forEach(member => {
        if (!teamGroups[member.teamName]) {
          teamGroups[member.teamName] = {
            teamName: member.teamName,
            teamPassword: member.teamPassword,
            members: []
          }
        }
        teamGroups[member.teamName].members.push({
          name: member.name,
          regNo: member.regNo,
          email: member.email
        })
      })

      return { success: true, teams: Object.values(teamGroups) }
    } catch (error) {
      console.error('Failed to get game teams:', error)
      return { success: false, error: error.message, teams: [] }
    }
  }

  // Declare a winner and block that condition for all other players
  async declareWinnerAndBlock(gameId, playerId, condition) {
    try {
      console.log(`🏆 Declaring winner and blocking condition ${condition} for game ${gameId}`)
      
      // First, get all players in the game
      const allPlayersResult = await databases.listDocuments(
        this.dbId,
        this.collections.players,
        [Query.equal('gameId', gameId)]
      )

      if (!allPlayersResult.documents || allPlayersResult.documents.length === 0) {
        return { success: false, error: 'No players found in game' }
      }

      // Get the winner player
      const winnerPlayer = allPlayersResult.documents.find(p => p.$id === playerId)
      if (!winnerPlayer) {
        return { success: false, error: 'Winner player not found' }
      }

      // Update all players to block this condition
      const updatePromises = allPlayersResult.documents.map(async (player) => {
        try {
          if (player.$id === playerId) {
            // For the winner: mark the condition as won
            await databases.updateDocument(
              this.dbId,
              this.collections.players,
              player.$id,
              {
                [condition]: true,
                [`${condition}Blocked`]: true // Also mark as blocked to prevent further wins
              }
            )
            console.log(`✅ Winner ${player.name} marked for ${condition}`)
          } else {
            // For all other players: mark the condition as blocked
            await databases.updateDocument(
              this.dbId,
              this.collections.players,
              player.$id,
              {
                [`${condition}Blocked`]: true
              }
            )
            console.log(`🚫 Player ${player.name} blocked for ${condition}`)
          }
        } catch (error) {
          console.error(`Failed to update player ${player.name}:`, error)
        }
      })

      // Wait for all updates to complete
      await Promise.all(updatePromises)

      // Clear winners cache to force refresh
      this.clearWinnerCache(gameId)

      console.log(`🎯 Winner declared: ${winnerPlayer.name} won ${condition}, condition blocked for all other players`)
      
      return { 
        success: true, 
        winner: winnerPlayer,
        condition,
        message: `${winnerPlayer.name} declared winner for ${condition}. Condition blocked for all other players.` 
      }
    } catch (error) {
      console.error('Failed to declare winner and block condition:', error)
      return { success: false, error: error.message }
    }
  }
}

export const gameService = new GameService()
