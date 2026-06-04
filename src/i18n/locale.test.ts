import { describe, it, expect, vi, afterEach } from 'vitest'
import { detectLocale, isLocale, loadLocale, saveLocale } from './locale'

function setNavigatorLanguage(lang: string) {
  Object.defineProperty(navigator, 'language', { value: lang, configurable: true })
}

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('isLocale', () => {
  it('accepts zh/en and rejects anything else', () => {
    expect(isLocale('zh')).toBe(true)
    expect(isLocale('en')).toBe(true)
    expect(isLocale('fr')).toBe(false)
    expect(isLocale(null)).toBe(false)
    expect(isLocale(42)).toBe(false)
  })
})

describe('detectLocale', () => {
  it('returns zh for a Chinese navigator language', () => {
    setNavigatorLanguage('zh-CN')
    expect(detectLocale()).toBe('zh')
  })
  it('returns en otherwise', () => {
    setNavigatorLanguage('en-US')
    expect(detectLocale()).toBe('en')
  })
})

describe('loadLocale / saveLocale', () => {
  it('round-trips a stored locale', () => {
    saveLocale('en')
    expect(loadLocale()).toBe('en')
  })
  it('falls back to detection for an unknown stored value', () => {
    localStorage.setItem('timebox.locale', 'xx')
    setNavigatorLanguage('zh-CN')
    expect(loadLocale()).toBe('zh')
  })
  it('tolerates localStorage access throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    setNavigatorLanguage('en-US')
    expect(loadLocale()).toBe('en')
    expect(() => saveLocale('zh')).not.toThrow()
  })
})
