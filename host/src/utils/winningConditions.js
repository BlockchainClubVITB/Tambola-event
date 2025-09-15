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
 */
export const checkEarlyAdopter = (correctNumbers) => {
  return correctNumbers.size >= 5
}

/**
 * Check if player has won "Gas Saver" - First row complete (numbers 1-10)
 */
export const checkGasSaver = (correctNumbers) => {
  const firstRowNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  return firstRowNumbers.every(num => correctNumbers.has(num))
}

/**
 * Check if player has won "Corner Nodes" - All 4 corners marked correctly
 * Corners: 1 (top-left), 10 (top-right), 41 (bottom-left), 50 (bottom-right)
 */
export const checkCornerNodes = (correctNumbers) => {
  const corners = [1, 10, 41, 50]
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
 */
export const checkFullBlockchain = (correctNumbers) => {
  return correctNumbers.size >= 50
}

/**
 * Check all winning conditions and return which ones are newly achieved
 * @param {Set} correctNumbers - Set of correctly answered numbers
 * @param {Object} previousWins - Object tracking which conditions were already won
 * @returns {Object} - Object with newly achieved wins
 */
export const checkAllWinningConditions = (correctNumbers, previousWins = {}) => {
  const newWins = {}
  
  // Check Early Adopter
  if (!previousWins.earlyAdopter && checkEarlyAdopter(correctNumbers)) {
    newWins.earlyAdopter = true
  }
  
  // Check Gas Saver
  if (!previousWins.gasSaver && checkGasSaver(correctNumbers)) {
    newWins.gasSaver = true
  }
  
  // Check Corner Nodes
  if (!previousWins.cornerNodes && checkCornerNodes(correctNumbers)) {
    newWins.cornerNodes = true
  }
  
  // Check Miner of the Day
  if (!previousWins.minerOfDay && checkMinerOfTheDay(correctNumbers)) {
    newWins.minerOfDay = true
  }
  
  // Check Full Blockchain
  if (!previousWins.fullBlockchain && checkFullBlockchain(correctNumbers)) {
    newWins.fullBlockchain = true
  }
  
  return newWins
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