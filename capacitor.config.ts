import type { CapacitorConfig } from '@capacitor/cli'

// The iOS app: the same web build (./dist) inside a native shell. See "iOS" in CLAUDE.md.
const config: CapacitorConfig = {
  appId: 'io.github.keehwz.timebox',
  appName: 'TimeBox',
  webDir: 'dist',
  backgroundColor: '#F2F6FF',
  ios: {
    // Draw under the status bar and home indicator; the app pads itself with env(safe-area-inset-*).
    contentInset: 'never',
    backgroundColor: '#F2F6FF',
  },
}

export default config
