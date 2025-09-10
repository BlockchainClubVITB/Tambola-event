# 🎲 Interactive Blockchain Tambola

A modern, educational twist on the classic Tambola (Housie/Bingo) game that teaches blockchain concepts while providing an engaging multiplayer gaming experience. The application is split into two separate apps: a comprehensive **Host Dashboard** for game management and a simplified **Player Interface** for joining and playing games.

![Blockchain Tambola](https://img.shields.io/badge/Game-Blockchain%20Tambola-blue)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.3.6-blue)
![Vite](https://img.shields.io/badge/Vite-5.0.0-purple)
![Architecture](https://img.shields.io/badge/Architecture-Microapps-green)

## 🌟 Features

### 🎯 Educational Gaming
- **Blockchain Learning**: Every number requires answering blockchain-related questions
- **Progressive Difficulty**: Questions range from basic to advanced concepts
- **Real-time Learning**: Instant feedback and explanations

### 🎮 Interactive Gameplay
- **Multiplayer Support**: Up to 50 players in real-time
- **Multiple Win Conditions**: First Line, Full House, Early 5, Four Corners
- **Live Leaderboards**: Real-time scoring and rankings with Appwrite backend
- **Auto Number Calling**: Numbers called with integrated question system
- **Persistent Game State**: All game data stored and synchronized via Appwrite

### 🔄 Real-time Features
- **Live Synchronization**: Host and player apps sync in real-time
- **Automatic Scoring**: +10 for correct answers, stored in database
- **Round Management**: 5s ready, 30s answer, 5s score update timing
- **Player Registration**: Full player data with registration numbers and emails
- **Number Locking**: Previously selected numbers prevented via database

### 🎨 Modern UI/UX
- **Beautiful Design**: Gradient backgrounds and smooth animations
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Dark Theme**: Easy on the eyes for extended gaming
- **Accessibility**: Keyboard navigation and screen reader support

### 🏆 Host Features
- **Game Management**: Start, pause, reset games with Appwrite backend
- **Player Monitoring**: Real-time player statistics and registration data
- **Winner Verification**: Manual verification system
- **Export Results**: Download game results and statistics

### ⚡ Backend Integration
- **Appwrite Database**: Scalable, real-time backend for all game data
- **Persistent Storage**: Games, players, rounds, and answers stored securely
- **Real-time Updates**: Live leaderboards and game state synchronization
- **Data Validation**: Proper data schemas and validation rules

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Appwrite account (for backend integration)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/BlockchainClubVITB/Tambola-event.git
cd Tambola-event
```

2. **Set up Appwrite Backend**
   
   Follow the detailed setup guide in [APPWRITE_SETUP.md](./APPWRITE_SETUP.md) to:
   - Create an Appwrite project
   - Set up database collections
   - Configure environment variables

3. **Choose your application and install dependencies**

#### For Hosts (Game Management)
```bash
cd host
npm install
cp .env.example .env
# Edit .env with your Appwrite configuration
npm run dev
```
Navigate to `http://localhost:5173` for the host dashboard

#### For Players (Join & Play)
```bash
cd players
npm install
cp .env.example .env
# Edit .env with your Appwrite configuration (same as host)
npm run dev
```
Navigate to `http://localhost:5174` for the player interface

### 🔥 Running Both Applications
To run both applications simultaneously:

```bash
# Terminal 1 - Host App
cd host && npm run dev

# Terminal 2 - Player App  
cd players && npm run dev
```

## 🎯 How to Play

### For Hosts (Game Management)
1. **Start Host App**: Run the host application (`cd host && npm run dev`)
2. **Create Game**: Use the host dashboard to create a new game
3. **Share Game ID**: Share the game ID with players
4. **Manage Game**: Control number calling, monitor players, and verify wins
5. **Track Progress**: Use real-time leaderboards and statistics

### For Players (Join & Play)
1. **Start Player App**: Run the player application (`cd players && npm run dev`)
2. **Learn the Game**: Check out the comprehensive instructions page
3. **Join Game**: Enter the Game ID provided by the host
4. **Play & Learn**: Mark numbers on your ticket and answer blockchain questions
5. **Claim Wins**: Complete winning patterns and claim your prizes!

### 🎮 Game Flow
1. **Host** creates a game and shares the Game ID
2. **Players** join using the Game ID in the player app
3. **Host** starts the game and begins calling numbers
4. **Players** mark called numbers on their interactive tickets
5. **Winners** claim prizes when completing winning patterns
6. **Host** verifies wins and manages the game progression

## 🏗️ Project Architecture

This project is structured as **two separate applications** to provide specialized experiences:

### 📊 Host Application (`/host`)
**Complete game management dashboard for hosts**
- Full Tambola board with number calling controls
- Real-time player monitoring and leaderboards
- Winner verification system
- Game statistics and export functionality
- Advanced host controls and settings

### 🎮 Player Application (`/players`)
**Simplified interface for players (join & play only)**
- Easy game joining with Game ID
- Comprehensive game instructions
- Interactive Tambola ticket
- Real-time number marking
- Winning pattern tracking

```
📁 Project Structure
├── 📂 host/                    # Host Application
│   ├── 📂 src/
│   │   ├── 📂 components/
│   │   │   ├── HostBoard.jsx         # 90-number game board
│   │   │   ├── Leaderboard.jsx       # Player rankings
│   │   │   └── WinnerPanel.jsx       # Winner management
│   │   ├── 📂 pages/
│   │   │   └── HostDashboard.jsx     # Main host interface
│   │   └── 📂 utils/
│   │       ├── gameUtils.js          # Game logic
│   │       └── questions.js          # Question database
│   ├── package.json
│   └── vite.config.js
├── 📂 players/                 # Player Application
│   ├── 📂 src/
│   │   ├── 📂 components/
│   │   │   └── PlayerTicket.jsx      # Interactive ticket
│   │   ├── 📂 pages/
│   │   │   ├── PlayerJoin.jsx        # Game joining
│   │   │   ├── GameInstructions.jsx  # How to play
│   │   │   └── PlayerGame.jsx        # Game interface
│   │   └── 📂 utils/
│   ├── package.json
│   └── vite.config.js
└── README.md                   # This file
```

## 🎓 Game Rules

### Win Conditions
- **Early 5**: First to mark any 5 numbers
- **Four Corners**: Mark all corner numbers on your ticket
- **First Line**: Complete the top row
- **Second Line**: Complete the middle row  
- **Third Line**: Complete the bottom row
- **Full House**: Mark all numbers on your ticket

### Scoring System
- **Correct Answer**: +10 points
- **Quick Answer**: +5 bonus points
- **Wrong Answer**: -5 points
- **Time Bonus**: Based on response time

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_SOCKET_URL=ws://localhost:5000
VITE_API_URL=http://localhost:5000/api
```

### Game Settings
Modify settings in `src/utils/gameConfig.js`:

```javascript
export const gameConfig = {
  maxPlayers: 50,
  numberCallInterval: 40000, // 40 seconds
  questionTimeLimit: 15000,  // 15 seconds
  autoStart: false
}
```

## 🧪 Available Scripts

### Host Application
```bash
cd host
npm run dev          # Start host development server (localhost:5173)
npm run build        # Build host app for production
npm run preview      # Preview host production build
npm run lint         # Run ESLint for host app
```

### Player Application
```bash
cd players
npm run dev          # Start player development server (localhost:5174)
npm run build        # Build player app for production  
npm run preview      # Preview player production build
npm run lint         # Run ESLint for player app
```

### Development Workflow
```bash
# Start both applications
npm run dev:all      # (if package.json script added)

# Build both for production
npm run build:all    # (if package.json script added)
```

## 🎨 Customization

### Adding Questions
Add new questions to `host/src/utils/questions.js` or `players/src/utils/questions.js`:

```javascript
{
  id: 21,
  question: "Your blockchain question here?",
  options: ["Option A", "Option B", "Option C", "Option D"],
  correct: 0, // Index of correct answer
  difficulty: "basic", // basic, intermediate, advanced
  category: "your-category"
}
```

### Styling
Each application has its own styling configuration:
- **Host App**: Modify `host/tailwind.config.js` and `host/src/index.css`
- **Player App**: Modify `players/tailwind.config.js` and `players/src/index.css`
- Both apps share similar design tokens for consistency

### Configuration
Each app has its own environment configuration:
- **Host**: `host/.env` for host-specific settings
- **Players**: `players/.env` for player-specific settings

## 🔮 Roadmap

### Phase 1 - Microapp Architecture ✅
- [x] Separate host and player applications
- [x] Host: Complete game management dashboard
- [x] Player: Simplified join and play interface
- [x] Responsive UI for both applications
- [x] Independent build and deployment

### Phase 2 - Enhanced Features 🚧
- [ ] Real-time synchronization between apps
- [ ] WebSocket integration for live updates
- [ ] Push notifications for players
- [ ] Advanced analytics for hosts

### Phase 3 - Real-time Features 🔄
- [ ] Live multiplayer sync across applications
- [ ] Real-time leaderboards
- [ ] Voice announcements
- [ ] Video calling integration

### Phase 4 - Advanced Features 📋
- [ ] Tournament mode with multiple games
- [ ] Achievement system and badges  
- [ ] NFT prizes integration
- [ ] Advanced host controls and settings

### Phase 5 - Production & Scale �
- [ ] Performance optimization for both apps
- [ ] Security hardening
- [ ] Analytics and monitoring integration  
- [ ] CI/CD deployment automation
- [ ] Load balancing and scaling

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- **Documentation**: Check the [Wiki](https://github.com/BlockchainClubVITB/Tambola-event/wiki)
- **Issues**: Report bugs on [GitHub Issues](https://github.com/BlockchainClubVITB/Tambola-event/issues)
- **Discussions**: Join [GitHub Discussions](https://github.com/BlockchainClubVITB/Tambola-event/discussions)

## 👥 Team

Built with ❤️ by [BlockchainClubVITB](https://github.com/BlockchainClubVITB)

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/BlockchainClubVITB/Tambola-event)
![GitHub forks](https://img.shields.io/github/forks/BlockchainClubVITB/Tambola-event)
![GitHub issues](https://img.shields.io/github/issues/BlockchainClubVITB/Tambola-event)
![GitHub license](https://img.shields.io/github/license/BlockchainClubVITB/Tambola-event)

---

**Ready to learn blockchain while having fun? Let's play! 🎲✨**