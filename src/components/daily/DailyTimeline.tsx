import type { Session } from '../../domain/session'
import { useT } from '../../i18n/I18nContext'
import { SessionRow } from './SessionRow'
import styles from './daily.module.css'

interface DailyTimelineProps {
  sessions: Session[]
  now: number
}

export function DailyTimeline({ sessions, now }: DailyTimelineProps) {
  const { t } = useT()
  if (sessions.length === 0) {
    return <p className={styles.empty}>{t('daily.empty')}</p>
  }
  return (
    <ul className={styles.timeline}>
      {sessions.map((session) => (
        <SessionRow key={session.id} session={session} now={now} />
      ))}
    </ul>
  )
}
