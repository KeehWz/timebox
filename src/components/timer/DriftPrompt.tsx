import { useState } from 'react'
import type { CSSProperties } from 'react'
import { CATEGORIES } from '../../domain/categories'
import type { Session } from '../../domain/session'
import { activeMs } from '../../domain/metrics'
import { sessionRepository } from '../../data/sessionRepository'
import { usePref } from '../../hooks/usePref'
import { useT } from '../../i18n/I18nContext'
import styles from './timer.module.css'

/** Default cadence when the user hasn't configured one (settings → Session). */
export const DEFAULT_DRIFT_PROMPT_MINUTES = 15

interface DriftPromptProps {
  session: Session
  now: number
  onEnd: () => void
}

/**
 * Spec §9 optional behavior: after a configurable stretch of drifting, gently ask
 * "Still drifting?" — continue (snoozes one more interval), convert to a category
 * (the prompt disappears because the session stops being drift), or end the session.
 */
export function DriftPrompt({ session, now, onEnd }: DriftPromptProps) {
  const { t } = useT()
  const pref = usePref('driftPrompt')
  // Threshold in *elapsed* ms; survives re-renders, resets per mount (a reload past the
  // interval re-prompts immediately, which is the desired nudge).
  const [snoozedUntilMs, setSnoozedUntilMs] = useState<number | null>(null)

  if (session.type !== 'drift') return null
  const minutes = pref === undefined ? DEFAULT_DRIFT_PROMPT_MINUTES : pref.intervalMinutes
  if (minutes === null) return null

  const intervalMs = minutes * 60_000
  const elapsed = activeMs(session, now)
  if (elapsed < (snoozedUntilMs ?? intervalMs)) return null

  return (
    <section className={styles.driftPrompt} aria-live="polite">
      <p className={styles.driftPromptTitle}>{t('drift.promptTitle')}</p>
      <div className={styles.driftPromptRow}>
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            className={styles.driftPromptConvert}
            style={{ '--accent': `var(${category.colorVar})` } as CSSProperties}
            aria-label={t('drift.promptConvertAria', {
              category: t(`category.${category.id}.label`),
            })}
            onClick={() => void sessionRepository.convertToCategory(session.id, category.id)}
          >
            <span aria-hidden="true">{category.icon}</span>
          </button>
        ))}
      </div>
      <div className={styles.driftPromptActions}>
        <button
          type="button"
          className={styles.driftPromptContinue}
          onClick={() => setSnoozedUntilMs(elapsed + intervalMs)}
        >
          {t('drift.promptContinue')}
        </button>
        <button type="button" className={styles.driftPromptEnd} onClick={onEnd}>
          {t('drift.promptEnd')}
        </button>
      </div>
    </section>
  )
}
