import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import PlayerJoin from './pages/PlayerJoin'
import GameInstructions from './pages/GameInstructions'
import PlayerGame from './pages/PlayerGame'
import './App.css'

function App() {
  const [gameId, setGameId] = useState(null)
  const [playerName, setPlayerName] = useState('')
  const [player, setPlayer] = useState(null)
  const [isJoined, setIsJoined] = useState(false)

  return (
    <Router>
      <div className="App min-h-screen">
        <Routes>
          <Route 
            path="/" 
            element={
              <PlayerJoin 
                onJoin={(id, name, playerData) => {
                  setGameId(id)
                  setPlayerName(name)
                  setPlayer(playerData)
                  setIsJoined(true)
                }}
              />
            } 
          />
          <Route path="/instructions" element={<GameInstructions />} />
          <Route 
            path="/game" 
            element={
              <PlayerGame 
                gameId={gameId} 
                playerName={playerName}
                player={player}
                isJoined={isJoined}
              />
            } 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
