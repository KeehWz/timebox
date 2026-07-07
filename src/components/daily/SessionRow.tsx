import type { Session } from '../../domain/session'
import { activeMs, totalPausedMs } from '../../domain/metrics'
import { formatDuration, formatTimeOfDay } from '../../domain/time'
import { useT } from '../../i18n/I18nContext'
import { CategoryBadge } from '../ui/CategoryBadge'
import styles from './daily.module.css'

interface SessionRowProps {
  session: Session
  now: number
}

export function SessionRow({ session, now }: SessionRowProps) {
  const { t, locale } = useT()
  const ongoing = session.status !== 'completed'
  const end = session.endedAt ?? now
  const focus = activeMs(session, now)
  const paused = totalPausedMs(session, now)

  return (
    <li className={styles.row}>
      <div className={styles.rowTime}>
        <span className={styles.time}>{formatTimeOfDay(session.startedAt)}</span>
        <span className={styles.timeSep} aria-hidden="true">
          –
        </span>
        <span className={styles.time}>{ongoing ? t('daily.ongoing') : formatTimeOfDay(end)}</span>
      </div>
      <div className={styles.rowMain}>
        <div className={styles.rowHead}>
          {session.type === 'drift' ? (
            <span className={styles.driftBadge}>
              <span aria-hidden="true">🌫️</span> {t('drift.label')}
            </span>
          ) : (
            <CategoryBadge categoryId={session.categoryId} size="sm" />
          )}
          {session.note && <span className={styles.rowNote}>{session.note}</span>}
        </div>
        <div className={styles.rowStats}>
          <span className={styles.focus}>{formatDuration(focus, locale)}</span>
          {paused > 0 && <span className={styles.paused}>⏸ {formatDuration(paused, locale)}</span>}
        </div>
      </div>
    </li>
  )
}
