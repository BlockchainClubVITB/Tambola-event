import { Client, Databases, Account, ID, Query } from 'appwrite'

// Appwrite configuration
export const APPWRITE_CONFIG = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '68c15a4f000e7ae4cf45',
  databaseId: '68c15b270004dfd69741',
  collections: {
    games: 'games',
    players: 'players', 
    rounds: 'rounds',
    answers: 'answers'
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
