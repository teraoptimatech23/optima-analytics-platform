import { useCallback, useEffect, useState } from 'react'

/**
 * Presentation preference stored on <html> as a data attribute, which the
 * stylesheets read. Kept out of the app stores on purpose: it drives CSS only.
 *
 * The matching attribute is also set by an inline script in index.html so the
 * first paint is already correct — this hook keeps it in sync afterwards.
 */
export function useHtmlPreference<T extends string>(
  attribute: string,
  storageKey: string,
  allowed: readonly T[],
  fallback: () => T,
) {
  const read = useCallback((): T => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored && (allowed as readonly string[]).includes(stored)) return stored as T
    } catch {
      // Storage blocked — fall through to the default.
    }
    return fallback()
  }, [allowed, fallback, storageKey])

  const [value, setValue] = useState<T>(read)

  useEffect(() => {
    document.documentElement.setAttribute(`data-${attribute}`, value)
    try {
      localStorage.setItem(storageKey, value)
    } catch {
      // The attribute above still applies for this session.
    }
  }, [attribute, storageKey, value])

  return [value, setValue] as const
}
