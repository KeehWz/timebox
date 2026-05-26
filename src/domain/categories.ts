import type { CategoryId } from './session'

export interface Category {
  id: CategoryId
  label: string // Chinese display label
  hint: string // example uses, shown as placeholder / subtext
  icon: string // emoji glyph (lightweight — no icon-font dependency)
  colorVar: string // CSS custom-property name for this category's accent
}

export const CATEGORIES: readonly Category[] = [
  { id: 'work', label: '工作', hint: '实习、项目开发、写报告、开会', icon: '💼', colorVar: '--cat-work' },
  { id: 'study', label: '学习', hint: '上课、刷题、复习、看论文', icon: '📚', colorVar: '--cat-study' },
  { id: 'rest', label: '休息', hint: '午休、刷手机、放空', icon: '☕️', colorVar: '--cat-rest' },
  { id: 'exercise', label: '运动', hint: '健身、跳舞、散步', icon: '🏃', colorVar: '--cat-exercise' },
  { id: 'chores', label: '生活事务', hint: '做饭、洗衣服、打扫、买东西', icon: '🧺', colorVar: '--cat-chores' },
  { id: 'other', label: '其他', hint: '临时事件、自定义活动', icon: '✨', colorVar: '--cat-other' },
]

const BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, Category>

/** Look up a category by id. Ids are a closed union, so this always resolves. */
export function getCategory(id: CategoryId): Category {
  return BY_ID[id]
}

/** Runtime guard for values arriving from outside the type system (route params, storage, etc.). */
export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(BY_ID, value)
}
