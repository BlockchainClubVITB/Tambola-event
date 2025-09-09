// Sample blockchain questions database for host preview
export const blockchainQuestions = [
  {
    id: 1,
    question: "What is a blockchain?",
    options: [
      "A distributed ledger technology",
      "A type of cryptocurrency",
      "A programming language",
      "A mining algorithm"
    ],
    correct: 0,
    difficulty: "basic",
    category: "fundamentals"
  },
  {
    id: 2,
    question: "What is a smart contract?",
    options: [
      "A legal document",
      "Self-executing code on blockchain",
      "A mining contract",
      "A trading agreement"
    ],
    correct: 1,
    difficulty: "basic",
    category: "smart-contracts"
  },
  {
    id: 3,
    question: "Which consensus mechanism does Bitcoin use?",
    options: [
      "Proof of Stake",
      "Proof of Authority",
      "Proof of Work",
      "Delegated Proof of Stake"
    ],
    correct: 2,
    difficulty: "intermediate",
    category: "consensus"
  },
  {
    id: 4,
    question: "What is the maximum supply of Bitcoin?",
    options: [
      "21 million",
      "100 million", 
      "1 billion",
      "Unlimited"
    ],
    correct: 0,
    difficulty: "basic",
    category: "bitcoin"
  },
  {
    id: 5,
    question: "What does DeFi stand for?",
    options: [
      "Digital Finance",
      "Decentralized Finance",
      "Distributed Finance",
      "Direct Finance"
    ],
    correct: 1,
    difficulty: "basic",
    category: "defi"
  }
]

// Get random question
export const getRandomQuestion = () => {
  const randomIndex = Math.floor(Math.random() * blockchainQuestions.length)
  return blockchainQuestions[randomIndex]
}
