import { useState } from 'react'
import type { CSSProperties } from 'react'
import { CATEGORIES } from '../../domain/categories'
import type { CategoryId } from '../../domain/session'
import type { DirectionEntry } from '../../domain/dailyDirection'
import { formatDuration } from '../../domain/time'
import { useT } from '../../i18n/I18nContext'
import styles from './direction.module.css'

const MINUTE = 60_000
/** Preset targets (spec §5: optional estimated durations). null = no target. */
const TARGET_OPTIONS: readonly (number | null)[] = [
  null,
  30 * MINUTE,
  60 * MINUTE,
  120 * MINUTE,
  180 * MINUTE,
  240 * MINUTE,
]

interface DirectionFormProps {
  onConfirm: (entries: DirectionEntry[]) => void
  onSkip: () => void
}

interface Selection {
  selected: boolean
  targetDurationMs: number | null
}

/** Pick today's intended categories + optional time targets (spec §5). Fully skippable. */
export function DirectionForm({ onConfirm, onSkip }: DirectionFormProps) {
  const { t, locale } = useT()
  const [selections, setSelections] = useState<Partial<Record<CategoryId, Selection>>>({})

  function toggle(id: CategoryId) {
    setSelections((prev) => ({
      ...prev,
      [id]: { selected: !prev[id]?.selected, targetDurationMs: prev[id]?.targetDurationMs ?? null },
    }))
  }

  function setTarget(id: CategoryId, targetDurationMs: number | null) {
    setSelections((prev) => ({
      ...prev,
      [id]: { selected: prev[id]?.selected ?? true, targetDurationMs },
    }))
  }

  function confirm() {
    const entries: DirectionEntry[] = CATEGORIES.filter((c) => selections[c.id]?.selected).map(
      (c) => ({ categoryId: c.id, targetDurationMs: selections[c.id]?.targetDurationMs ?? null }),
    )
    onConfirm(entries)
  }

  return (
    <section className={styles.form} aria-labelledby="direction-heading">
      <header>
        <h1 id="direction-heading" className={styles.heading}>
          {t('direction.title')}
        </h1>
        <p className={styles.sub}>{t('direction.subtitle')}</p>
      </header>

      <ul className={styles.list}>
        {CATEGORIES.map((category) => {
          const label = t(`category.${category.id}.label`)
          const selection = selections[category.id]
          const selected = selection?.selected ?? false
          return (
            <li
              key={category.id}
              className={styles.item}
              style={{ '--accent': `var(${category.colorVar})` } as CSSProperties}
            >
              <button
                type="button"
                className={selected ? `${styles.chip} ${styles.chipOn}` : styles.chip}
                aria-pressed={selected}
                onClick={() => toggle(category.id)}
              >
                <span aria-hidden="true">{category.icon}</span> {label}
              </button>
              {selected && (
                <select
                  className={styles.target}
                  aria-label={t('direction.targetAria', { category: label })}
                  value={String(selection?.targetDurationMs ?? '')}
                  onChange={(e) =>
                    setTarget(category.id, e.target.value === '' ? null : Number(e.target.value))
                  }
                >
                  {TARGET_OPTIONS.map((option) => (
                    <option key={String(option)} value={String(option ?? '')}>
                      {option === null
                        ? t('direction.targetNone')
                        : formatDuration(option, locale)}
                    </option>
                  ))}
                </select>
              )}
            </li>
          )
        })}
      </ul>

      <footer className={styles.actions}>
        <button type="button" className={styles.confirm} onClick={confirm}>
          {t('direction.confirm')}
        </button>
        <button type="button" className={styles.skip} onClick={onSkip}>
          {t('direction.skip')}
        </button>
      </footer>
    </section>
  )
}
