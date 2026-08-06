import type { ApplicationPreferences, ApplicationPreferenceValue } from "./rpc-types"

export type PreferenceCategory =
  | "behavior"
  | "downloads"
  | "speed"
  | "connection"
  | "bittorrent"
  | "automation"
  | "advanced"

export const PREFERENCE_CATEGORY_ORDER: PreferenceCategory[] = [
  "behavior",
  "downloads",
  "speed",
  "connection",
  "bittorrent",
  "automation",
  "advanced",
]

export function getPreferenceCategory(key: string): PreferenceCategory {
  if (/^(start-added-torrents|trash-original-torrent-files|rename-partial-files|incomplete-dir-enabled|incomplete-dir)$/.test(key)) return "behavior"
  if (/^(download-dir|download-queue-enabled|download-queue-size|seed-queue-enabled|seed-queue-size)$/.test(key)) return "downloads"
  if (/^(speed-limit-|alt-speed-)/.test(key)) return "speed"
  if (/^(peer-|port-forwarding-enabled|encryption|blocklist-|dht-enabled|pex-enabled|lpd-enabled|utp-enabled)/.test(key)) return "connection"
  if (/^(script-torrent-done-)/.test(key)) return "automation"
  return "advanced"
}

export function isSensitivePreference(key: string): boolean {
  return /(password|token|secret|blocklist-url)/i.test(key)
}

export function isConnectionCriticalPreference(key: string): boolean {
  return /^(peer-port|port-forwarding-enabled|encryption|dht-enabled|pex-enabled|lpd-enabled|utp-enabled)/.test(key)
}

export function isStructuredPreference(value: ApplicationPreferenceValue): boolean {
  return value !== null && typeof value === "object"
}

export function getPreferenceValueType(value: ApplicationPreferenceValue): string {
  if (value === null) return "null"
  if (Array.isArray(value)) return "array"
  return typeof value
}

function serialize(value: ApplicationPreferenceValue | undefined): string {
  return JSON.stringify(value)
}

export function getPreferenceChanges(
  original: ApplicationPreferences,
  draft: ApplicationPreferences,
): Partial<ApplicationPreferences> {
  return Object.fromEntries(
    Object.entries(draft).filter(([key, value]) => serialize(value) !== serialize(original[key])),
  )
}
