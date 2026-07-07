import type { CSSProperties } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useActiveSession } from '../hooks/useActiveSession'
import { useNow } from '../hooks/useNow'
import { sessionRepository } from '../data/sessionRepository'
import { getCategory } from '../domain/categories'
import { activeMs, totalPausedMs } from '../domain/metrics'
import { formatDuration } from '../domain/time'
import { useT } from '../i18n/I18nContext'
import { CategoryBadge } from '../components/ui/CategoryBadge'
import { TimerDisplay } from '../components/timer/TimerDisplay'
import { PauseButton } from '../components/timer/PauseButton'
import { LongPressEndButton } from '../components/timer/LongPressEndButton'
import styles from '../components/timer/timer.module.css'

export function ActiveSessionScreen() {
  const session = useActiveSession()
  const navigate = useNavigate()
  const now = useNow()
  const { t, locale } = useT()

  if (session === undefined) {
    return <main className="app-shell" aria-busy="true" />
  }
  if (session === null) {
    return <Navigate to="/" replace />
  }

  // Bind the (now non-null) session to a local const so it stays narrowed inside the
  // async handleEnd closure (TS doesn't preserve outer narrowing across closures).
  const current = session
  const category = getCategory(current.categoryId)
  const paused = current.status === 'paused'

  async function handleEnd() {
    const ended = await sessionRepository.end(current.id)
    navigate(`/summary/${ended.id}`)
  }

  return (
    <main
      className="app-shell"
      style={{ '--accent': `var(${category.colorVar})` } as CSSProperties}
    >
      <div className={styles.activeWash} aria-hidden="true" />
      <section className={styles.active}>
        <header className={styles.activeHead}>
          {current.type === 'drift' ? (
            <span className={styles.driftBadge}>
              <span aria-hidden="true">🌫️</span> {t('drift.label')}
            </span>
          ) : (
            <CategoryBadge categoryId={current.categoryId} />
          )}
          {current.note && <p className={styles.note}>{current.note}</p>}
        </header>

        <div className={styles.timerBlock}>
          <div className={styles.breathRing} data-paused={paused || undefined}>
            <TimerDisplay session={current} now={now} />
          </div>
          {paused ? (
            <p className={styles.pausedNote}>
              {t('timer.pausedNote', { duration: formatDuration(totalPausedMs(current, now), locale) })}
            </p>
          ) : (
            <p className={styles.statusLine}>
              {t('timer.statusFocusing', {
                duration: formatDuration(activeMs(current, now), locale),
              })}
            </p>
          )}
        </div>

        <footer className={styles.controls}>
          <PauseButton session={current} />
          <LongPressEndButton onEnd={handleEnd} />
        </footer>
      </section>
    </main>
  )
}
