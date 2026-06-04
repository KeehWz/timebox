import { CATEGORIES } from '../../domain/categories'
import type { CategoryId } from '../../domain/session'
import { useT } from '../../i18n/I18nContext'
import { CategoryTile } from './CategoryTile'
import styles from './category-picker.module.css'

interface CategoryPickerProps {
  onSelect: (id: CategoryId) => void
}

export function CategoryPicker({ onSelect }: CategoryPickerProps) {
  const { t } = useT()
  return (
    <section className={styles.picker} aria-labelledby="picker-heading">
      <header className={styles.intro}>
        <h1 id="picker-heading" className={styles.heading}>
          {t('home.title')}
        </h1>
        <p className={styles.sub}>{t('home.subtitle')}</p>
      </header>
      <ul className={styles.grid}>
        {CATEGORIES.map((category) => (
          <li key={category.id} className={styles.gridItem}>
            <CategoryTile category={category} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </section>
  )
}
