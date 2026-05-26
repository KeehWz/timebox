/**
 * Generate a globally-unique session id.
 * String UUIDs (not auto-increment keys) keep the schema ready for optional cloud sync later
 * — e.g. dexie-cloud-addon expects global ids. crypto.randomUUID works in browsers (secure
 * context: https + localhost) and in Node test environments.
 */
export function newId(): string {
  return crypto.randomUUID()
}
