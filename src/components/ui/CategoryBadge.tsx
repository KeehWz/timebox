import type { CSSProperties } from 'react'
import { getCategory } from '../../domain/categories'
import type { CategoryId } from '../../domain/session'
import styles from './ui.module.css'

interface CategoryBadgeProps {
  categoryId: CategoryId
  size?: 'sm' | 'md'
}

export function CategoryBadge({ categoryId, size = 'md' }: CategoryBadgeProps) {
  const category = getCategory(categoryId)
  const className = size === 'sm' ? `${styles.badge} ${styles.badgeSm}` : styles.badge
  return (
    <span className={className} style={{ '--accent': `var(${category.colorVar})` } as CSSProperties}>
      <span aria-hidden="true">{category.icon}</span>
      <span>{category.label}</span>
    </span>
  )
}
