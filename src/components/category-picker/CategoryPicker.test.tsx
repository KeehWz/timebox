import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryPicker } from './CategoryPicker'

describe('CategoryPicker', () => {
  it('renders all six categories', () => {
    render(<CategoryPicker onSelect={() => {}} />)
    expect(screen.getByText('工作')).toBeInTheDocument()
    expect(screen.getByText('学习')).toBeInTheDocument()
    expect(screen.getByText('其他')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(6)
  })

  it('calls onSelect with the category id when a tile is clicked', async () => {
    const onSelect = vi.fn()
    render(<CategoryPicker onSelect={onSelect} />)
    await userEvent.click(screen.getByText('工作'))
    expect(onSelect).toHaveBeenCalledWith('work')
  })
})
