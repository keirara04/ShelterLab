'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/shared/context/AuthContext'
import { useRouter } from 'next/navigation'
import { UNIVERSITIES, UNIVERSITY_LOGOS } from '@/services/utils/constants'

export default function AuthModal({ isOpen, onClose, redirectPath = null }) {
  const router = useRouter()
  const { login, signup } = useAuth()
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showUniversityWarning, setShowUniversityWarning] = useState(false)
  const [showConfirmEmail, setShowConfirmEmail] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    university: '',
  })

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({ email: '', password: '', fullName: '', university: '' })
      setError(null)
      setMode('login')
      setShowUniversityWarning(false)
      setShowConfirmEmail(false)
    }
  }, [isOpen])

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (mode === 'login') {
      setLoading(true)
      try {
        if (!formData.email || !formData.password) {
          setError('Email and password are required')
          return
        }

        const result = await login(formData.email, formData.password)

        if (result.success) {
          onClose()
          if (redirectPath) {
            router.push(redirectPath)
          }
        } else {
          setError(result.error || 'Login failed. Check your credentials.')
        }
      } catch (err) {
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    } else {
      // Signup validation
      if (!formData.fullName || !formData.email || !formData.password || !formData.university) {
        setError('All fields are required')
        return
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
      setShowUniversityWarning(true)
    }
  }

  const handleConfirmSignup = async () => {
    setShowUniversityWarning(false)
    setLoading(true)
    try {
      const result = await signup(formData.email, formData.password, formData.fullName, formData.university)
      if (!result.success) {
        setError(result.error || 'Signup failed. Please try again.')
        setLoading(false)
      } else {
        setLoading(false)
        setShowConfirmEmail(true)
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Transparent Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md bg-linear-to-br from-gray-950 via-black to-gray-950 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-sm">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition touch-manipulation"
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className="p-8">
          {/* Pending Approval */}
          {showConfirmEmail ? (
            <div className="text-center py-6">
              <div className="text-6xl mb-4">📧</div>
              <h2 className="text-2xl font-black text-white mb-2">Check Your Email</h2>
              <p className="text-gray-400 mb-2 text-sm">Confirmation link sent to:</p>
              <p className="text-blue-400 font-bold text-sm mb-6 break-all">{formData.email}</p>
              <p className="text-gray-400 text-xs mb-6 leading-relaxed">
                Click the link to confirm your account and start buying/selling.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowConfirmEmail(false)
                    setMode('login')
                    setFormData({ email: formData.email, password: '', fullName: '', university: '' })
                  }}
                  className="w-full py-2.5 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition text-sm"
                >
                  Try Signing In
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-lg font-bold text-gray-300 bg-white/5 hover:bg-white/10 transition text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
          <>
          {/* Logo & Title */}
          <div className="text-center mb-12">
            <div className="inline-flex justify-center mb-6">
              <div className="w-16 h-16 bg-linear-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <img loading="lazy" src="/logo.svg" alt="ShelterLab" className="w-10 h-10 object-contain" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-white mb-2">
              {mode === 'login' ? 'Welcome Back!' : 'Join ShelterLab'}
            </h2>
            <p className="text-gray-400 text-sm">
              {mode === 'login'
                ? 'Sign in to view listings and connect with sellers'
                : 'Campus marketplace for buying & selling'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-5 text-xs">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
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
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={loading}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-blue-500 focus:bg-white/8 text-white placeholder-gray-600 transition disabled:opacity-50 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
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
              {loading
                ? mode === 'login'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-2">
            <div className="h-px bg-white/10 flex-1"></div>
            <p className="text-xs text-gray-500">or</p>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          {/* Toggle Mode */}
          <p className="text-center text-gray-500 text-xs">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-blue-400 hover:text-blue-300 font-bold transition"
              disabled={loading}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {/* Browse as Guest */}
          <p className="text-center text-gray-600 text-xs mt-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 transition"
            >
              Continue browsing as guest
            </button>
          </p>
          </>
          )}
        </div>
      </div>

      {/* University Lock Warning Modal */}
      {showUniversityWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 max-w-sm w-full shadow-lg">
            <div className="text-center mb-3">
              <div className="text-3xl mb-2">⚠️</div>
              <h3 className="text-lg font-black text-white mb-1">Confirm Your University</h3>
              <p className="text-gray-400 text-xs">You selected:</p>
              <p className="text-blue-400 font-bold text-sm mt-1">{UNIVERSITIES.find(u => u.id === formData.university)?.name}</p>
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
  )
}
