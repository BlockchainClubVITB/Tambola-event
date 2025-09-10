import { Client, Databases, Account } from 'appwrite'

// Appwrite configuration
export const appwriteConfig = {
  url: import.meta.env.VITE_APPWRITE_URL || 'https://cloud.appwrite.io/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || 'tambola-project',
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'tambola-db',
  collections: {
    games: import.meta.env.VITE_APPWRITE_GAMES_COLLECTION_ID || 'games',
    players: import.meta.env.VITE_APPWRITE_PLAYERS_COLLECTION_ID || 'players',
    rounds: import.meta.env.VITE_APPWRITE_ROUNDS_COLLECTION_ID || 'rounds',
    answers: import.meta.env.VITE_APPWRITE_ANSWERS_COLLECTION_ID || 'answers'
  }
}

// Initialize Appwrite client
const client = new Client()
client
  .setEndpoint(appwriteConfig.url)
  .setProject(appwriteConfig.projectId)

// Initialize services
export const databases = new Databases(client)
export const account = new Account(client)

export { client }