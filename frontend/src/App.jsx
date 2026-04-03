import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Detect from './pages/Detect'
import LiveCam from './pages/LiveCam'
import History from './pages/History'
import Reports from './pages/Reports'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      {/* Public routes — no Navbar */}
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected routes — with Navbar */}
      <Route path="/*" element={
        <ProtectedRoute>
          <div className="min-h-screen">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 pb-20">
              <Routes>
                <Route path="/"        element={<Detect />} />
                <Route path="/live"    element={<LiveCam />} />
                <Route path="/history" element={<History />} />
                <Route path="/reports" element={<Reports />} />
              </Routes>
            </main>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  )
}