import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithI18n } from '../../test/renderWithI18n'
import { db } from '../../data/db'
import { focusTypeRepository } from '../../data/focusTypeRepository'
import { CategoryBadge } from './CategoryBadge'

beforeEach(async () => {
  await db.focusTypes.clear()
})

describe('CategoryBadge', () => {
  it('renders a builtin category with its emoji and localized label', () => {
    renderWithI18n(<CategoryBadge categoryId="work" />)
    expect(screen.getByText('工作')).toBeInTheDocument()
    expect(screen.getByText('💼')).toBeInTheDocument()
  })

  it('falls back to other visuals for unknown ids', () => {
    renderWithI18n(<CategoryBadge categoryId="ft-missing" size="sm" />)
    expect(screen.getByText('其他')).toBeInTheDocument()
  })

  it('renders a custom image focus type with an img icon and its own label', async () => {
    const type = await focusTypeRepository.add({
      label: '画画',
      icon: 'data:image/png;base64,abc',
      iconKind: 'image',
    })
    renderWithI18n(<CategoryBadge categoryId={type.id} />)
    await waitFor(() => {
      expect(screen.getByText('画画')).toBeInTheDocument()
    })
    expect(document.querySelector('img')).toHaveAttribute('src', 'data:image/png;base64,abc')
  })
})
