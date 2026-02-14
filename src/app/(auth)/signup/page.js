'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/shared/context/AuthContext'
import { UNIVERSITIES } from '@/services/utils/constants'
import Image from 'next/image'
import Link from 'next/link'

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect')
  const { signup, isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showUniversityWarning, setShowUniversityWarning] = useState(false)
  const [showConfirmEmail, setShowConfirmEmail] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    university: '',
  })

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push(redirectPath || '/')
    }
  }, [isAuthenticated, authLoading, router, redirectPath])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.full_name || !formData.email || !formData.password || !formData.confirmPassword || !formData.university) {
      setError('All fields are required')
      return
    }

    if (!formData.email.includes('@')) {
      setError('Invalid email address')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setShowUniversityWarning(true)
  }

  const handleConfirmSignup = async () => {
    setShowUniversityWarning(false)
    setLoading(true)

    try {
      const result = await signup(formData.email, formData.password, formData.full_name, formData.university)

      if (!result.success) {
        setError(result.error || 'Signup failed. Please try again.')
        setLoading(false)
      } else {
        setLoading(false)
        setShowConfirmEmail(true)
      }
    } catch (err) {
      setError(err.message || 'An error occurred during signup')
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  const selectedUniversityName = UNIVERSITIES.find(u => u.id === formData.university)?.name

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-black items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="mb-12">
            <Image src="/logo.png" alt="ShelterLab Logo" width={200} height={200} priority className="mx-auto drop-shadow-2xl" />
          </div>
          <h1 className="text-5xl font-black text-white mb-4">ShelterLab</h1>
          <p className="text-xl text-gray-300 mb-8">Student Marketplace</p>
          <p className="text-gray-400 text-lg max-w-sm">Join thousands of students buying and selling items on campus. Safe, simple, and community-driven.</p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="md:hidden text-center mb-8">
            <div className="flex justify-center mb-6">
              <Image src="/logo.png" alt="ShelterLab Logo" width={80} height={80} priority />
            </div>
            <h1 className="text-4xl font-black text-white mb-2">ShelterLab</h1>
            <p className="text-gray-400">Student Marketplace</p>
          </div>

          {showConfirmEmail ? (
            <div className="bg-white/10 border border-white/20 rounded-3xl p-8 backdrop-blur-xl text-center">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-3xl font-black mb-3 text-white">Check Your Email!</h2>
              <p className="text-gray-300 mb-2">We sent a confirmation link to:</p>
              <p className="text-blue-400 font-bold text-lg mb-6">{formData.email}</p>
              <p className="text-gray-400 text-sm mb-8">
                Click the link in your email to verify your account. Once confirmed, you can sign in.
              </p>
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block w-full py-3 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 transition text-center"
                >
                  Go to Sign In
                </Link>
                <Link
                  href="/"
                  className="block w-full py-3 rounded-xl font-bold text-gray-300 bg-white/10 hover:bg-white/20 transition text-center"
                >
                  Go Home
                </Link>
              </div>
            </div>
          ) : (
          <>
          <div className="bg-white/10 border border-white/20 rounded-3xl p-8 backdrop-blur-xl">
            <h2 className="text-3xl font-black mb-2 text-white text-center">Join Shelter</h2>
            <p className="text-gray-400 text-center mb-8">Create your account and start buying/selling</p>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-blue-500 text-white placeholder-gray-500 transition disabled:opacity-50"
                  required
                />
              </div>

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
                <label className="block text-sm font-bold text-gray-300 mb-2">University</label>
                <select
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-blue-500 text-white transition disabled:opacity-50"
                  required
                >
                  <option value="" className="bg-gray-900">Select your university</option>
                  {UNIVERSITIES.map((u) => (
                    <option key={u.id} value={u.id} className="bg-gray-900">{u.name}</option>
                  ))}
                </select>
                <p className="text-xs text-amber-400 mt-1.5 font-bold">⚠️ This cannot be changed after signup</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-blue-500 text-white placeholder-gray-500 transition disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px bg-white/10 flex-1"></div>
              <p className="text-xs text-gray-500 uppercase font-bold">or</p>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>

            <p className="text-center text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold transition">
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-center text-gray-500 text-xs mt-8">
            Protected by Supabase Authentication
          </p>
          </>
          )}
        </div>
      </div>

      {/* University Lock Warning Modal */}
      {showUniversityWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-amber-500/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-xl font-black text-white mb-2">Confirm Your University</h3>
              <p className="text-gray-300 text-sm">You selected:</p>
              <p className="text-amber-400 font-black text-lg mt-1">{selectedUniversityName}</p>
            </div>
            <p className="text-gray-400 text-sm text-center mb-6">
              Your university <span className="text-white font-bold">cannot be changed</span> after signup. Please make sure this is correct.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUniversityWarning(false)}
                className="flex-1 py-3 rounded-xl font-bold text-gray-300 bg-white/10 hover:bg-white/20 transition"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmSignup}
                className="flex-1 py-3 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                Confirm & Sign Up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <p className="text-gray-400">Loading...</p>
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
