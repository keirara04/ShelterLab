'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error caught by boundary:', error)
  }, [error])

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#000000' }}
    >
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error Icon */}
        <div className="text-6xl">⚠️</div>

        {/* Error Title */}
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Oops!</h1>
          <p className="text-gray-400">Something went wrong</p>
        </div>

        {/* Error Message */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-300 font-mono">
            {error?.message || 'An unexpected error occurred'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => reset()}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg transition touch-manipulation"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition touch-manipulation text-center"
          >
            Back Home
          </Link>
        </div>

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left">
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
              Debug Info
            </summary>
            <pre className="mt-2 p-3 bg-white/5 rounded text-xs text-gray-300 overflow-auto max-h-40">
              {error?.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
