import { useNavigate, useParams } from 'react-router-dom'
import { useDailySessions } from '../hooks/useDailySessions'
import { useNow } from '../hooks/useNow'
import { addDays, dayKeyLabel, toDayKey } from '../domain/time'
import { useT } from '../i18n/I18nContext'
import { DailyTimeline } from '../components/daily/DailyTimeline'
import { DailyTotals } from '../components/daily/DailyTotals'
import styles from '../components/daily/daily.module.css'

export function DailyScreen() {
  const { date } = useParams()
  const navigate = useNavigate()
  const now = useNow()
  const { t, locale } = useT()
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
          <DailyTimeline sessions={sessions} now={now} />
          <DailyTotals sessions={sessions} now={now} />
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
