import { useState } from 'react'
import { CategoryIcon } from '../ui/CategoryIcon'
import { ROUGH_AMOUNTS, presetsFor } from '../domain/defaults'
import { formatRecordedTotal } from '../domain/format'
import { roughAmountMinutes, summarizeDirectionItems } from '../domain/time'
import type { Direction, DirectionItem, SessionType } from '../domain/types'

export function DirectionScreen({ sessionTypes, directions, onUpdate, onRecord }: {
  sessionTypes: SessionType[]; directions: Direction[]; onUpdate: (dirs: Direction[]) => void
  onRecord: () => void
}) {
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null)
  const [draftItems, setDraftItems] = useState<DirectionItem[]>([])
  const dirMap = Object.fromEntries(directions.map(d => [d.typeId, d]))
  const allTypes = sessionTypes
  const editingType = editingTypeId ? allTypes.find(type => type.id === editingTypeId) || null : null
  const editingPresets = editingType ? presetsFor(editingType) : []

  const openConfiguration = (typeId: string) => {
    const existing = dirMap[typeId]
    setDraftItems(existing?.items
      ? existing.items.map(item => ({ ...item }))
      : existing ? [{ preset: null, roughAmount: existing.roughAmount }] : [])
    setEditingTypeId(typeId)
  }

  const toggleDraftItem = (preset: string | null) => {
    setDraftItems(items => items.some(item => item.preset === preset)
      ? items.filter(item => item.preset !== preset)
      : [...items, { preset, roughAmount: 'no amount' }])
  }

  const setDraftAmount = (preset: string | null, roughAmount: string) => {
    setDraftItems(items => items.map(item => item.preset === preset ? { ...item, roughAmount } : item))
  }

  const saveConfiguration = () => {
    if (!editingType) return
    const remaining = directions.filter(direction => direction.typeId !== editingType.id)
    onUpdate(draftItems.length === 0
      ? remaining
      : [...remaining, {
          typeId: editingType.id,
          roughAmount: summarizeDirectionItems(draftItems),
          items: draftItems,
        }])
    setEditingTypeId(null)
  }

  return (
    <div className="direction-overview-page">
      <header>
        <p>Today&apos;s Direction</p>
        <span>Anything you may want to give time to today?</span>
      </header>

      <div className="direction-compact-list">
        {allTypes.map(type => {
          const direction = dirMap[type.id]
          const isSelected = !!direction
          const itemCount = direction?.items?.length || (direction ? 1 : 0)
          const amount = direction?.items
            ? summarizeDirectionItems(direction.items)
            : direction?.roughAmount || 'no amount'

          return (
            <button
              key={type.id}
              className={`direction-compact-row${isSelected ? ' is-selected' : ''}`}
              onClick={() => openConfiguration(type.id)}
            >
              <span className="direction-row-icon"><CategoryIcon id={type.iconId || type.id} /></span>
              <span className="direction-row-name">{type.name}</span>
              {isSelected && (
                <span className="direction-row-summary">
                  {amount !== 'no amount' ? amount : itemCount > 1 ? `${itemCount} items` : 'Set'}
                </span>
              )}
              <span className="direction-row-status">
                {isSelected
                  ? <svg width={11} height={9} viewBox="0 0 11 9"><path d="m1 4.5 3 3L10 1" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /></svg>
                  : <span />}
              </span>
            </button>
          )
        })}
      </div>

      <nav className="direction-page-navigation" aria-label="Direction navigation">
        <button className="is-record-right" onClick={onRecord}>
          <span>Record</span>
          <svg width={15} height={15} viewBox="0 0 15 15" aria-hidden="true">
            <path d="m5.8 3.7 3.7 3.8-3.7 3.8" fill="none" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </nav>

      {editingType && (
        <div className="modal-veil direction-config-veil" onClick={() => setEditingTypeId(null)}>
          <div className="direction-config-sheet animate-fade-in" onClick={event => event.stopPropagation()}>
            <p className="direction-config-kicker">{editingType.name}</p>
            <h2>Where would you like to give time?</h2>
            <div className="direction-item-list">
              {[{ key: null, label: `General ${editingType.name}` }, ...editingPresets.map(preset => ({ key: preset, label: preset }))].map(option => {
                const selectedItem = draftItems.find(item => item.preset === option.key)
                const isCustom = !!selectedItem && !ROUGH_AMOUNTS.includes(selectedItem.roughAmount)
                const customMinutes = selectedItem ? roughAmountMinutes(selectedItem.roughAmount) || 90 : 90
                return (
                  <div key={option.key || '__general__'} className={`direction-config-item${selectedItem ? ' is-selected' : ''}`}>
                    <button className="direction-item-toggle" onClick={() => toggleDraftItem(option.key)}>
                      <span className="circle-choice">
                        {selectedItem && <svg width={11} height={8} viewBox="0 0 11 8"><path d="M1 4L4 7L10 1" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </span>
                      <span>{option.label}</span>
                    </button>
                    {selectedItem && (
                      <div className="direction-amount-controls">
                        {ROUGH_AMOUNTS.map(amount => (
                          <button
                            key={amount}
                            className={selectedItem.roughAmount === amount ? 'is-selected' : ''}
                            onClick={() => setDraftAmount(option.key, amount)}
                          >
                            {amount === 'no amount' ? 'No amount' : amount}
                          </button>
                        ))}
                        <button
                          className={isCustom ? 'is-selected' : ''}
                          onClick={() => setDraftAmount(option.key, isCustom ? selectedItem.roughAmount : '90m')}
                        >
                          Custom
                        </button>
                        {isCustom && (
                          <div className="direction-custom-stepper">
                            <button onClick={() => setDraftAmount(option.key, `${Math.max(15, customMinutes - 15)}m`)}>−</button>
                            <span>{formatRecordedTotal(customMinutes * 60000)}</span>
                            <button onClick={() => setDraftAmount(option.key, `${Math.min(720, customMinutes + 15)}m`)}>+</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="direction-config-actions">
              <button onClick={() => setEditingTypeId(null)}>Cancel</button>
              <button className="is-primary" onClick={saveConfiguration}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
