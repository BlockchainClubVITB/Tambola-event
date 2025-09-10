# Appwrite Setup Guide for Tambola Game

This guide will help you set up Appwrite as the backend for your Tambola game.

## Prerequisites

1. An Appwrite account (create one at https://cloud.appwrite.io)
2. Node.js 16+ installed
3. Both host and player applications installed

## Step 1: Create Appwrite Project

1. Go to https://cloud.appwrite.io and sign in
2. Click "Create Project"
3. Give your project a name (e.g., "Tambola Game")
4. Note down your Project ID from the project settings

## Step 2: Create Database

1. In your Appwrite project, go to "Databases"
2. Click "Create Database"
3. Name it "tambola-db"
4. Note down the Database ID

## Step 3: Create Collections

Create the following collections with their attributes:

### Games Collection
```
Collection ID: games
Attributes:
- gameCode (String, Required, Size: 6)
- status (String, Required, Default: "waiting")
- selectedNumbers (Array of Integers)
- currentNumber (Integer)
- totalRounds (Integer, Default: 0)
- maxPlayers (Integer, Default: 50)
- gameTime (Integer, Default: 0)
- createdAt (DateTime, Required)
- updatedAt (DateTime)
```

### Players Collection
```
Collection ID: players
Attributes:
- gameId (String, Required) - Relationship to games collection
- gameCode (String, Required, Size: 6)
- name (String, Required, Size: 100)
- registrationNumber (String, Required, Size: 50)
- email (String, Required, Email format)
- score (Integer, Default: 0)
- correctAnswers (Integer, Default: 0)
- totalAnswers (Integer, Default: 0)
- isOnline (Boolean, Default: true)
- hasWon (Boolean, Default: false)
- winType (String)
- verified (Boolean, Default: false)
- joinedAt (DateTime, Required)
- lastSeenAt (DateTime)
- lastAnswerTime (DateTime)
```

### Rounds Collection
```
Collection ID: rounds
Attributes:
- gameId (String, Required) - Relationship to games collection
- roundNumber (Integer, Required)
- selectedNumber (Integer, Required)
- question (Object) - Contains question data
- startTime (DateTime, Required)
- readyTime (Integer, Default: 5)
- answerTime (Integer, Default: 30)
- scoreTime (Integer, Default: 5)
- status (String, Default: "ready")
- updatedAt (DateTime)
```

### Answers Collection
```
Collection ID: answers
Attributes:
- roundId (String, Required) - Relationship to rounds collection
- playerId (String, Required) - Relationship to players collection
- playerName (String, Required)
- selectedOption (Integer, Required)
- submittedAt (DateTime, Required)
- isCorrect (Boolean)
- scoreAwarded (Integer, Default: 0)
- processedAt (DateTime)
```

## Step 4: Configure Permissions

For each collection, set the following permissions:

### Read Permissions
- Any (for real-time updates)

### Write Permissions
- Any (for game creation and player registration)

**Note**: In production, you should implement proper authentication and role-based permissions.

## Step 5: Update Environment Variables

### For Host Application
1. Copy `host/.env.example` to `host/.env`
2. Update the values with your Appwrite details:

```env
VITE_APPWRITE_URL=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-actual-project-id
VITE_APPWRITE_DATABASE_ID=tambola-db
VITE_APPWRITE_GAMES_COLLECTION_ID=games
VITE_APPWRITE_PLAYERS_COLLECTION_ID=players
VITE_APPWRITE_ROUNDS_COLLECTION_ID=rounds
VITE_APPWRITE_ANSWERS_COLLECTION_ID=answers
```

### For Player Application
1. Copy `players/.env.example` to `players/.env`
2. Use the same values as the host application

## Step 6: Test the Setup

1. Start the host application:
   ```bash
   cd host
   npm run dev
   ```

2. Start the player application:
   ```bash
   cd players
   npm run dev
   ```

3. The host should automatically create a game in Appwrite
4. Players can join using the game code displayed on the host dashboard

## Game Workflow

1. **Host starts game**: Creates a new game in Appwrite with a unique game code
2. **Players join**: Register with game code, name, registration number, and email
3. **Host calls number**: Creates a round with question, triggers 5s ready + 30s answer + 5s score sequence
4. **Players answer**: Submit answers during the 30-second window
5. **Auto-scoring**: +10 points for correct answers, -5 for wrong answers
6. **Real-time updates**: Leaderboard updates automatically via polling
7. **Number locking**: Previously called numbers are stored and locked

## Troubleshooting

### Common Issues

1. **Build Errors**: Make sure all environment variables are set correctly
2. **Connection Issues**: Check your Appwrite URL and Project ID
3. **Permission Errors**: Ensure collections have proper read/write permissions
4. **Data Not Updating**: Verify collection IDs match in both applications

### Debug Mode

To see detailed API calls and responses, open browser developer tools and check the console logs.

## Production Deployment

For production deployment:

1. Set up proper authentication
2. Implement role-based permissions
3. Use environment-specific Appwrite projects
4. Set up monitoring and logging
5. Configure rate limiting

## Support

If you encounter issues:
1. Check the Appwrite documentation: https://appwrite.io/docs
2. Verify your collection schemas match the specifications above
3. Ensure both applications use identical environment configurations