// Traditional Tambola Winning Criteria
// Based on player's ticket (3 rows x 5 numbers = 15 numbers total)

/**
 * Check if player has won "Early Five" - First to reach 50 points
 * 50 points for first player to achieve this
 */
export const checkEarlyFive = (playerScore) => {
  return playerScore >= 50
}

/**
 * Check if player has won "Any Row" - Any complete row (first, second, or third)
 */
export const checkAnyRow = (correctNumbers, playerTicket, incorrectNumbers = new Set()) => {
  const rows = playerTicket || []
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || []
    
    // Check if any numbers in this row were answered incorrectly
    const hasIncorrectInRow = row.some(num => incorrectNumbers.has(num))
    
    if (!hasIncorrectInRow && row.every(num => correctNumbers.has(num))) {
      return true // This row is complete and unblocked
    }
  }
  
  return false
}

/**
 * Check if player has won "Full House" - All 15 numbers in ticket marked correctly
 */
export const checkFullHouse = (correctNumbers, playerTicket, incorrectNumbers = new Set()) => {
  const ticketNumbers = playerTicket.flat()
  
  // Check if any ticket numbers were answered incorrectly
  const hasIncorrectTicketNumbers = ticketNumbers.some(num => incorrectNumbers.has(num))
  if (hasIncorrectTicketNumbers) {
    return false // Blocked
  }
  
  return ticketNumbers.every(num => correctNumbers.has(num))
}

/**
 * Check all winning conditions and return which ones are newly achieved
 * Uses the database column names: earlyAdopter, gasSaver, cornerNodes, minerOfDay, fullBlockchain
 * @param {Set} correctNumbers - Set of correctly answered numbers
 * @param {Object} previousWins - Object tracking which conditions were already won
 * @param {Array} playerTicket - Player's 3x5 ticket array
 * @param {Set} incorrectNumbers - Set of incorrectly answered numbers (for blocking logic)
 * @param {number} playerScore - Player's current score for Early Five check
 * @returns {Object} - Object with newly achieved wins using database column names
 */
export const checkAllWinningConditions = (correctNumbers, previousWins = {}, playerTicket = [], incorrectNumbers = new Set(), playerScore = 0) => {
  const newWins = {}
  
  // Check Early Five (earlyAdopter) - first to 50 points, not blocked by incorrect answers
  if (!previousWins.earlyAdopter && checkEarlyFive(playerScore)) {
    newWins.earlyAdopter = true
  }
  
  // Check Any Row (gasSaver) - any complete row, blocked by incorrect numbers in that row
  if (!previousWins.gasSaver && checkAnyRow(correctNumbers, playerTicket, incorrectNumbers)) {
    newWins.gasSaver = true
  }
  
  // Check Full House (fullBlockchain) - all 15 numbers, blocked by any incorrect ticket number
  if (!previousWins.fullBlockchain && checkFullHouse(correctNumbers, playerTicket, incorrectNumbers)) {
    newWins.fullBlockchain = true
  }
  
  return newWins
}

/**
 * Check which winning conditions are permanently blocked
 * @param {Set} incorrectNumbers - Set of incorrectly answered numbers
 * @param {Array} playerTicket - Player's 3x5 ticket array
 * @returns {Object} - Object indicating which conditions are blocked
 */
export const getBlockedConditions = (incorrectNumbers = new Set(), playerTicket = []) => {
  const blocked = {}
  const ticketNumbers = playerTicket.flat()
  
  // Early Five (earlyAdopter) is NEVER blocked - it's based on total score, not ticket numbers
  blocked.earlyAdopter = { blocked: false, reason: null }
  
  // Any Row (gasSaver) - check if all rows are blocked
  const rows = playerTicket || []
  let allRowsBlocked = true
  
  for (const row of rows) {
    if (row && row.length === 5) {
      const hasIncorrectInRow = row.some(num => incorrectNumbers.has(num))
      if (!hasIncorrectInRow) {
        allRowsBlocked = false
        break
      }
    }
  }
  
  if (allRowsBlocked && rows.length > 0) {
    blocked.gasSaver = {
      blocked: true,
      reason: "All rows have incorrect numbers"
    }
  } else {
    blocked.gasSaver = { blocked: false, reason: null }
  }
  
  // Full House (fullBlockchain) - blocked if any ticket number is incorrect
  const hasIncorrectTicketNumbers = ticketNumbers.some(num => incorrectNumbers.has(num))
  
  if (hasIncorrectTicketNumbers) {
    const incorrectCount = ticketNumbers.filter(num => incorrectNumbers.has(num)).length
    blocked.fullBlockchain = {
      blocked: true,
      reason: `${incorrectCount} ticket number(s) answered incorrectly`
    }
  } else {
    blocked.fullBlockchain = { blocked: false, reason: null }
  }
  
  return blocked
}

/**
 * Get winning condition descriptions with database column mapping
 */
export const getWinConditionInfo = () => {
  return {
    earlyAdopter: {
      name: "Early Five",
      description: "First to reach 50 points",
      icon: "⚡",
      priority: 1,
      points: 50
    },
    gasSaver: {
      name: "Any Row", 
      description: "Complete any row in your ticket",
      icon: "🎯",
      priority: 2,
      points: 100
    },
    fullBlockchain: {
      name: "Full House",
      description: "All 15 numbers in your ticket completed",
      icon: "🏆",
      priority: 3,
      points: 200
    }
  }
}

/**
 * Get progress towards each winning condition based on player's ticket and score
 * @param {Set} correctNumbers - Set of correctly answered numbers
 * @param {Array} playerTicket - Player's 3x5 ticket array
 * @param {Set} incorrectNumbers - Set of incorrectly answered numbers
 * @param {number} playerScore - Player's current score
 * @returns {Object} - Progress information for each condition
 */
export const getWinProgress = (correctNumbers, playerTicket = [], incorrectNumbers = new Set(), playerScore = 0) => {
  const progress = {}
  const ticketNumbers = playerTicket.flat()
  
  // Early Five progress - based on score, not ticket numbers
  progress.earlyAdopter = {
    current: playerScore,
    target: 50,
    percentage: Math.min((playerScore / 50) * 100, 100),
    pointsToGo: Math.max(50 - playerScore, 0)
  }
  
  // Any Row progress - check each row and show best progress
  const rows = playerTicket || []
  let bestRowProgress = 0
  let bestRowIndex = -1
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || []
    const hasIncorrectInRow = row.some(num => incorrectNumbers.has(num))
    if (!hasIncorrectInRow) {
      const rowCorrect = row.filter(num => correctNumbers.has(num)).length
      if (rowCorrect > bestRowProgress) {
        bestRowProgress = rowCorrect
        bestRowIndex = i
      }
    }
  }
  
  progress.gasSaver = {
    current: bestRowProgress,
    target: 5,
    percentage: (bestRowProgress / 5) * 100,
    numbersToGo: Math.max(5 - bestRowProgress, 0),
    bestRow: bestRowIndex + 1
  }
  
  // Full House progress
  const correctTicketNumbers = ticketNumbers.filter(num => correctNumbers.has(num))
  progress.fullBlockchain = {
    current: correctTicketNumbers.length,
    target: 15,
    percentage: (correctTicketNumbers.length / 15) * 100,
    numbersToGo: Math.max(15 - correctTicketNumbers.length, 0)
  }
  
  return progress
}