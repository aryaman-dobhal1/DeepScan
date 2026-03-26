import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Detect from './pages/Detect'
import LiveCam from './pages/LiveCam'
import History from './pages/History'
import Reports from './pages/Reports'

export default function App() {
  return (
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
  )
}
