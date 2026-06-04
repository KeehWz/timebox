import type { CSSProperties } from 'react'
import type { Category } from '../../domain/categories'
import type { CategoryId } from '../../domain/session'
import { useT } from '../../i18n/I18nContext'
import styles from './category-picker.module.css'

interface CategoryTileProps {
  category: Category
  onSelect: (id: CategoryId) => void
}

export function CategoryTile({ category, onSelect }: CategoryTileProps) {
  const { t } = useT()
  return (
    <button
      type="button"
      className={styles.tile}
      style={{ '--accent': `var(${category.colorVar})` } as CSSProperties}
      onClick={() => onSelect(category.id)}
    >
      <span className={styles.tileIcon} aria-hidden="true">
        {category.icon}
      </span>
      <span className={styles.tileLabel}>{t(`category.${category.id}.label`)}</span>
      <span className={styles.tileHint}>{t(`category.${category.id}.hint`)}</span>
    </button>
  )
}
