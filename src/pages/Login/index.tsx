import { useCallback, useMemo, useRef, useState } from 'react'
import type { FormEvent, PointerEvent as ReactPointerEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Moon, Phone, ShieldCheck, Sparkles, Sun, TriangleAlert } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/store/useAuthStore'
import './index.less'

interface LoginLocationState {
  from?: { pathname?: string }
}

interface Ripple {
  id: number
  x: number
  y: number
}

/** Held long enough for the success state to read as confirmation, not a flicker. */
const SUCCESS_HOLD_MS = 760

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const { theme, toggleTheme } = useTheme()

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const login = useAuthStore((state) => state.login)

  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [ripples, setRipples] = useState<Ripple[]>([])

  const rippleId = useRef(0)
  const toastTimer = useRef<number | undefined>(undefined)

  const from = (location.state as LoginLocationState | null)?.from?.pathname ?? '/'
  const canSubmit = phoneNumber.trim().length > 0 && password.trim().length > 0
  const busy = status !== 'idle'

  // Static, deterministic bars — a suggestion of the dashboard behind the glass,
  // never random, so the panel looks identical on every render.
  const previewBars = useMemo(
    () => Array.from({ length: 22 }, (_, index) => 26 + ((index * 37) % 64)),
    [],
  )
  const previewCards = useMemo(
    () => [
      { label: 'Revenue Forecast', value: 'Rp1,22B', change: '+8,4%', tone: 'up' as const },
      { label: 'Active Customers', value: '12.845', change: '+3,1%', tone: 'up' as const },
      { label: 'Campaign ROAS', value: '4,18x', change: 'stable', tone: 'flat' as const },
    ],
    [],
  )

  const showToast = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = window.setTimeout(() => setToast(''), 2600)
  }, [])

  const spawnRipple = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (reduceMotion) return
    const rect = event.currentTarget.getBoundingClientRect()
    const id = (rippleId.current += 1)
    setRipples((current) => [...current, { id, x: event.clientX - rect.left, y: event.clientY - rect.top }])
    window.setTimeout(() => {
      setRipples((current) => current.filter((item) => item.id !== id))
    }, 620)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit || busy) return

    setError('')
    setStatus('loading')

    const result = await login(phoneNumber.trim(), password)

    if (!result.ok) {
      setStatus('idle')
      setError(result.message)
      showToast(result.message)
      return
    }

    // Success is staged: the card settles into its confirmed state, then the
    // route swaps — so the dashboard's PageTransition picks up a calm surface
    // rather than cutting away mid-spinner.
    setStatus('success')
    window.setTimeout(() => navigate(from, { replace: true }), reduceMotion ? 0 : SUCCESS_HOLD_MS)
  }

  // Placed after the hooks so hook order stays stable across renders.
  if (isAuthenticated && status === 'idle') {
    return <Navigate to="/" replace />
  }

  return (
    <main className="login-page">
      {/* Aurora + mesh + drifting glass shards, all CSS — no images, no video.
          The shards are what the card refracts, so the blur has something to
          bend; without them the "glass" reads as flat translucency. */}
      <div className="login-page__scene" aria-hidden="true">
        <span className="login-page__aurora login-page__aurora--indigo" />
        <span className="login-page__aurora login-page__aurora--cyan" />
        <span className="login-page__aurora login-page__aurora--violet" />
        <span className="login-page__aurora login-page__aurora--ember" />
        <span className="login-page__mesh" />
        <span className="login-page__shard login-page__shard--one" />
        <span className="login-page__shard login-page__shard--two" />
        <span className="login-page__shard login-page__shard--three" />
        <span className="login-page__grain" />
      </div>

      <button
        className="login-theme-toggle"
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Gunakan tema terang' : 'Gunakan tema gelap'}
      >
        {theme === 'dark' ? <Sun size={17} strokeWidth={1.9} /> : <Moon size={17} strokeWidth={1.9} />}
      </button>

      <motion.section
        className="login-shell"
        data-status={status}
        initial={reduceMotion ? false : { opacity: 0, y: 22, scale: 0.985, filter: 'blur(10px)' }}
        animate={
          status === 'success' && !reduceMotion
            ? { opacity: 0, y: -10, scale: 1.015, filter: 'blur(6px)' }
            : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
        }
        transition={{
          duration: status === 'success' ? 0.5 : 0.55,
          ease: [0.22, 1, 0.36, 1],
          delay: status === 'success' ? 0.24 : 0,
        }}
      >
        <section className="login-card" aria-labelledby="login-title">
          <span className="login-card__sheen" aria-hidden="true" />
          <span className="login-card__rim" aria-hidden="true" />
          <span className="login-card__caustic" aria-hidden="true" />

          <header className="login-card__head">
            <div className="login-brand">
              <span className="login-brand__mark">
                <img src="/assets/optima-logo.png" alt="Optima Analytics Platform" />
              </span>
              <span className="login-brand__name">
                <strong>OPTIMA</strong>
                <small>Analytics Platform</small>
              </span>
            </div>

            <p className="login-card__eyebrow">
              <Sparkles size={13} strokeWidth={2.2} aria-hidden="true" />
              Enterprise Intelligence Workspace
            </p>

            <h1 id="login-title">Welcome Back</h1>
            <p className="login-card__lede">Sign in to continue accessing your analytics workspace.</p>
          </header>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-field">
              <span className="login-field__icon" aria-hidden="true">
                <Phone size={17} strokeWidth={1.9} />
              </span>
              <input
                id="login-phone"
                className="login-field__input"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder=" "
                value={phoneNumber}
                disabled={busy}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'login-error' : undefined}
                onChange={(event) => {
                  setPhoneNumber(event.target.value)
                  if (error) setError('')
                }}
              />
              <label className="login-field__label" htmlFor="login-phone">
                Phone Number
              </label>
              <span className="login-field__hint" aria-hidden="true">
                Enter phone number
              </span>
            </div>

            <div className="login-field login-field--password">
              <span className="login-field__icon" aria-hidden="true">
                <LockKeyhole size={17} strokeWidth={1.9} />
              </span>
              <input
                id="login-password"
                className="login-field__input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder=" "
                value={password}
                disabled={busy}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'login-error' : undefined}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (error) setError('')
                }}
              />
              <label className="login-field__label" htmlFor="login-password">
                Password
              </label>
              <span className="login-field__hint" aria-hidden="true">
                Enter password
              </span>
              <button
                className="login-field__toggle"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={16} strokeWidth={1.9} /> : <Eye size={16} strokeWidth={1.9} />}
              </button>
            </div>

            <div className="login-form__meta">
              <label className="login-check">
                <input
                  type="checkbox"
                  checked={remember}
                  disabled={busy}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span className="login-check__box" aria-hidden="true" />
                Remember Me
              </label>

              <button
                className="login-form__forgot"
                type="button"
                onClick={() => showToast('Feature coming soon.')}
              >
                Forgot Password?
              </button>
            </div>

            <AnimatePresence initial={false}>
              {error && (
                <motion.p
                  className="login-inline-error"
                  id="login-error"
                  role="alert"
                  key="login-error"
                  initial={reduceMotion ? false : { opacity: 0, height: 0, marginTop: -6 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, marginTop: -6 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  <TriangleAlert size={15} strokeWidth={2} aria-hidden="true" />
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              className="login-submit"
              type="submit"
              disabled={!canSubmit || busy}
              data-status={status}
              onPointerDown={spawnRipple}
              aria-busy={status === 'loading'}
            >
              <span className="login-submit__label">
                {status === 'loading' ? 'Signing In' : status === 'success' ? 'Welcome back' : 'Sign In'}
              </span>
              {status === 'loading' && <span className="login-submit__spinner" aria-hidden="true" />}
              {status === 'idle' && <ArrowRight className="login-submit__arrow" size={17} strokeWidth={2.2} aria-hidden="true" />}
              {ripples.map((ripple) => (
                <span
                  key={ripple.id}
                  className="login-submit__ripple"
                  style={{ left: ripple.x, top: ripple.y }}
                  aria-hidden="true"
                />
              ))}
            </button>
          </form>

          <footer className="login-card__foot">© 2026 Optima Analytics Platform</footer>
        </section>

        <aside className="login-preview" aria-hidden="true">
          <span className="login-card__sheen" />
          <span className="login-card__rim" />

          <div className="login-preview__head">
            <span className="login-preview__pill">
              <ShieldCheck size={14} strokeWidth={2} />
              Secure workspace
            </span>
            <span className="login-preview__live">
              <i />
              Live Insight
            </span>
          </div>

          <div className="login-preview__graph">
            {previewBars.map((height, index) => (
              <i key={index} style={{ height: `${height}%`, animationDelay: `${index * 26}ms` }} />
            ))}
          </div>

          <div className="login-preview__cards">
            {previewCards.map((card) => (
              <article key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small data-tone={card.tone}>{card.change}</small>
              </article>
            ))}
          </div>
        </aside>
      </motion.section>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="login-toast"
            role="status"
            aria-live="polite"
            key={toast}
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
