import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithI18n } from '../../test/renderWithI18n'
import { CategoryPicker } from './CategoryPicker'

describe('CategoryPicker', () => {
  it('renders all six categories', () => {
    renderWithI18n(<CategoryPicker onSelect={() => {}} />)
    expect(screen.getByText('工作')).toBeInTheDocument()
    expect(screen.getByText('学习')).toBeInTheDocument()
    expect(screen.getByText('其他')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(6)
  })

  it('calls onSelect with the category id when a tile is clicked', async () => {
    const onSelect = vi.fn()
    renderWithI18n(<CategoryPicker onSelect={onSelect} />)
    await userEvent.click(screen.getByText('工作'))
    expect(onSelect).toHaveBeenCalledWith('work')
  })
})
