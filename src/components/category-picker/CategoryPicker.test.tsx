import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithI18n } from '../../test/renderWithI18n'
import { db } from '../../data/db'
import { categoryStatsRepository } from '../../data/categoryStatsRepository'
import { CategoryPicker } from './CategoryPicker'

beforeEach(async () => {
  await db.categoryStats.clear()
})

describe('CategoryPicker', () => {
  it('renders all six categories', () => {
    renderWithI18n(<CategoryPicker onSelect={() => {}} />)
    expect(screen.getByText('工作')).toBeInTheDocument()
    expect(screen.getByText('学习')).toBeInTheDocument()
    expect(screen.getByText('其他')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(6)
  })

  it('calls onSelect with the category id when a tile is clicked', async () => {
    const onSelect = vi.fn()
    renderWithI18n(<CategoryPicker onSelect={onSelect} />)
    await userEvent.click(screen.getByText('工作'))
    expect(onSelect).toHaveBeenCalledWith('work')
  })

  it('favoriting a category moves it to the front', async () => {
    renderWithI18n(<CategoryPicker onSelect={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: '收藏学习' }))

    await waitFor(() => {
      const first = screen.getAllByRole('listitem')[0]
      expect(within(first).getByText('学习')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: '取消收藏学习' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('orders recently used categories first', async () => {
    await categoryStatsRepository.recordUse('exercise', Date.now())
    renderWithI18n(<CategoryPicker onSelect={() => {}} />)

    await waitFor(() => {
      const first = screen.getAllByRole('listitem')[0]
      expect(within(first).getByText('运动')).toBeInTheDocument()
    })
  })
})
