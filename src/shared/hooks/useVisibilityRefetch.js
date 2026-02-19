'use client'
import { useEffect, useRef } from 'react'

/**
 * Refetches data when the user returns to the tab (alt-tab / tab switch).
 * A minimum interval guard prevents hammering the DB on rapid tab switching.
 *
 * @param {() => void} refetch - Callback to run on visibility/focus restore
 * @param {{ minIntervalMs?: number }} options
 */
export function useVisibilityRefetch(refetch, { minIntervalMs = 30_000 } = {}) {
  const lastFetchedAt = useRef(Date.now())
  const refetchRef = useRef(refetch)

  // Keep ref current so the effect never needs to re-run due to refetch identity
  useEffect(() => {
    refetchRef.current = refetch
  }, [refetch])

  useEffect(() => {
    const shouldRefetch = () => Date.now() - lastFetchedAt.current >= minIntervalMs

    const run = () => {
      lastFetchedAt.current = Date.now()
      refetchRef.current()
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && shouldRefetch()) run()
    }

    const handleFocus = () => {
      if (document.visibilityState === 'visible' && shouldRefetch()) run()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
    }
  }, [minIntervalMs])
}
