import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useActiveSession } from './hooks/useActiveSession'
import { AppShell } from './components/shell/AppShell'
import { HomeScreen } from './routes/HomeScreen'
import { ActiveSessionScreen } from './routes/ActiveSessionScreen'
import { SummaryScreen } from './routes/SummaryScreen'
import { DailyScreen } from './routes/DailyScreen'

export default function App() {
  const session = useActiveSession()
  const location = useLocation()
  const navigate = useNavigate()

  // Resume on reopen: if a session is in progress and we land on Home, jump to the live timer.
  useEffect(() => {
    if (session && location.pathname === '/') {
      navigate('/active', { replace: true })
    }
  }, [session, location.pathname, navigate])

  return (
    <Routes>
      {/* Home & Daily live inside the Cal-style nav shell */}
      <Route element={<AppShell />}>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/day" element={<DailyScreen />} />
        <Route path="/day/:date" element={<DailyScreen />} />
      </Route>
      {/* Focus flows render full-screen, without nav chrome */}
      <Route path="/active" element={<ActiveSessionScreen />} />
      <Route path="/summary/:id" element={<SummaryScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
