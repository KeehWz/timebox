import type { Session } from '../../domain/session'
import type { CheckIn } from '../../domain/checkIn'
import { CATEGORIES } from '../../domain/categories'
import { formatDuration, summarizeDay } from '../../domain/time'
import { useT } from '../../i18n/I18nContext'
import styles from './daily.module.css'

interface DayNarrativeProps {
  sessions: Session[]
  checkIns?: CheckIn[]
  now: number
}

const TOP_CATEGORIES = 2

/**
 * Spec §15 future enhancement: an automatically generated one-line narrative of the day.
 * Deterministic and template-based (no inference) — same numbers as DailyTotals, in prose.
 */
export function DayNarrative({ sessions, checkIns = [], now }: DayNarrativeProps) {
  const { t, locale } = useT()
  const completedCount = sessions.filter((s) => s.status === 'completed').length
  if (completedCount === 0) return null

  const summary = summarizeDay(sessions, now)
  const totalMs = Object.values(summary.byCategory).reduce((sum, ms) => sum + (ms ?? 0), 0)

  const top = CATEGORIES.map((category) => ({
    category,
    ms: summary.byCategory[category.id] ?? 0,
  }))
    .filter((entry) => entry.ms > 0)
    .sort((a, b) => b.ms - a.ms)
    .slice(0, TOP_CATEGORIES)
    .map((entry) =>
      t('daily.narrativeCat', {
        category: t(`category.${entry.category.id}.label`),
        duration: formatDuration(entry.ms, locale),
      }),
    )
    .join(locale === 'zh' ? '、' : ', ')

  let text = t('daily.narrativeBase', {
    count: completedCount,
    total: formatDuration(totalMs, locale),
  })
  if (top) text += t('daily.narrativeTop', { categories: top })
  if (checkIns.length > 0) text += t('daily.narrativeCheckins', { count: checkIns.length })
  text += t('daily.narrativeEnd')

  return <p className={styles.narrative}>{text}</p>
}
