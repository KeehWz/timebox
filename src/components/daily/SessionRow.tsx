import type { Session } from '../../domain/session'
import { activeMs, totalPausedMs } from '../../domain/metrics'
import { formatHuman, formatTimeOfDay } from '../../domain/time'
import { CategoryBadge } from '../ui/CategoryBadge'
import styles from './daily.module.css'

interface SessionRowProps {
  session: Session
  now: number
}

export function SessionRow({ session, now }: SessionRowProps) {
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
        <span className={styles.time}>{ongoing ? '进行中' : formatTimeOfDay(end)}</span>
      </div>
      <div className={styles.rowMain}>
        <div className={styles.rowHead}>
          <CategoryBadge categoryId={session.categoryId} size="sm" />
          {session.note && <span className={styles.rowNote}>{session.note}</span>}
        </div>
        <div className={styles.rowStats}>
          <span className={styles.focus}>{formatHuman(focus)}</span>
          {paused > 0 && <span className={styles.paused}>⏸ {formatHuman(paused)}</span>}
        </div>
      </div>
    </li>
  )
}
