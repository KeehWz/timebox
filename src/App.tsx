import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useActiveSession } from './hooks/useActiveSession'
import { useOnboardingGate } from './hooks/useOnboardingGate'
import { useFirstSessionReminder } from './hooks/useFirstSessionReminder'
import { AppShell } from './components/shell/AppShell'
import { HomeScreen } from './routes/HomeScreen'
import { InboxScreen } from './routes/InboxScreen'
import { StatsScreen } from './routes/StatsScreen'
import { ActiveSessionScreen } from './routes/ActiveSessionScreen'
import { SummaryScreen } from './routes/SummaryScreen'
import { DailyScreen } from './routes/DailyScreen'
import { StartDayScreen } from './routes/StartDayScreen'
import { OnboardingScreen } from './routes/OnboardingScreen'
import { SettingsScreen } from './routes/SettingsScreen'

export default function App() {
  const session = useActiveSession()
  const location = useLocation()
  const navigate = useNavigate()
  useOnboardingGate() // brand-new users → /welcome (spec §16)
  useFirstSessionReminder() // web-limited first-session nudge (spec §2)

  // Resume on reopen: if a session is in progress and we land on Home, jump to the live timer.
  useEffect(() => {
    if (session && location.pathname === '/') {
      navigate('/active', { replace: true })
    }
  }, [session, location.pathname, navigate])

  return (
    <Routes>
      {/* 4-tab shell (design: Today / Focus / Inbox / Stats); settings via the header gear */}
      <Route element={<AppShell />}>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/day" element={<DailyScreen />} />
        <Route path="/day/:date" element={<DailyScreen />} />
        <Route path="/inbox" element={<InboxScreen />} />
        <Route path="/stats" element={<StatsScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Route>
      {/* Focus / lifecycle flows render full-screen, without nav chrome */}
      <Route path="/active" element={<ActiveSessionScreen />} />
      <Route path="/summary/:id" element={<SummaryScreen />} />
      <Route path="/start-day" element={<StartDayScreen />} />
      <Route path="/welcome" element={<OnboardingScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
