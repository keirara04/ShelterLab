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
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    university: '',
  })

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' }
    let strength = 0
    if (password.length >= 6) strength++
    if (password.length >= 10) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[!@#$%^&*]/.test(password)) strength++
    
    const levels = [
      { strength: 0, label: '', color: '' },
      { strength: 1, label: 'Weak', color: 'text-red-400' },
      { strength: 2, label: 'Fair', color: 'text-orange-400' },
      { strength: 3, label: 'Good', color: 'text-yellow-400' },
      { strength: 4, label: 'Strong', color: 'text-green-400' },
      { strength: 5, label: 'Very Strong', color: 'text-green-400' },
    ]
    return levels[strength] || levels[5]
  }

  const passwordStrength = getPasswordStrength(formData.password)

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
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

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy')
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

        {showConfirmEmail ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-2xl font-black mb-2 text-white">Check Your Email</h2>
            <p className="text-gray-400 mb-2 text-sm">Confirmation link sent to:</p>
            <p className="text-blue-400 font-bold text-sm mb-6 break-all">{formData.email}</p>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              Click the link to confirm your account and start buying/selling.
            </p>
            <div className="space-y-2">
              <Link
                href="/login"
                className="block w-full py-2.5 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition text-center text-sm"
              >
                Go to Sign In
              </Link>
              <Link
                href="/"
                className="block w-full py-2.5 rounded-lg font-bold text-gray-300 bg-white/5 hover:bg-white/10 transition text-center text-sm"
              >
                Go Home
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-black mb-1 text-white text-center">Create Account</h2>
              <p className="text-gray-400 text-center text-sm mb-6">Join the marketplace</p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-5 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    disabled={loading}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-blue-500 focus:bg-white/8 text-white placeholder-gray-600 transition disabled:opacity-50 text-sm"
                    required
                  />
                </div>

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
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">University</label>
                  <select
                    value={formData.university}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                    disabled={loading}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-blue-500 focus:bg-white/8 text-white transition disabled:opacity-50 text-sm"
                    required
                  >
                    <option value="" className="bg-gray-900">Select your university</option>
                    {UNIVERSITIES.map((u) => (
                      <option key={u.id} value={u.id} className="bg-gray-900">{u.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-amber-400/80 mt-1 font-medium">Cannot be changed after signup</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">Password</label>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={loading}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-blue-500 focus:bg-white/8 text-white placeholder-gray-600 transition disabled:opacity-50 text-sm"
                    required
                  />
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-gray-500">Strength:</p>
                        <p className={`text-xs font-bold ${passwordStrength.color}`}>{passwordStrength.label}</p>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full transition-all ${
                            passwordStrength.strength === 1 ? 'bg-red-500 w-1/5' :
                            passwordStrength.strength === 2 ? 'bg-orange-500 w-2/5' :
                            passwordStrength.strength === 3 ? 'bg-yellow-500 w-3/5' :
                            passwordStrength.strength === 4 ? 'bg-green-500 w-4/5' :
                            'bg-green-500 w-full'
                          }`}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    disabled={loading}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-blue-500 focus:bg-white/8 text-white placeholder-gray-600 transition disabled:opacity-50 text-sm"
                    required
                  />
                </div>

                <div className="flex items-start gap-2 py-1.5">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    disabled={loading}
                    className="mt-1 w-4 h-4 rounded accent-blue-600 cursor-pointer disabled:opacity-50"
                    required
                  />
                  <label htmlFor="terms" className="text-xs text-gray-500 cursor-pointer leading-relaxed">
                    I agree to the{' '}
                    <Link href="/terms" target="_blank" className="text-blue-400 hover:text-blue-300 font-bold transition">
                      Terms
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" target="_blank" className="text-blue-400 hover:text-blue-300 font-bold transition">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-2.5 rounded-lg font-bold text-white transition mt-4 text-sm"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <div className="my-4 flex items-center gap-2">
                <div className="h-px bg-white/10 flex-1"></div>
                <p className="text-xs text-gray-500">or</p>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>

              <p className="text-center text-gray-500 text-xs">
                Have an account?{' '}
                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold transition">
                  Sign in
                </Link>
              </p>
            </div>

            <p className="text-center text-gray-600 text-xs mt-6">
              Secured by Supabase
            </p>
          </>
        )}

        {/* University Lock Warning Modal */}
        {showUniversityWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 max-w-sm w-full shadow-lg">
              <div className="text-center mb-3">
                <div className="text-3xl mb-2">⚠️</div>
                <h3 className="text-lg font-black text-white mb-1">Confirm Your University</h3>
                <p className="text-gray-400 text-xs">You selected:</p>
                <p className="text-blue-400 font-bold text-sm mt-1">{selectedUniversityName}</p>
              </div>
              <p className="text-gray-400 text-xs text-center mb-4">
                Your university <span className="text-white font-bold">cannot be changed</span> after signup.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowUniversityWarning(false)}
                  className="flex-1 py-2 rounded-lg font-bold text-gray-300 bg-white/5 hover:bg-white/10 transition text-sm"
                >
                  Go Back
                </button>
                <button
                  onClick={handleConfirmSignup}
                  className="flex-1 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition text-sm"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-black">
        <p className="text-gray-400">Loading...</p>
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
