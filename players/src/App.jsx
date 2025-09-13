import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import PlayerJoin from './pages/PlayerJoin'
import GameInstructions from './pages/GameInstructions'
import PlayerGame from './pages/PlayerGame'
import './App.css'

function App() {
  const [gameId, setGameId] = useState(null)
  const [playerName, setPlayerName] = useState('')
  const [isJoined, setIsJoined] = useState(false)

  return (
    <Router>
      <div className="App min-h-screen">
        <Routes>
          <Route 
            path="/" 
            element={
              <PlayerJoin 
                onJoin={(id, name) => {
                  setGameId(id)
                  setPlayerName(name)
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
                isJoined={isJoined}
              />
            } 
          />
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#374151',
              color: '#fff',
              border: '1px solid #4B5563',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App
