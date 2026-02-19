'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ProfileError({ error, reset }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') console.error('Profile error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">⚠️</div>
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Profile Error</h1>
          <p className="text-gray-400">Something went wrong loading your profile</p>
        </div>
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => reset()}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition touch-manipulation"
          >
            Try Again
          </button>
          <Link href="/" className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition touch-manipulation text-center">
            Back Home
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left">
            <summary className="text-sm text-gray-400 cursor-pointer">Debug Info</summary>
            <pre className="mt-2 p-3 bg-white/5 rounded text-xs text-gray-300 overflow-auto max-h-40">{error?.stack}</pre>
          </details>
        )}
      </div>
    </div>
  )
}
