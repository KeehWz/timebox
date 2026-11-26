import { Capacitor } from '@capacitor/core'

/** True inside the iOS app (Capacitor), false in a browser or the installed PWA. */
export const isNative = Capacitor.isNativePlatform()

// The web app is served by the same Worker as the API, so relative paths work. The iOS app loads
// its files from capacitor://localhost and has to call the deployed API by its full address.
const API_ORIGIN = isNative ? (import.meta.env.VITE_API_ORIGIN ?? 'https://timebox.michaelwz2180.workers.dev') : ''

export function apiUrl(path: string): string {
  return API_ORIGIN + path
}
