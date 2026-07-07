import { useNavigate } from 'react-router-dom'
import { dayRepository } from '../data/dayRepository'
import { dailyDirectionRepository } from '../data/dailyDirectionRepository'
import type { DirectionEntry } from '../domain/dailyDirection'
import { toDayKey } from '../domain/time'
import { DirectionForm } from '../components/direction/DirectionForm'

/**
 * Start Day flow (spec §4): mark the day started, optionally set a daily direction,
 * then proceed straight into the first-session picker.
 */
export function StartDayScreen() {
  const navigate = useNavigate()

  async function proceed(entries: DirectionEntry[]) {
    const now = Date.now()
    const today = toDayKey(now)
    await dayRepository.ensureStarted(today, now)
    if (entries.length > 0) await dailyDirectionRepository.setForDate(today, entries)
    navigate('/', { state: { startNew: true } })
  }

  return (
    <main className="app-shell">
      <DirectionForm onConfirm={(entries) => void proceed(entries)} onSkip={() => void proceed([])} />
    </main>
  )
}
