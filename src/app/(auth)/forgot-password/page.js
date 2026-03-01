'use client'

import { useState } from 'react'
import { supabase } from '@/services/supabase'
import Image from 'next/image'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) throw resetError
      setSent(true)
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.')
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
          {sent ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-14 h-14 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black mb-2 text-white">Check Your Email</h2>
              <p className="text-gray-400 text-sm mb-2">Reset link sent to:</p>
              <p className="text-blue-400 font-bold text-sm mb-6 break-all">{email}</p>
              <p className="text-gray-500 text-xs mb-6 leading-relaxed">
                Click the link in the email to set a new password. Check your spam folder if you don&apos;t see it.
              </p>
              <Link
                href="/login"
                className="block w-full py-2.5 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition text-center text-sm"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-black mb-1 text-white text-center">Reset Password</h2>
              <p className="text-gray-400 text-center text-sm mb-6">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-5 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="your@university.ac.kr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-blue-500 focus:bg-white/8 text-white placeholder-gray-600 transition disabled:opacity-50 text-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-2.5 rounded-lg font-bold text-white transition mt-4 text-sm"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <div className="my-4 flex items-center gap-2">
                <div className="h-px bg-white/10 flex-1"></div>
                <p className="text-xs text-gray-500">or</p>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>

              <p className="text-center text-gray-500 text-xs">
                Remember your password?{' '}
                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold transition">
                  Sign in
                </Link>
              </p>
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
