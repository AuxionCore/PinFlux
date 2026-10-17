// PinFlux's pinned chats are retired in favor of ChatGPT's native pinning
// (#23). Existing users keep the feature until the sunset; new users never get
// it. Only the UI goes away — pins stay in storage.sync so they can be
// restored, and the popup keeps listing them for converting to native pins.

/** Local midnight, Jan 1 2027. Everything pinning-related hides from here on. */
export const PINNING_SUNSET = new Date(2027, 0, 1)

/** First version that no longer offers pinning to new users. */
const DEPRECATION_VERSION = '2.4.0'

// storage.sync, so an update on one device marks the user on all of them
const LEGACY_USER_KEY = 'pinningLegacyUser'

export interface StoredPin {
  urlId: string
  title: string
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

/**
 * Call from runtime.onInstalled. An update from before the deprecation means
 * the user had pinning available, so they keep it until the sunset.
 */
export async function markLegacyUserOnUpdate(
  details: { reason: string; previousVersion?: string }
): Promise<void> {
  if (details.reason !== 'update' || !details.previousVersion) return
  if (compareVersions(details.previousVersion, DEPRECATION_VERSION) >= 0) return
  await browser.storage.sync.set({ [LEGACY_USER_KEY]: true })
}

function isPinList(value: unknown): value is StoredPin[] {
  return (
    Array.isArray(value) &&
    value.every(
      pin => typeof pin === 'object' && pin && typeof pin.urlId === 'string'
    )
  )
}

/**
 * Every pinned chat in storage, across all ChatGPT accounts. Pin lists are
 * keyed by profile ID, so they're found by shape rather than by key.
 */
export async function getAllStoredPins(): Promise<StoredPin[]> {
  const all = await browser.storage.sync.get(null)
  const pins: StoredPin[] = []
  for (const [key, value] of Object.entries(all)) {
    if (key.startsWith('bm_') || !isPinList(value)) continue
    pins.push(...value)
  }
  return pins
}

/**
 * Existing user: updated from before 2.4.0, or has a pin list in storage (even
 * an empty one — they used pinning). The second rule covers an existing user
 * installing on a new device, where Chrome reports a fresh install.
 */
export async function isLegacyPinningUser(): Promise<boolean> {
  const all = await browser.storage.sync.get(null)
  if (all[LEGACY_USER_KEY] === true) return true
  return Object.entries(all).some(
    ([key, value]) => !key.startsWith('bm_') && isPinList(value)
  )
}

export function isPastPinningSunset(now = new Date()): boolean {
  return now >= PINNING_SUNSET
}

/** Whether to show any pinning UI: existing users, before the sunset. */
export async function isPinningAvailable(now = new Date()): Promise<boolean> {
  if (isPastPinningSunset(now)) return false
  try {
    return await isLegacyPinningUser()
  } catch (error) {
    // Failing closed would hide an existing user's pins; failing open would
    // only show an empty board to a new user. Prefer the latter.
    console.error('[PinFlux] Could not check pinning availability:', error)
    return true
  }
}
