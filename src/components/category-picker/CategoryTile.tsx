import type { CSSProperties } from 'react'
import { categoryAccent, isCategoryId, type Category } from '../../domain/categories'
import { useT } from '../../i18n/I18nContext'
import styles from './category-picker.module.css'

interface CategoryTileProps {
  category: Category
  onSelect: (id: string) => void
}

export function CategoryTile({ category, onSelect }: CategoryTileProps) {
  const { t } = useT()
  const id = category.id
  const label = category.label ?? (isCategoryId(id) ? t(`category.${id}.label`) : id)
  const hint = isCategoryId(id) ? t(`category.${id}.hint`) : t('picker.customHint')
  return (
    <button
      type="button"
      className={styles.tile}
      style={{ '--accent': categoryAccent(category) } as CSSProperties}
      onClick={() => onSelect(category.id)}
    >
      <span className={styles.tileIcon} aria-hidden="true">
        {category.iconImage ? (
          <img className={styles.tileImg} src={category.iconImage} alt="" />
        ) : (
          category.icon
        )}
      </span>
      <span className={styles.tileLabel}>{label}</span>
      <span className={styles.tileHint}>{hint}</span>
    </button>
  )
}
