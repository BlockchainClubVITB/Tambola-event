// Winning criteria functions for Tambola game
// Based on a 50-number board (1-50) arranged in 5 rows x 10 columns

/**
 * Convert number to board position
 * Board layout: 
 * Row 1: 1-10, Row 2: 11-20, Row 3: 21-30, Row 4: 31-40, Row 5: 41-50
 */
const getPosition = (number) => {
  const row = Math.ceil(number / 10) - 1 // 0-4
  const col = ((number - 1) % 10) // 0-9
  return { row, col }
}

/**
 * Check if player has won "Early Adopter" - First 5 numbers marked correctly
 * BLOCKING RULE: If any of questions 1-5 are answered incorrectly, Early Adopter is permanently blocked
 */
export const checkEarlyAdopter = (correctNumbers, incorrectNumbers = new Set()) => {
  const firstFiveQuestions = [1, 2, 3, 4, 5]
  
  // Check if any of the first 5 questions were answered incorrectly (permanently blocks this condition)
  const hasIncorrectInFirstFive = firstFiveQuestions.some(num => incorrectNumbers.has(num))
  
  if (hasIncorrectInFirstFive) {
    return false // Permanently blocked
  }
  
  return correctNumbers.size >= 5
}

/**
 * Check if player has won "Gas Saver" - First row complete (numbers 1-10)
 * BLOCKING RULE: If 4+ numbers in first row (1-10) are incorrect, Gas Saver is impossible
 */
export const checkGasSaver = (correctNumbers, incorrectNumbers = new Set()) => {
  const firstRowNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  
  // Check if too many incorrect answers in first row (4+ wrong = impossible)
  const incorrectInFirstRow = firstRowNumbers.filter(num => incorrectNumbers.has(num))
  if (incorrectInFirstRow.length >= 4) {
    return false // Blocked
  }
  
  return firstRowNumbers.every(num => correctNumbers.has(num))
}

/**
 * Check if player has won "Corner Nodes" - All 4 corners marked correctly
 * Corners: 1 (top-left), 10 (top-right), 41 (bottom-left), 50 (bottom-right)
 * BLOCKING RULE: If any corner is answered incorrectly, Corner Nodes is impossible
 */
export const checkCornerNodes = (correctNumbers, incorrectNumbers = new Set()) => {
  const corners = [1, 10, 41, 50]
  
  // Check if any corner answer is incorrect (1+ wrong = impossible)
  const incorrectCorners = corners.filter(num => incorrectNumbers.has(num))
  if (incorrectCorners.length >= 1) {
    return false // Blocked
  }
  
  return corners.every(num => correctNumbers.has(num))
}

/**
 * Check if player has won "Miner of the Day" - Any 2 complete rows
 */
export const checkMinerOfTheDay = (correctNumbers) => {
  const rows = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],      // Row 1
    [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], // Row 2
    [21, 22, 23, 24, 25, 26, 27, 28, 29, 30], // Row 3
    [31, 32, 33, 34, 35, 36, 37, 38, 39, 40], // Row 4
    [41, 42, 43, 44, 45, 46, 47, 48, 49, 50]  // Row 5
  ]
  
  let completedRows = 0
  for (const row of rows) {
    if (row.every(num => correctNumbers.has(num))) {
      completedRows++
      if (completedRows >= 2) return true
    }
  }
  return false
}

/**
 * Check if player has won "Full Blockchain" - All 50 numbers marked correctly
 * BLOCKING RULE: If 10+ answers are incorrect, Full Blockchain is impossible
 */
export const checkFullBlockchain = (correctNumbers, incorrectNumbers = new Set()) => {
  // Check if too many incorrect answers (10+ wrong = impossible)
  if (incorrectNumbers.size >= 10) {
    return false // Blocked
  }
  
  return correctNumbers.size >= 50
}

/**
 * Check all winning conditions and return which ones are newly achieved
 * @param {Set} correctNumbers - Set of correctly answered numbers
 * @param {Object} previousWins - Object tracking which conditions were already won
 * @param {Set} incorrectNumbers - Set of incorrectly answered numbers (for blocking logic)
 * @returns {Object} - Object with newly achieved wins
 */
export const checkAllWinningConditions = (correctNumbers, previousWins = {}, incorrectNumbers = new Set()) => {
  const newWins = {}
  
  // Check Early Adopter (with blocking logic)
  if (!previousWins.earlyAdopter && checkEarlyAdopter(correctNumbers, incorrectNumbers)) {
    newWins.earlyAdopter = true
  }
  
  // Check Gas Saver (with blocking logic)
  if (!previousWins.gasSaver && checkGasSaver(correctNumbers, incorrectNumbers)) {
    newWins.gasSaver = true
  }
  
  // Check Corner Nodes (with blocking logic)
  if (!previousWins.cornerNodes && checkCornerNodes(correctNumbers, incorrectNumbers)) {
    newWins.cornerNodes = true
  }
  
  // Check Miner of the Day
  if (!previousWins.minerOfDay && checkMinerOfTheDay(correctNumbers)) {
    newWins.minerOfDay = true
  }
  
  // Check Full Blockchain (with blocking logic)
  if (!previousWins.fullBlockchain && checkFullBlockchain(correctNumbers, incorrectNumbers)) {
    newWins.fullBlockchain = true
  }
  
  return newWins
}

/**
 * Check which winning conditions are permanently blocked
 * @param {Set} incorrectNumbers - Set of incorrectly answered numbers
 * @returns {Object} - Object indicating which conditions are blocked
 */
export const getBlockedConditions = (incorrectNumbers = new Set()) => {
  const blocked = {}
  
  // Early Adopter blocked if any of questions 1-5 answered incorrectly
  const firstFiveQuestions = [1, 2, 3, 4, 5]
  const hasIncorrectInFirstFive = firstFiveQuestions.some(num => incorrectNumbers.has(num))
  
  if (hasIncorrectInFirstFive) {
    blocked.earlyAdopter = {
      blocked: true,
      reason: "Failed question 1-5. Cannot achieve Early Adopter."
    }
  }
  
  // Gas Saver blocked if 4+ numbers in first row (1-10) are incorrect
  const firstRowNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const incorrectInFirstRow = firstRowNumbers.filter(num => incorrectNumbers.has(num))
  
  if (incorrectInFirstRow.length >= 4) {
    blocked.gasSaver = {
      blocked: true,
      reason: `Failed ${incorrectInFirstRow.length}/10 first row questions. Cannot achieve Gas Saver.`
    }
  }
  
  // Corner Nodes blocked if any corner is answered incorrectly
  const corners = [1, 10, 41, 50]
  const incorrectCorners = corners.filter(num => incorrectNumbers.has(num))
  
  if (incorrectCorners.length >= 1) {
    blocked.cornerNodes = {
      blocked: true,
      reason: `Failed corner question(s). Cannot achieve Corner Nodes.`
    }
  }
  
  // Full Blockchain blocked if 10+ answers are wrong
  if (incorrectNumbers.size >= 10) {
    blocked.fullBlockchain = {
      blocked: true,
      reason: `Too many incorrect answers (${incorrectNumbers.size}/50). Cannot achieve Full Blockchain.`
    }
  }
  
  return blocked
}

/**
 * Get winning condition descriptions
 */
export const getWinConditionInfo = () => {
  return {
    earlyAdopter: {
      name: "Early Adopter",
      description: "First 5 numbers marked correctly",
      icon: "⚡",
      priority: 1
    },
    gasSaver: {
      name: "Gas Saver", 
      description: "First row complete (1-10)",
      icon: "⛽",
      priority: 2
    },
    cornerNodes: {
      name: "Corner Nodes",
      description: "All 4 corners marked (1, 10, 41, 50)",
      icon: "📐",
      priority: 3
    },
    minerOfDay: {
      name: "Miner of the Day",
      description: "Any 2 complete rows",
      icon: "⛏️",
      priority: 4
    },
    fullBlockchain: {
      name: "Full Blockchain",
      description: "All 50 numbers marked correctly",
      icon: "🏆",
      priority: 5
    }
  }
}

/**
 * Get progress towards each winning condition
 * @param {Set} correctNumbers - Set of correctly answered numbers
 * @returns {Object} - Progress information for each condition
 */
export const getWinProgress = (correctNumbers) => {
  const progress = {}
  
  // Early Adopter progress
  progress.earlyAdopter = {
    current: correctNumbers.size,
    target: 5,
    percentage: Math.min((correctNumbers.size / 5) * 100, 100)
  }
  
  // Gas Saver progress
  const firstRowNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const firstRowComplete = firstRowNumbers.filter(num => correctNumbers.has(num)).length
  progress.gasSaver = {
    current: firstRowComplete,
    target: 10,
    percentage: (firstRowComplete / 10) * 100
  }
  
  // Corner Nodes progress
  const corners = [1, 10, 41, 50]
  const cornersComplete = corners.filter(num => correctNumbers.has(num)).length
  progress.cornerNodes = {
    current: cornersComplete,
    target: 4,
    percentage: (cornersComplete / 4) * 100
  }
  
  // Miner of the Day progress
  const rows = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    [31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
    [41, 42, 43, 44, 45, 46, 47, 48, 49, 50]
  ]
  
  let completedRows = 0
  for (const row of rows) {
    if (row.every(num => correctNumbers.has(num))) {
      completedRows++
    }
  }
  progress.minerOfDay = {
    current: completedRows,
    target: 2,
    percentage: Math.min((completedRows / 2) * 100, 100)
  }
  
  // Full Blockchain progress
  progress.fullBlockchain = {
    current: correctNumbers.size,
    target: 50,
    percentage: (correctNumbers.size / 50) * 100
  }
  
  return progress
}