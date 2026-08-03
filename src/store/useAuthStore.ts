import { create } from 'zustand'

/**
 * ─────────────────────────────────────────────────────────────────
 *  TEMPORARY DEVELOPMENT AUTHENTICATION
 * ─────────────────────────────────────────────────────────────────
 *  This store validates a hardcoded credential pair entirely in the
 *  browser. There is no backend, no token, and no server-side check —
 *  anyone reading the bundle can read the password below.
 *
 *  It exists so the app can be navigated and demoed before the API is
 *  available. BEFORE PRODUCTION RELEASE this whole module must be
 *  replaced by a real flow:
 *
 *    - POST credentials to the auth endpoint (see src/services/api.ts)
 *    - keep the access token in memory, refresh token in an
 *      httpOnly cookie — not in localStorage
 *    - derive `isAuthenticated` from token validity, not from the
 *      presence of a localStorage entry
 *    - handle expiry, refresh, and 401 interception
 * ─────────────────────────────────────────────────────────────────
 */

export const OPTIMA_AUTH_STORAGE_KEY = 'optima-auth'

interface AuthSession {
  phoneNumber: string
  name: string
  role: string
  authenticatedAt: string
}

interface AuthState {
  session: AuthSession | null
  isAuthenticated: boolean
  login: (phoneNumber: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>
  logout: () => void
}

/** TEMPORARY — development-only credential. Replace with backend API auth. */
const DEVELOPMENT_CREDENTIAL = {
  phoneNumber: '0811223344',
  password: 'teraoptima500',
}

/** Mimics network latency so the loading state is exercised in development. */
const FAKE_LATENCY_MS = 850

const isSession = (value: unknown): value is AuthSession =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as AuthSession).phoneNumber === 'string' &&
  typeof (value as AuthSession).authenticatedAt === 'string'

const readSession = (): AuthSession | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(OPTIMA_AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    // A malformed entry must not count as a session, otherwise hand-editing
    // localStorage to `{}` would read as authenticated.
    if (!isSession(parsed)) {
      window.localStorage.removeItem(OPTIMA_AUTH_STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    window.localStorage.removeItem(OPTIMA_AUTH_STORAGE_KEY)
    return null
  }
}

const writeSession = (session: AuthSession) => {
  window.localStorage.setItem(OPTIMA_AUTH_STORAGE_KEY, JSON.stringify(session))
}

const clearSession = () => {
  window.localStorage.removeItem(OPTIMA_AUTH_STORAGE_KEY)
}

export const useAuthStore = create<AuthState>((set) => {
  // Read once at module init so a refresh restores the session before the
  // first render — ProtectedRoute then never flashes the login screen.
  const initialSession = readSession()

  return {
    session: initialSession,
    isAuthenticated: Boolean(initialSession),

    login: async (phoneNumber, password) => {
      await new Promise((resolve) => window.setTimeout(resolve, FAKE_LATENCY_MS))

      if (phoneNumber !== DEVELOPMENT_CREDENTIAL.phoneNumber || password !== DEVELOPMENT_CREDENTIAL.password) {
        return { ok: false, message: 'Invalid phone number or password.' }
      }

      const session: AuthSession = {
        phoneNumber,
        name: 'Optima User',
        role: 'Analytics Workspace',
        authenticatedAt: new Date().toISOString(),
      }

      writeSession(session)
      set({ session, isAuthenticated: true })
      return { ok: true }
    },

    logout: () => {
      clearSession()
      set({ session: null, isAuthenticated: false })
    },
  }
})
