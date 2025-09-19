import { Client, Databases, Account, ID, Query } from 'appwrite'

// Appwrite configuration
export const APPWRITE_CONFIG = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
  collections: {
    games: import.meta.env.VITE_APPWRITE_GAMES_COLLECTION_ID,
    players: import.meta.env.VITE_APPWRITE_PLAYERS_COLLECTION_ID,
    rounds: import.meta.env.VITE_APPWRITE_ROUNDS_COLLECTION_ID,
    answers: import.meta.env.VITE_APPWRITE_ANSWERS_COLLECTION_ID,
    verificationRequests: import.meta.env.VITE_APPWRITE_VERIFICATION_REQUESTS_COLLECTION_ID || 'verification_requests'
  }
}

// Initialize Appwrite client
const client = new Client()
client
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId)

// Initialize services
export const databases = new Databases(client)
export const account = new Account(client)

// Helper function to generate unique IDs
export const generateId = () => ID.unique()

export default client
