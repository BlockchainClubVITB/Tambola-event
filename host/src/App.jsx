import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import GameSetup from './pages/GameSetup'
import HostDashboard from './pages/HostDashboard'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/setup" replace />} />
          <Route path="/setup" element={<GameSetup />} />
          <Route path="/dashboard" element={<HostDashboard />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
