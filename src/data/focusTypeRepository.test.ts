import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from './db'
import { focusTypeRepository } from './focusTypeRepository'
import { FOCUS_TYPE_COLORS } from '../domain/focusType'

beforeEach(async () => {
  await db.focusTypes.clear()
})

describe('focusTypeRepository', () => {
  it('creates an emoji focus type with a rotating color', async () => {
    const first = await focusTypeRepository.add({ label: ' Guitar ', icon: '🎸', iconKind: 'emoji' })
    expect(first.label).toBe('Guitar')
    expect(first.id.startsWith('ft-')).toBe(true)
    expect(first.color).toBe(FOCUS_TYPE_COLORS[0])
    const second = await focusTypeRepository.add({ label: 'Yoga', icon: '🧘', iconKind: 'emoji' })
    expect(second.color).toBe(FOCUS_TYPE_COLORS[1])
  })

  it('stores image types', async () => {
    const type = await focusTypeRepository.add({
      label: 'Painting',
      icon: 'data:image/png;base64,abc',
      iconKind: 'image',
    })
    expect(type.iconKind).toBe('image')
  })

  it('rejects invalid input', async () => {
    await expect(
      focusTypeRepository.add({ label: '', icon: '🎸', iconKind: 'emoji' }),
    ).rejects.toThrow()
  })

  it('lists in creation order and removes', async () => {
    const a = await focusTypeRepository.add({ label: 'A', icon: '🅰️', iconKind: 'emoji' })
    await focusTypeRepository.add({ label: 'B', icon: '🅱️', iconKind: 'emoji' })
    const listed = await focusTypeRepository.list()
    expect(listed.map((t) => t.label)).toEqual(['A', 'B'])
    await focusTypeRepository.remove(a.id)
    expect((await focusTypeRepository.list()).map((t) => t.label)).toEqual(['B'])
  })
})
