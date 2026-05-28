import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LongPressEndButton } from './LongPressEndButton'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('LongPressEndButton', () => {
  it('confirms before ending on direct (keyboard/AT) activation', () => {
    const onEnd = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<LongPressEndButton onEnd={onEnd} />)
    fireEvent.click(screen.getByRole('button'))
    expect(window.confirm).toHaveBeenCalledOnce()
    expect(onEnd).toHaveBeenCalledOnce()
  })

  it('does not end when the confirm is dismissed', () => {
    const onEnd = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<LongPressEndButton onEnd={onEnd} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onEnd).not.toHaveBeenCalled()
  })

  it('skips the confirm when activated via pointer (gesture path)', () => {
    const onEnd = vi.fn()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<LongPressEndButton onEnd={onEnd} />)
    const button = screen.getByRole('button')
    fireEvent.pointerDown(button)
    fireEvent.pointerUp(button)
    fireEvent.click(button)
    expect(confirmSpy).not.toHaveBeenCalled()
  })
})
