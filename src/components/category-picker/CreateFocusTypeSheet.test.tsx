import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithI18n } from '../../test/renderWithI18n'
import { db } from '../../data/db'
import { CreateFocusTypeSheet } from './CreateFocusTypeSheet'

beforeEach(async () => {
  await db.focusTypes.clear()
})

describe('CreateFocusTypeSheet', () => {
  it('disables create until a name is entered', () => {
    renderWithI18n(<CreateFocusTypeSheet onClose={() => {}} />)
    expect(screen.getByRole('button', { name: '创建' })).toBeDisabled()
  })

  it('creates an emoji focus type and closes', async () => {
    const onClose = vi.fn()
    renderWithI18n(<CreateFocusTypeSheet onClose={onClose} />)
    await userEvent.type(screen.getByLabelText('名称'), '吉他')
    await userEvent.click(screen.getByRole('button', { name: '🎸' }))
    await userEvent.click(screen.getByRole('button', { name: '创建' }))
    await waitFor(async () => {
      const stored = await db.focusTypes.toArray()
      expect(stored).toHaveLength(1)
      expect(stored[0]).toMatchObject({ label: '吉他', icon: '🎸', iconKind: 'emoji' })
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('rejects oversized images with an error message', async () => {
    renderWithI18n(<CreateFocusTypeSheet onClose={() => {}} />)
    const file = new File([new ArrayBuffer(400_000)], 'big.png', { type: 'image/png' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, file)
    expect(await screen.findByRole('alert')).toHaveTextContent('图片太大')
  })

  it('accepts a typed custom emoji', async () => {
    const onClose = vi.fn()
    renderWithI18n(<CreateFocusTypeSheet onClose={onClose} />)
    await userEvent.type(screen.getByLabelText('名称'), '天文')
    const emojiInput = screen.getByLabelText('或输入任意 emoji')
    await userEvent.clear(emojiInput)
    await userEvent.type(emojiInput, '🔭')
    await userEvent.click(screen.getByRole('button', { name: '创建' }))
    await waitFor(async () => {
      const stored = await db.focusTypes.toArray()
      expect(stored[0]).toMatchObject({ label: '天文', icon: '🔭' })
    })
  })

  it('cancels without saving', async () => {
    const onClose = vi.fn()
    renderWithI18n(<CreateFocusTypeSheet onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(onClose).toHaveBeenCalled()
    expect(await db.focusTypes.count()).toBe(0)
  })
})
