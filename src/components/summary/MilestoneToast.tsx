import type { MilestoneKind } from '../../domain/milestone'
import { useT } from '../../i18n/I18nContext'
import styles from './summary.module.css'

interface MilestoneToastProps {
  kinds: readonly MilestoneKind[]
}

/** Milestones earned by the just-completed session (spec §13). Renders nothing when empty. */
export function MilestoneToast({ kinds }: MilestoneToastProps) {
  const { t } = useT()
  if (kinds.length === 0) return null
  return (
    <ul className={styles.milestones} aria-live="polite">
      {kinds.map((kind) => (
        <li key={kind} className={styles.milestoneChip}>
          <span aria-hidden="true">🎉</span> {t(`milestone.${kind}`)}
        </li>
      ))}
    </ul>
  )
}
