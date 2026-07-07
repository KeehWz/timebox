import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithI18n } from '../../test/renderWithI18n'
import { MilestoneToast } from './MilestoneToast'

describe('MilestoneToast', () => {
  it('renders a chip per earned milestone', () => {
    renderWithI18n(<MilestoneToast kinds={['first_session', 'one_hour']} />)
    expect(screen.getByText('今日第一个 Session')).toBeInTheDocument()
    expect(screen.getByText('今日专注满 1 小时')).toBeInTheDocument()
  })

  it('renders nothing when no milestones were earned', () => {
    const { container } = renderWithI18n(<MilestoneToast kinds={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
