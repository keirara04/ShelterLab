'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ListingError({ error, reset }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') console.error('Listing error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <svg className="w-16 h-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Listing Error</h1>
          <p className="text-gray-400">This listing couldn&apos;t be loaded</p>
        </div>
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => reset()}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition touch-manipulation"
          >
            Try Again
          </button>
          <Link href="/" className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition touch-manipulation text-center">
            Browse Listings
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
