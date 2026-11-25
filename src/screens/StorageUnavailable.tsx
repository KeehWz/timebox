import { TEXT, TEXT2 } from '../ui/tokens'

/** Shown instead of a blank page when the local database cannot be opened. */
export function StorageUnavailable() {
  return (
    <div style={{ height: '100dvh', display: 'grid', placeItems: 'center', padding: 32 }}>
      <div style={{ maxWidth: 320, textAlign: 'center' }}>
        <p style={{ fontSize: 20, fontWeight: 500, color: TEXT, marginBottom: 10 }}>TimeBox couldn&apos;t open its storage</p>
        <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.6, marginBottom: 24 }}>
          Your records are kept on this device, and this browser isn&apos;t letting TimeBox read them.
          If site data is blocked — some private windows do this — allow it, then reload.
        </p>
        <button className="confirm-primary" onClick={() => window.location.reload()}>Reload</button>
      </div>
    </div>
  )
}
