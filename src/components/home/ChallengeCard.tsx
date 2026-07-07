import type { ChallengeProgress } from '../../domain/challenge'
import { challengeDayIndex, isChallengeVisible } from '../../domain/challenge'
import { useT } from '../../i18n/I18nContext'
import styles from './home.module.css'

interface ChallengeCardProps {
  challenge: ChallengeProgress
  todayKey: string
}

const DAY_KEYS = ['challenge.day1', 'challenge.day2', 'challenge.day3'] as const

/** Three-day starter challenge progress (spec §17). Hidden outside the 3-day window. */
export function ChallengeCard({ challenge, todayKey }: ChallengeCardProps) {
  const { t } = useT()
  if (!isChallengeVisible(challenge, todayKey)) return null
  const todayIndex = challengeDayIndex(challenge.startDate, todayKey)

  return (
    <section className={styles.challengeCard} aria-labelledby="challenge-heading">
      <h2 id="challenge-heading" className={styles.challengeTitle}>
        {t('challenge.title')}
      </h2>
      <ol className={styles.challengeList}>
        {DAY_KEYS.map((key, index) => {
          const done = challenge.completed[index]
          const current = index === todayIndex
          const classes = [
            styles.challengeItem,
            done ? styles.challengeDone : '',
            current ? styles.challengeCurrent : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <li key={key} className={classes}>
              <span className={styles.challengeMark} aria-hidden="true">
                {done ? '✓' : '○'}
              </span>
              {t(key)}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
