import { describe, it, expect, vi, afterEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithI18n } from '../../test/renderWithI18n'
import { StartTransition, FIRST_OF_DAY_MS, NORMAL_MS } from './StartTransition'

afterEach(() => {
  vi.useRealTimers()
})

describe('StartTransition', () => {
  it('shows the category and fires onDone after the normal duration', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    renderWithI18n(<StartTransition categoryId="work" firstOfDay={false} onDone={onDone} />)

    expect(screen.getByText('工作')).toBeInTheDocument()
    expect(screen.getByText('准备开始…')).toBeInTheDocument()

    vi.advanceTimersByTime(NORMAL_MS - 1)
    expect(onDone).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('holds a longer beat for the first session of the day', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    renderWithI18n(<StartTransition categoryId="study" firstOfDay={true} onDone={onDone} />)

    vi.advanceTimersByTime(NORMAL_MS)
    expect(onDone).not.toHaveBeenCalled()
    vi.advanceTimersByTime(FIRST_OF_DAY_MS - NORMAL_MS)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('tap skips immediately and never double-fires', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    renderWithI18n(<StartTransition categoryId="work" firstOfDay={true} onDone={onDone} />)

    fireEvent.click(screen.getByRole('button', { name: '跳过过渡动画' }))
    expect(onDone).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(FIRST_OF_DAY_MS * 2)
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})
