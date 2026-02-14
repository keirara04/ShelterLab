'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@supabase/supabase-js'

export default function AdminNotificationsPage() {
  const { isAuthenticated, user } = useAuth()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const ADMIN_EMAIL = 'keiratestaccount@yahoo.com'

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      setIsAdmin(true)
    }
    setInitialized(true)
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Create Supabase client to get session
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      // Try to get the session - use onAuthStateChange as fallback
      let session = null
      
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      session = currentSession

      // If no session, try getting from localStorage directly
      if (!session) {
        try {
          const storedSession = localStorage.getItem('sb-xehylbvuqnwrgocgqelm-auth-token')
          if (storedSession) {
            const parsed = JSON.parse(storedSession)
            session = parsed.session || parsed
          }
        } catch (e) {
          console.error('Error parsing stored session:', e)
        }
      }

      if (!session || !session.access_token) {
        throw new Error('Session not found. Please log out and log back in.')
      }

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title, message }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to push notification')
      }

      setSuccess('Notification pushed to all users!')
      setTitle('')
      setMessage('')
    } catch (err) {
      console.error('Error:', err)
      setError(err.message || 'Failed to push notification')
    } finally {
      setLoading(false)
    }
  }

  if (!initialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">You must be logged in to access this page.</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">← Back to Home</Link>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Admin Only</h1>
          <p className="text-gray-400 mb-2">Current user: {user?.email}</p>
          <p className="text-gray-400 mb-6">You don't have permission to access this page.</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">← Back to Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 sticky top-0 z-50 backdrop-blur-2xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Push Notification</h1>
            <Link href="/" className="text-gray-400 hover:text-white transition">← Back</Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Admin Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-8">
          <p className="text-sm text-blue-300">
            <span className="font-bold">Admin Account:</span> {user?.email}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Notification Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., New Features Available"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:bg-white/15 transition"
            />
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Notification Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., Check out our latest features and bug fixes..."
              rows={5}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:bg-white/15 transition resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-green-400 text-sm">
              ✓ {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-all duration-200"
          >
            {loading ? 'Pushing...' : 'Push Notification to All Users'}
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-12 bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="font-bold text-white mb-3">ℹ️ How It Works</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• This notification will be displayed to all users on their next page load</li>
            <li>• Only one notification can be active at a time</li>
            <li>• Pushing a new notification will replace the previous one</li>
            <li>• Users will see a bell icon with a pulse indicator in the header</li>
            <li>• They can click it to view the notification panel</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
