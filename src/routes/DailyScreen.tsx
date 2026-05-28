import { useNavigate, useParams } from 'react-router-dom'
import { useDailySessions } from '../hooks/useDailySessions'
import { useNow } from '../hooks/useNow'
import { addDays, toDayKey } from '../domain/time'
import { DailyTimeline } from '../components/daily/DailyTimeline'
import { DailyTotals } from '../components/daily/DailyTotals'
import styles from '../components/daily/daily.module.css'

function formatDayLabel(dayKey: string): string {
  const [year, month, day] = dayKey.split('-').map(Number)
  return `${year}年${month}月${day}日`
}

export function DailyScreen() {
  const { date } = useParams()
  const navigate = useNavigate()
  const now = useNow()
  const today = toDayKey(now)
  const dayKey = date ?? today
  const isToday = dayKey === today
  const sessions = useDailySessions(dayKey)

  return (
    <main className="app-shell">
      <header className={styles.header}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => navigate(`/day/${addDays(dayKey, -1)}`)}
          aria-label="前一天"
        >
          ‹
        </button>
        <div className={styles.headerCenter}>
          <h1 className={styles.date}>{formatDayLabel(dayKey)}</h1>
          {!isToday && (
            <button type="button" className={styles.todayBtn} onClick={() => navigate('/day')}>
              回到今天
            </button>
          )}
        </div>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => navigate(`/day/${addDays(dayKey, 1)}`)}
          aria-label="后一天"
          disabled={isToday}
        >
          ›
        </button>
      </header>

      {sessions === undefined ? (
        <p className={styles.empty} aria-busy="true">
          加载中…
        </p>
      ) : (
        <>
          <DailyTimeline sessions={sessions} now={now} />
          <DailyTotals sessions={sessions} now={now} />
        </>
      )}

      <footer className={styles.footer}>
        <button type="button" className={styles.startBtn} onClick={() => navigate('/')}>
          ＋ 开始新的记录
        </button>
      </footer>
    </main>
  )
}
