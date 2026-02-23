'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from './BottomNav'

export default function LayoutWrapper({ children }) {
  const router = useRouter()
  const hiddenAt = useRef(null)

  useEffect(() => {
    const MIN_AWAY_MS = 10_000 // 10 seconds away triggers a refresh

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = Date.now()
      } else if (document.visibilityState === 'visible' && hiddenAt.current) {
        if (Date.now() - hiddenAt.current >= MIN_AWAY_MS) {
          router.refresh()
        }
        hiddenAt.current = null
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [router])

  return (
    <>
      <div className="pb-16 lg:pb-0">
        {children}
      </div>
      <BottomNav />
    </>
  )
}
