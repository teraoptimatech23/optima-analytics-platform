/**
 * Deterministic sampling toolkit.
 *
 * Everything downstream draws from a single seeded stream, so the whole dataset
 * is reproducible: same seed in, byte-identical files out. There is no
 * Math.random() anywhere in the generator — draws come from parameterised
 * distributions chosen to match the shape of real F&B data (heavy-tailed
 * baskets, over-dispersed visit counts, bounded satisfaction scores).
 */

/** xoshiro128** — small, fast, and far better distributed than a plain LCG. */
export function createRng(seed = 0x5eed1e) {
  let s0 = seed >>> 0
  let s1 = (seed ^ 0x9e3779b9) >>> 0
  let s2 = (seed ^ 0x85ebca6b) >>> 0
  let s3 = (seed ^ 0xc2b2ae35) >>> 0

  const rotl = (x, k) => ((x << k) | (x >>> (32 - k))) >>> 0

  return function next() {
    const result = (Math.imul(rotl((s1 * 5) >>> 0, 7), 9) >>> 0) / 4294967296
    const t = (s1 << 9) >>> 0
    s2 = (s2 ^ s0) >>> 0
    s3 = (s3 ^ s1) >>> 0
    s1 = (s1 ^ s2) >>> 0
    s0 = (s0 ^ s3) >>> 0
    s2 = (s2 ^ t) >>> 0
    s3 = rotl(s3, 11)
    return result
  }
}

export function makeSampler(rng) {
  const uniform = (min = 0, max = 1) => min + rng() * (max - min)

  const int = (min, max) => Math.floor(uniform(min, max + 1))

  /** Box–Muller; cached spare keeps the stream advancing predictably. */
  let spare = null
  const normal = (mean = 0, sd = 1) => {
    if (spare !== null) {
      const value = spare
      spare = null
      return mean + sd * value
    }
    let u = 0
    let v = 0
    let s = 0
    do {
      u = rng() * 2 - 1
      v = rng() * 2 - 1
      s = u * u + v * v
    } while (s >= 1 || s === 0)
    const factor = Math.sqrt((-2 * Math.log(s)) / s)
    spare = v * factor
    return mean + sd * u * factor
  }

  /** Basket values and incomes are right-skewed — lognormal is the usual fit. */
  const lognormal = (mu, sigma) => Math.exp(normal(mu, sigma))

  const exponential = (lambda) => -Math.log(1 - rng()) / lambda

  const poisson = (lambda) => {
    if (lambda <= 0) return 0
    if (lambda < 30) {
      const limit = Math.exp(-lambda)
      let k = 0
      let p = 1
      do {
        k += 1
        p *= rng()
      } while (p > limit)
      return k - 1
    }
    // Normal approximation is fine this far out and avoids a long loop.
    return Math.max(0, Math.round(normal(lambda, Math.sqrt(lambda))))
  }

  /** Marsaglia–Tsang. Underpins beta, and beta underpins every 0..1 trait. */
  const gamma = (shape, scale = 1) => {
    if (shape < 1) {
      return gamma(shape + 1, scale) * Math.pow(rng(), 1 / shape)
    }
    const d = shape - 1 / 3
    const c = 1 / Math.sqrt(9 * d)
    for (;;) {
      const x = normal(0, 1)
      const v = Math.pow(1 + c * x, 3)
      if (v <= 0) continue
      const u = rng()
      if (u < 1 - 0.0331 * Math.pow(x, 4)) return d * v * scale
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * scale
    }
  }

  const beta = (alpha, betaParam) => {
    const a = gamma(alpha)
    const b = gamma(betaParam)
    return a / (a + b)
  }

  /**
   * Visit counts are over-dispersed relative to Poisson (a few very loyal
   * customers, a long tail of one-timers) — Gamma–Poisson mixture handles that.
   */
  const negBinomial = (mean, dispersion) => {
    if (mean <= 0) return 0
    const shape = dispersion
    const scale = mean / dispersion
    return poisson(gamma(shape, scale))
  }

  const bernoulli = (p) => rng() < p

  /** Weighted pick over [item, weight] pairs. */
  const choice = (pairs) => {
    let total = 0
    for (const [, weight] of pairs) total += weight
    let threshold = rng() * total
    for (const [item, weight] of pairs) {
      threshold -= weight
      if (threshold <= 0) return item
    }
    return pairs[pairs.length - 1][0]
  }

  const shuffle = (items) => {
    const copy = items.slice()
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  return { rng, uniform, int, normal, lognormal, exponential, poisson, gamma, beta, negBinomial, bernoulli, choice, shuffle }
}

export const clamp = (value, min, max) => (value < min ? min : value > max ? max : value)

/** Squashes an unbounded score into 0..1; used to turn latent traits into rates. */
export const logistic = (x) => 1 / (1 + Math.exp(-x))

export const round2 = (value) => Math.round(value * 100) / 100

/** Indonesian menu pricing lands on 500-rupiah steps. */
export const roundRupiah = (value, step = 500) => Math.round(value / step) * step
