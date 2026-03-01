'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/services/supabase'
import Image from 'next/image'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    // Supabase sets session from the URL hash when the page loads from a reset link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setDone(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex justify-center mb-6 hover:opacity-80 transition-opacity">
            <Image src="/logo.svg" alt="ShelterLab Logo" width={64} height={64} priority />
          </Link>
          <h1 className="text-4xl font-black text-white mb-2">ShelterLab</h1>
          <p className="text-gray-400">Campus Marketplace</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          {done ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-14 h-14 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black mb-2 text-white">Password Updated</h2>
              <p className="text-gray-400 text-sm mb-6">
                Your password has been changed. Redirecting to sign in…
              </p>
              <Link
                href="/login"
                className="block w-full py-2.5 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition text-center text-sm"
              >
                Sign In Now
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-black mb-1 text-white text-center">Set New Password</h2>
              <p className="text-gray-400 text-center text-sm mb-6">Choose a strong new password.</p>

              {!sessionReady && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-3 rounded-lg mb-5 text-xs">
                  Waiting for reset session… Make sure you opened this page from the email link.
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-5 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">New Password</label>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || !sessionReady}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-blue-500 focus:bg-white/8 text-white placeholder-gray-600 transition disabled:opacity-50 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading || !sessionReady}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-blue-500 focus:bg-white/8 text-white placeholder-gray-600 transition disabled:opacity-50 text-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !sessionReady}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-2.5 rounded-lg font-bold text-white transition mt-4 text-sm"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Secured by Supabase
        </p>
      </div>
    </div>
  )
}
