import { CATEGORIES } from '../../domain/categories'
import type { CategoryId } from '../../domain/session'
import { CategoryTile } from './CategoryTile'
import styles from './category-picker.module.css'

interface CategoryPickerProps {
  onSelect: (id: CategoryId) => void
}

export function CategoryPicker({ onSelect }: CategoryPickerProps) {
  return (
    <section className={styles.picker} aria-labelledby="picker-heading">
      <header className={styles.intro}>
        <h1 id="picker-heading" className={styles.heading}>
          你想记录什么？
        </h1>
        <p className={styles.sub}>选一个类型，立刻开始计时</p>
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
