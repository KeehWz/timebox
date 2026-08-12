import { describe, it, expect } from 'vitest'
import {
  FOCUS_TYPE_COLORS,
  pickFocusTypeColor,
  toCategory,
  validateFocusTypeInput,
  type FocusType,
} from './focusType'

describe('pickFocusTypeColor', () => {
  it('rotates through the palette', () => {
    expect(pickFocusTypeColor(0)).toBe(FOCUS_TYPE_COLORS[0])
    expect(pickFocusTypeColor(FOCUS_TYPE_COLORS.length)).toBe(FOCUS_TYPE_COLORS[0])
    expect(pickFocusTypeColor(1)).toBe(FOCUS_TYPE_COLORS[1])
  })
})

describe('toCategory', () => {
  const base: FocusType = {
    id: 'ft-1',
    label: 'Guitar',
    icon: '🎸',
    iconKind: 'emoji',
    color: 'oklch(58% 0.14 45)',
    createdAt: 1,
  }

  it('maps an emoji type to an icon category', () => {
    const category = toCategory(base)
    expect(category).toMatchObject({ id: 'ft-1', icon: '🎸', label: 'Guitar' })
    expect(category.iconImage).toBeUndefined()
    expect(category.color).toBe(base.color)
  })

  it('maps an image type to an iconImage category', () => {
    const category = toCategory({ ...base, icon: 'data:image/png;base64,x', iconKind: 'image' })
    expect(category.icon).toBe('')
    expect(category.iconImage).toBe('data:image/png;base64,x')
  })
})

describe('validateFocusTypeInput', () => {
  it('requires a name and an icon', () => {
    expect(validateFocusTypeInput('Guitar', '🎸')).toBe(true)
    expect(validateFocusTypeInput('  ', '🎸')).toBe(false)
    expect(validateFocusTypeInput('Guitar', '')).toBe(false)
  })
})
