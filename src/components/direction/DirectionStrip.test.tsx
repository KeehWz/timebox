import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithI18n } from '../../test/renderWithI18n'
import { DirectionStrip } from './DirectionStrip'

describe('DirectionStrip', () => {
  it('shows a chip per direction, with target when set', () => {
    renderWithI18n(
      <DirectionStrip
        directions={[
          { date: '2026-07-06', categoryId: 'work', targetDurationMs: 3_600_000 },
          { date: '2026-07-06', categoryId: 'exercise', targetDurationMs: null },
        ]}
      />,
    )
    expect(screen.getByText('今日方向')).toBeInTheDocument()
    expect(screen.getByText(/工作/)).toBeInTheDocument()
    expect(screen.getByText(/1时0分/)).toBeInTheDocument()
    expect(screen.getByText(/运动/)).toBeInTheDocument()
  })

  it('renders nothing when there is no direction', () => {
    const { container } = renderWithI18n(<DirectionStrip directions={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
