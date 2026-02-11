'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { UNIVERSITIES, UNIVERSITY_LOGOS } from '@/lib/constants'

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
          setLoading(false)
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
          setLoading(false)
        }
      } catch (err) {
        setError(err.message || 'An error occurred')
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
      <div className="relative z-10 w-full max-w-md bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 border border-white/20 rounded-2xl shadow-2xl animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition touch-manipulation"
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className="p-6 sm:p-8">
          {/* Email Confirmation Success */}
          {showConfirmEmail ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-2xl font-black text-white mb-3">Check Your Email!</h2>
              <p className="text-gray-300 mb-2">
                We sent a confirmation link to:
              </p>
              <p className="text-blue-400 font-bold mb-6">{formData.email}</p>
              <p className="text-gray-400 text-sm mb-6">
                Click the link in your email to verify your account. Once confirmed, you can sign in.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowConfirmEmail(false)
                    setMode('login')
                    setFormData({ email: formData.email, password: '', fullName: '', university: '' })
                  }}
                  className="w-full py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition"
                >
                  Go to Sign In
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-lg font-bold text-gray-300 bg-white/10 hover:bg-white/20 transition"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
          <>
          {/* Logo & Title */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <img src="/logo.png" alt="ShelterLab" className="w-12 h-12 object-contain" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              {mode === 'login' ? 'Welcome Back!' : 'Join ShelterLab'}
            </h2>
            <p className="text-sm text-gray-400">
              {mode === 'login'
                ? 'Sign in to view listings and connect with sellers'
                : 'Create an account to start buying and selling'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-blue-500 text-white placeholder-gray-500 transition disabled:opacity-50 text-sm sm:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    University
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {UNIVERSITIES.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, university: u.id })}
                        disabled={loading}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition text-xs font-bold disabled:opacity-50 ${
                          formData.university === u.id
                            ? 'border-blue-500 bg-blue-500/20 text-white'
                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/30'
                        }`}
                      >
                        <img src={UNIVERSITY_LOGOS[u.id]} alt="" className="w-7 h-7 object-contain rounded-full" />
                        <span className="leading-tight text-center">{u.name}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-amber-400 mt-1.5 font-bold">⚠️ Cannot be changed after signup</p>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-blue-500 text-white placeholder-gray-500 transition disabled:opacity-50 text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-blue-500 text-white placeholder-gray-500 transition disabled:opacity-50 text-sm sm:text-base"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed py-3 sm:py-4 rounded-lg font-bold text-white transition mt-4 touch-manipulation text-sm sm:text-base"
            >
              {loading
                ? mode === 'login'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'login'
                ? 'Sign In'
                : 'Sign Up'}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-blue-400 hover:text-blue-300 font-bold transition"
                disabled={loading}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* Browse as Guest */}
          <div className="mt-4 text-center">
            <button
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-400 transition"
            >
              Continue browsing as guest
            </button>
          </div>
          </>
          )}
        </div>
      </div>

      {/* University Lock Warning Modal */}
      {showUniversityWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-amber-500/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-xl font-black text-white mb-2">Confirm Your University</h3>
              <p className="text-gray-300 text-sm">You selected:</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <img src={UNIVERSITY_LOGOS[formData.university]} alt="" className="w-8 h-8 object-contain rounded-full" />
                <p className="text-amber-400 font-black text-lg">
                  {UNIVERSITIES.find(u => u.id === formData.university)?.name}
                </p>
              </div>
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
