import type { Session } from '../../domain/session'
import { activeMs } from '../../domain/metrics'
import { formatClock } from '../../domain/time'
import styles from './timer.module.css'

interface TimerDisplayProps {
  session: Session
  now: number
}

export function TimerDisplay({ session, now }: TimerDisplayProps) {
  const elapsed = activeMs(session, now)
  return (
    <time className={styles.clock} dateTime={`PT${Math.floor(elapsed / 1000)}S`}>
      {formatClock(elapsed)}
    </time>
  )
}
