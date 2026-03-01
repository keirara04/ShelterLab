'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/shared/context/AuthContext'
import Image from 'next/image'
import Link from 'next/link'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect')
  const confirmed = searchParams.get('confirmed')
  const { login, isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push(redirectPath || '/')
    }
  }, [isAuthenticated, authLoading, router, redirectPath])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!formData.email || !formData.password) {
        setError('Email and password are required')
        setLoading(false)
        return
      }

      if (!formData.email.includes('@')) {
        setError('Invalid email address')
        setLoading(false)
        return
      }

      const result = await login(formData.email, formData.password)

      if (result.success) {
        router.push(redirectPath || '/')
      } else {
        setError(result.error || 'Login failed. Check your credentials.')
        setLoading(false)
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login')
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
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

        {/* Form Container */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-black mb-1 text-white text-center">Welcome Back</h2>
          <p className="text-gray-400 text-center text-sm mb-6">Sign in to your account</p>

          {confirmed && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg mb-5 text-xs">
              ✓ Email confirmed! You can now sign in.
            </div>
          )}

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
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-blue-500 focus:bg-white/8 text-white placeholder-gray-600 transition disabled:opacity-50 text-sm"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-400">Password</label>
                <Link href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition font-medium">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                placeholder="Your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-2">
            <div className="h-px bg-white/10 flex-1"></div>
            <p className="text-xs text-gray-500">or</p>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          <p className="text-center text-gray-500 text-xs">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-bold transition">
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Secured by Supabase
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <p className="text-gray-400">Loading...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
