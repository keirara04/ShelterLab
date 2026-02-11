'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Image from 'next/image'
import Link from 'next/link'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect')
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
        await new Promise(resolve => setTimeout(resolve, 1000))
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
    <div className="min-h-screen flex">
      {/* LEFT SIDE - LOGO & BRANDING */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-black items-center justify-center p-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center">
          <div className="mb-12">
            <Image
              src="/logo.png"
              alt="ShelterLab Logo"
              width={200}
              height={200}
              priority
              className="mx-auto drop-shadow-2xl"
            />
          </div>
          <h1 className="text-5xl font-black text-white mb-4">ShelterLab</h1>
          <p className="text-xl text-gray-300 mb-8">Student Marketplace</p>
          <p className="text-gray-400 text-lg max-w-sm">Find what you need. Leave what you don't. Buy and sell with your campus community.</p>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="md:hidden text-center mb-8">
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.png"
                alt="ShelterLab Logo"
                width={80}
                height={80}
                priority
              />
            </div>
            <h1 className="text-4xl font-black text-white mb-2">ShelterLab</h1>
            <p className="text-gray-400">Student Marketplace</p>
          </div>

          {/* Form Container */}
          <div className="bg-white/10 border border-white/20 rounded-3xl p-8 backdrop-blur-xl">
            <h2 className="text-3xl font-black mb-2 text-white text-center">Welcome Back</h2>
            <p className="text-gray-400 text-center mb-8">Sign in to your Shelter account</p>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-blue-500 text-white placeholder-gray-500 transition disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  placeholder="Your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-blue-500 text-white placeholder-gray-500 transition disabled:opacity-50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed py-3 rounded-xl font-black text-white transition mt-6"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px bg-white/10 flex-1"></div>
              <p className="text-xs text-gray-500 uppercase font-bold">or</p>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>

            <p className="text-center text-gray-400">
              Don't have an account?{' '}
              <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-bold transition">
                Sign up
              </Link>
            </p>
          </div>

          <p className="text-center text-gray-500 text-xs mt-8">
            Protected by Supabase Authentication
          </p>
        </div>
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