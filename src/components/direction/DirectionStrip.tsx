import type { CSSProperties } from 'react'
import { getCategory } from '../../domain/categories'
import type { DailyDirection } from '../../domain/dailyDirection'
import { formatDuration } from '../../domain/time'
import { useT } from '../../i18n/I18nContext'
import styles from './direction.module.css'

interface DirectionStripProps {
  directions: readonly DailyDirection[]
}

/** Quiet strip of today's intended categories on Home State B (spec §5). */
export function DirectionStrip({ directions }: DirectionStripProps) {
  const { t, locale } = useT()
  if (directions.length === 0) return null
  return (
    <div className={styles.strip}>
      <span className={styles.stripTitle}>{t('direction.stripTitle')}</span>
      {directions.map((direction) => {
        const category = getCategory(direction.categoryId)
        return (
          <span
            key={direction.categoryId}
            className={styles.stripChip}
            style={{ '--accent': `var(${category.colorVar})` } as CSSProperties}
          >
            <span aria-hidden="true">{category.icon}</span>
            {t(`category.${direction.categoryId}.label`)}
            {direction.targetDurationMs !== null &&
              ` · ${formatDuration(direction.targetDurationMs, locale)}`}
          </span>
        )
      })}
    </div>
  )
}
