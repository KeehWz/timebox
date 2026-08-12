import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { rewardService } from '../data/rewardService'
import { sessionRepository } from '../data/sessionRepository'
import { ActiveSessionExistsError } from '../lib/errors'
import { useDailySessions } from '../hooks/useDailySessions'
import { useDailyCheckIns } from '../hooks/useDailyCheckIns'
import { useDailyDirections } from '../hooks/useDailyDirections'
import { useTasks } from '../hooks/useTasks'
import { useNow } from '../hooks/useNow'
import { scheduledTasks, type Task } from '../domain/task'
import { addDays, dayKeyLabel, toDayKey } from '../domain/time'
import { useT } from '../i18n/I18nContext'
import { DayGrid } from '../components/daily/DayGrid'
import { DayNarrative } from '../components/daily/DayNarrative'
import { DailyTotals } from '../components/daily/DailyTotals'
import styles from '../components/daily/daily.module.css'

/** Router-state deep link from the Inbox schedule action. */
interface DayDeepLink {
  armTaskId?: string
}

export function DailyScreen() {
  const { date } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const now = useNow()
  const { t, locale } = useT()
  const today = toDayKey(now)
  const dayKey = date ?? today
  const isToday = dayKey === today
  const sessions = useDailySessions(dayKey)
  const checkIns = useDailyCheckIns(dayKey)
  const directions = useDailyDirections(dayKey)
  const tasks = useTasks()
  // Armed tap-to-place task id (design's Inbox → Today scheduling flow).
  const [armedId, setArmedId] = useState<string | null>(
    () => (location.state as DayDeepLink | null)?.armTaskId ?? null,
  )

  // Clear the router state so refresh / back-navigation doesn't re-arm.
  useEffect(() => {
    if ((location.state as DayDeepLink | null)?.armTaskId) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location, navigate])

  // Challenge day 3: reviewing today's dashboard completes the last step (spec §17).
  useEffect(() => {
    if (isToday) void rewardService.recordDashboardVisit(dayKey)
  }, [isToday, dayKey])

  const dayTasks = scheduledTasks(tasks ?? [], dayKey)
  const armedTask = (tasks ?? []).find((task) => task.id === armedId) ?? null

  /** Start focus for a scheduled task block (note = title, linked via taskId). */
  async function startFocus(task: Task) {
    try {
      await sessionRepository.start('other', task.title, 'standard', task.id)
    } catch (error) {
      if (!(error instanceof ActiveSessionExistsError)) throw error
    }
    navigate('/active')
  }

  return (
    <main className="app-shell">
      <header className={styles.header}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => navigate(`/day/${addDays(dayKey, -1)}`)}
          aria-label={t('daily.prevDayAria')}
        >
          ‹
        </button>
        <div className={styles.headerCenter}>
          <h1 className={styles.date}>{dayKeyLabel(dayKey, locale)}</h1>
          {!isToday && (
            <button type="button" className={styles.todayBtn} onClick={() => navigate('/day')}>
              {t('daily.backToToday')}
            </button>
          )}
        </div>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => navigate(`/day/${addDays(dayKey, 1)}`)}
          aria-label={t('daily.nextDayAria')}
          disabled={isToday}
        >
          ›
        </button>
      </header>

      {sessions === undefined ? (
        <p className={styles.empty} aria-busy="true">
          {t('daily.loading')}
        </p>
      ) : (
        <>
          <DayGrid
            sessions={sessions}
            checkIns={checkIns ?? []}
            tasks={dayTasks}
            dayKey={dayKey}
            isToday={isToday}
            now={now}
            armedTask={armedTask}
            onDisarm={() => setArmedId(null)}
            onStartFocus={(task) => void startFocus(task)}
          />
          <DayNarrative sessions={sessions} checkIns={checkIns ?? []} now={now} />
          <DailyTotals
            sessions={sessions}
            checkIns={checkIns ?? []}
            directions={directions ?? []}
            now={now}
          />
        </>
      )}

      <footer className={styles.footer}>
        <button type="button" className={styles.startBtn} onClick={() => navigate('/')}>
          ＋ {t('daily.startNew')}
        </button>
      </footer>
    </main>
  )
}
