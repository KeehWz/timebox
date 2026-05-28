import type { Session } from '../../domain/session'
import { SessionRow } from './SessionRow'
import styles from './daily.module.css'

interface DailyTimelineProps {
  sessions: Session[]
  now: number
}

export function DailyTimeline({ sessions, now }: DailyTimelineProps) {
  if (sessions.length === 0) {
    return <p className={styles.empty}>今天还没有记录</p>
  }
  return (
    <ul className={styles.timeline}>
      {sessions.map((session) => (
        <SessionRow key={session.id} session={session} now={now} />
      ))}
    </ul>
  )
}
