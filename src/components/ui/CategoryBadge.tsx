import type { CSSProperties } from 'react'
import { categoryAccent } from '../../domain/categories'
import { useCategory } from '../../hooks/useCategory'
import styles from './ui.module.css'

interface CategoryBadgeProps {
  /** Builtin CategoryId or a custom focus-type id. */
  categoryId: string
  size?: 'sm' | 'md'
}

export function CategoryBadge({ categoryId, size = 'md' }: CategoryBadgeProps) {
  const category = useCategory(categoryId)
  const className = size === 'sm' ? `${styles.badge} ${styles.badgeSm}` : styles.badge
  return (
    <span className={className} style={{ '--accent': categoryAccent(category) } as CSSProperties}>
      {category.iconImage ? (
        <img className={styles.badgeImg} src={category.iconImage} alt="" width="16" height="16" />
      ) : (
        <span aria-hidden="true">{category.icon}</span>
      )}
      <span>{category.displayLabel}</span>
    </span>
  )
}
