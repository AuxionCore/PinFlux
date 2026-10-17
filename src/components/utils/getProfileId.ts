// ChatGPT user IDs look like "user-<id>". Everything we store is keyed by the
// bare <id> (pinned chats under `{profileId}`, bookmarks under
// `bm_{profileId}_…`), so every source below must return exactly that part —
// returning anything else orphans the user's existing data.
const USER_ID = /^user-([a-zA-Z0-9]+)$/

const POLL_INTERVAL_MS = 100
// How long localStorage gets before we also ask the session endpoint
const SESSION_FALLBACK_AFTER_MS = 3000
const WARN_AFTER_MS = 10000

function parseLocalStorageJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function toProfileId(userId: unknown): string | null {
  if (typeof userId !== 'string') return null
  return userId.match(USER_ID)?.[1] ?? null
}

// Tried in order on every poll. Each one is tied to a ChatGPT version, so keep
// the old ones as fallbacks rather than replacing them.
const localStorageSources: (() => string | null)[] = [
  // Before Oct 2026: a `cache/user-<id>…` key
  () => {
    for (const key of Object.keys(localStorage)) {
      const match = key.match(/^cache\/user-([a-zA-Z0-9]+)/)
      if (match) return match[1] ?? null
    }
    return null
  },
  // Oct 2026: precise_location_identity = [accountId, "user-<id>"]
  () => {
    const value = parseLocalStorageJson('precise_location_identity')
    if (!Array.isArray(value)) return null
    for (const item of value) {
      const id = toProfileId(item)
      if (id) return id
    }
    return null
  },
  // Oct 2026: codex.browser.appThemes.v1 = { userId: "user-<id>", … }
  () => {
    const value = parseLocalStorageJson('codex.browser.appThemes.v1')
    if (!value || typeof value !== 'object') return null
    return toProfileId((value as { userId?: unknown }).userId)
  },
]

function getProfileIdFromLocalStorage(): string | null {
  for (const source of localStorageSources) {
    const id = source()
    if (id) return id
  }
  return null
}

// Last resort, independent of localStorage layout: the session endpoint the
// ChatGPT web app itself uses, which returns { user: { id: "user-<id>" } }.
async function getProfileIdFromSession(): Promise<string | null> {
  try {
    // Absolute URL: Firefox content scripts don't resolve relative fetches
    // against the page
    const response = await fetch(`${location.origin}/api/auth/session`, {
      credentials: 'include',
    })
    if (!response.ok) return null
    const session = (await response.json()) as { user?: { id?: unknown } }
    return toProfileId(session.user?.id)
  } catch {
    return null
  }
}

let profileIdPromise: Promise<string> | null = null

/**
 * Retrieves the ChatGPT user ID, waiting until ChatGPT has made it available.
 * Never rejects; warns in the console if no source has produced an ID for a
 * while, since that usually means ChatGPT changed where it keeps it.
 * @returns Promise that resolves to the user's profile ID string
 */
export default function getProfileId(): Promise<string> {
  profileIdPromise ??= new Promise<string>(resolve => {
    const startedAt = Date.now()
    let triedSession = false
    let warned = false
    let done = false

    const finish = (id: string) => {
      if (done) return
      done = true
      clearInterval(interval)
      resolve(id)
    }

    const poll = () => {
      const id = getProfileIdFromLocalStorage()
      if (id) return finish(id)

      const elapsed = Date.now() - startedAt
      if (!triedSession && elapsed >= SESSION_FALLBACK_AFTER_MS) {
        triedSession = true
        getProfileIdFromSession().then(sessionId => {
          if (sessionId) finish(sessionId)
        })
      }
      if (!warned && elapsed >= WARN_AFTER_MS) {
        warned = true
        console.warn(
          '[PinFlux] Could not find the ChatGPT user ID in localStorage or ' +
            '/api/auth/session. Pinned chats and bookmarks will not load ' +
            'until it appears.'
        )
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL_MS)
    poll()
  })
  return profileIdPromise
}
