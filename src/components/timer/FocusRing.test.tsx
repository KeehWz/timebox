import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { FocusRing } from './FocusRing'

const CIRCUMFERENCE = 2 * Math.PI * 108

function progressCircle(container: HTMLElement) {
  const circles = container.querySelectorAll('circle')
  return circles[1]
}

describe('FocusRing', () => {
  it('draws the arc for the elapsed fraction of the current minute', () => {
    const { container } = render(<FocusRing progress={0.5} />)
    const offset = Number(progressCircle(container).getAttribute('stroke-dashoffset'))
    expect(offset).toBeCloseTo(CIRCUMFERENCE * 0.5, 3)
  })

  it('clamps out-of-range progress', () => {
    const over = render(<FocusRing progress={1.4} />)
    expect(
      Number(progressCircle(over.container).getAttribute('stroke-dashoffset')),
    ).toBeCloseTo(0, 3)
    const under = render(<FocusRing progress={-0.2} />)
    expect(
      Number(progressCircle(under.container).getAttribute('stroke-dashoffset')),
    ).toBeCloseTo(CIRCUMFERENCE, 3)
  })

  it('animates mid-minute ticks but snaps on the minute wrap', () => {
    const { container, rerender } = render(<FocusRing progress={30 / 60} />)
    expect(progressCircle(container).style.transition).toContain('stroke-dashoffset')
    rerender(<FocusRing progress={0.5 / 60} />)
    expect(progressCircle(container).style.transition).toBe('none')
  })
})
