import type { Session } from '../../domain/session'
import type { CheckIn } from '../../domain/checkIn'
import { useT } from '../../i18n/I18nContext'
import { SessionRow } from './SessionRow'
import { CheckInRow } from './CheckInRow'
import styles from './daily.module.css'

interface DailyTimelineProps {
  sessions: Session[]
  checkIns?: CheckIn[]
  now: number
}

type Entry =
  | { kind: 'session'; startedAt: number; session: Session }
  | { kind: 'checkIn'; startedAt: number; checkIn: CheckIn }

/** One day, in order: sessions (standard + drift) interleaved with check-ins (spec §15). */
export function DailyTimeline({ sessions, checkIns = [], now }: DailyTimelineProps) {
  const { t } = useT()

  const entries: Entry[] = [
    ...sessions.map(
      (session): Entry => ({ kind: 'session', startedAt: session.startedAt, session }),
    ),
    ...checkIns.map(
      (checkIn): Entry => ({ kind: 'checkIn', startedAt: checkIn.startedAt, checkIn }),
    ),
  ].sort((a, b) => a.startedAt - b.startedAt)

  if (entries.length === 0) {
    return <p className={styles.empty}>{t('daily.empty')}</p>
  }

  return (
    <ul className={styles.timeline}>
      {entries.map((entry) =>
        entry.kind === 'session' ? (
          <SessionRow key={entry.session.id} session={entry.session} now={now} />
        ) : (
          <CheckInRow key={entry.checkIn.id} checkIn={entry.checkIn} now={now} />
        ),
      )}
    </ul>
  )
}
