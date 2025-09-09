// Generate game code
export const generateGameCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluding I, O, 0, 1 for clarity
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate Tambola board numbers (1-90)
export const generateTambolaBoard = () => {
  return Array.from({ length: 90 }, (_, i) => i + 1)
}

// Shuffle array
export const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Generate a random Tambola ticket for display purposes
export const generateTicket = () => {
  const ticket = Array(3).fill().map(() => Array(9).fill(null))
  
  // Define column ranges
  const columnRanges = [
    [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
    [50, 59], [60, 69], [70, 79], [80, 90]
  ]
  
  // For each row, select 5 random columns and fill with numbers
  for (let row = 0; row < 3; row++) {
    const selectedColumns = []
    while (selectedColumns.length < 5) {
      const col = Math.floor(Math.random() * 9)
      if (!selectedColumns.includes(col)) {
        selectedColumns.push(col)
      }
    }
    
    selectedColumns.forEach(col => {
      const [min, max] = columnRanges[col]
      let number
      do {
        number = Math.floor(Math.random() * (max - min + 1)) + min
      } while (isNumberInTicket(ticket, number))
      
      ticket[row][col] = number
    })
  }
  
  return ticket
}

// Check if a number already exists in the ticket
const isNumberInTicket = (ticket, number) => {
  return ticket.some(row => row.some(cell => cell === number))
}
