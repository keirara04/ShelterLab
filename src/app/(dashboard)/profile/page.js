'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/context/AuthContext'
import { supabase } from '@/services/supabase'
import { UNIVERSITIES, UNIVERSITY_LOGOS } from '@/services/utils/constants'
import { Stats } from '@/shared/components/Stats'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, logout, updateProfile, refreshProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [myListings, setMyListings] = useState([])
  const [reviews, setReviews] = useState([])
  const [activeTab, setActiveTab] = useState('listings')
  const [showBadgeTooltip, setShowBadgeTooltip] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const fileInputRef = useRef(null)
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notificationError, setNotificationError] = useState(null)
  const [notificationSuccess, setNotificationSuccess] = useState(null)
  const [univEmail, setUnivEmail] = useState('')
  const [univOtpSent, setUnivOtpSent] = useState(false)
  const [univOtp, setUnivOtp] = useState('')
  const [univLoading, setUnivLoading] = useState(false)
  const [univSending, setUnivSending] = useState(false)
  const [univError, setUnivError] = useState(null)
  const [univSuccess, setUnivSuccess] = useState(null)
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_url: '',
  })

  // Pending transaction confirmations
  const [pendingTx, setPendingTx] = useState([])
  const [confirmModal, setConfirmModal] = useState(null) // transaction object
  const [confirmRating, setConfirmRating] = useState(5)
  const [confirmComment, setConfirmComment] = useState('')
  const [confirmLoading, setConfirmLoading] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: profile?.full_name || '',
        avatar_url: profile?.avatar_url || '',
      })
      fetchMyListings()
      fetchReviews()
      fetchPendingTransactions()
    }
  }, [user, profile])

  const fetchMyListings = async () => {
    if (!user) return
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
    setMyListings(data || [])
  }

  const fetchReviews = async () => {
    if (!user) return
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', user.id)
      .order('created_at', { ascending: false })
    setReviews(data || [])
  }

  const fetchPendingTransactions = async () => {
    if (!user) return
    const res = await fetch(`/api/transactions/pending?userId=${user.id}`)
    const json = await res.json()
    setPendingTx(json.transactions || [])
  }

  const handleConfirmTransaction = async () => {
    if (!confirmModal) return
    setConfirmLoading(true)
    try {
      const res = await fetch(`/api/transactions/${confirmModal.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, rating: confirmRating, comment: confirmComment }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPendingTx((prev) => prev.filter((t) => t.id !== confirmModal.id))
      setConfirmModal(null)
      setConfirmRating(5)
      setConfirmComment('')
      refreshProfile()
    } catch (err) {
      alert('Failed to confirm: ' + err.message)
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleRejectTransaction = async (txId) => {
    if (!confirm('Reject this sale? The listing will be marked as available again.')) return
    try {
      const res = await fetch(`/api/transactions/${txId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPendingTx((prev) => prev.filter((t) => t.id !== txId))
    } catch (err) {
      alert('Failed to reject: ' + err.message)
    }
  }

  const handlePushNotification = async (e) => {
    e.preventDefault()

    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      setNotificationError('Title and message are required')
      return
    }

    setNotificationLoading(true)
    setNotificationError(null)
    setNotificationSuccess(null)

    try {
      // Get current session from the imported supabase client
      let { data: { session } } = await supabase.auth.getSession()

      // If no session, try to refresh it
      if (!session) {
        const { data: refreshData } = await supabase.auth.refreshSession()
        session = refreshData?.session
      }

      // Fallback to localStorage
      if (!session) {
        try {
          const storedSession = localStorage.getItem('sb-xehylbvuqnwrgocgqelm-auth-token')
          if (storedSession) {
            const parsed = JSON.parse(storedSession)
            session = parsed.session || parsed
            
            // Try to restore the session
            if (session?.access_token && session?.refresh_token) {
              const { data: restored } = await supabase.auth.setSession({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
              })
              if (restored?.session) {
                session = restored.session
              }
            }
          }
        } catch (e) {
          console.error('Error parsing stored session:', e)
        }
      }

      if (!session || !session.access_token) {
        throw new Error('Session expired. Please log out and log back in.')
      }

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title: notificationTitle, message: notificationMessage }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to push notification')
      }

      setNotificationSuccess('Notification pushed to all users!')
      setNotificationTitle('')
      setNotificationMessage('')
    } catch (err) {
      console.error('Error:', err)
      setNotificationError(err.message || 'Failed to push notification')
    } finally {
      setNotificationLoading(false)
    }
  }

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Avatar must be under 2MB')
      return
    }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setError(null)
  }

  const removeAvatarPreview = () => {
    setAvatarFile(null)
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview)
      setAvatarPreview(null)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      let newAvatarUrl = null

      // Upload avatar first if a new file was selected
      if (avatarFile) {
        setAvatarUploading(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('Not authenticated')

        const body = new FormData()
        body.append('avatar', avatarFile)

        const res = await fetch('/api/profile/avatar', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
          body,
        })

        const data = await res.json()
        setAvatarUploading(false)

        if (!res.ok) throw new Error(data.error || 'Avatar upload failed')

        newAvatarUrl = data.avatar_url
      }

      // Update profile — include avatar_url so it doesn't get wiped
      const updates = { full_name: formData.full_name }
      if (newAvatarUrl) {
        updates.avatar_url = newAvatarUrl
      } else if (profile?.avatar_url) {
        updates.avatar_url = profile.avatar_url
      }

      const result = await updateProfile(updates)

      if (result.success) {
        setSuccess('Profile updated successfully!')
        setIsEditing(false)
        removeAvatarPreview()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || 'Failed to update profile')
      }
    } catch (err) {
      setAvatarUploading(false)
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const handleSendUnivOtp = async (e) => {
    e.preventDefault()
    setUnivError(null)
    setUnivSuccess(null)
    setUnivLoading(true)
    setUnivSending(true)
    setUnivOtpSent(true) // switch to OTP form immediately
    
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Session expired. Please refresh and try again.')
      }
      const res = await fetch('/api/verify-university-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ university_email: univEmail }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUnivSuccess('Verification code sent! Check your university email.')
    } catch (err) {
      setUnivOtpSent(false) // revert on error
      if (err.name === 'AbortError') {
        setUnivError('Request timed out. Please check your connection and try again.')
      } else {
        setUnivError(err.message || 'Failed to send code. Please try again.')
      }
    } finally {
      clearTimeout(timeoutId)
      setUnivLoading(false)
      setUnivSending(false)
    }
  }

  const handleConfirmUnivOtp = async (e) => {
    e.preventDefault()
    setUnivError(null)
    setUnivLoading(true)
    
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Session expired. Please refresh and try again.')
      }
      const res = await fetch('/api/verify-university-email/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ otp: univOtp }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await refreshProfile()
      setShowVerifyModal(false)
      // Reset modal state
      setUnivOtp('')
      setUnivOtpSent(false)
      setUnivEmail('')
    } catch (err) {
      if (err.name === 'AbortError') {
        setUnivError('Request timed out. Please check your connection and try again.')
      } else {
        setUnivError(err.message || 'Verification failed. Please try again.')
      }
    } finally {
      clearTimeout(timeoutId)
      setUnivLoading(false)
    }
  }

  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundColor: '#000000',
        }}
      >
        <div className="glass-strong rounded-3xl p-8 text-center">
          <p className="text-gray-400 mb-4">You need to be logged in</p>
          <Link href="/login" className="text-teal-400 hover:text-teal-300 font-semibold">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen pt-20 pb-16 relative"
      style={{
        backgroundColor: '#000000',
      }}
    >
      {/* Verify University Email Modal */}
      {showVerifyModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowVerifyModal(false)}
        >
          <div
            className="rounded-2xl p-6 w-80 max-w-[92vw]"
            style={{
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.9)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <img src="/BadgeIcon.svg" alt="" width={20} height={20} className="w-5 h-5 object-contain" />
                <h2 className="text-white font-bold text-base">Verify Student Email</h2>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white transition-colors cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {univError && <p className="text-red-400 text-sm mb-3">{univError}</p>}

            {!univOtpSent ? (
              <form onSubmit={handleSendUnivOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">University Email</label>
                  <input
                    type="email"
                    value={univEmail}
                    onChange={(e) => setUnivEmail(e.target.value)}
                    placeholder="yourname@university.ac.kr"
                    required
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none placeholder-gray-600"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <p className="text-gray-600 text-xs mt-1.5">Must use @university.ac.kr or another approved domain by University. Ensure you are using desktop version to verify your profile</p>
                </div>
                <button
                  type="submit"
                  disabled={univLoading}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
                  style={{ background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.25)', color: '#2dd4bf' }}
                >
                  {univLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmUnivOtp} className="space-y-4">
                {univSending && (
                  <div className="text-center py-4">
                    <div className="inline-block w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-gray-500 text-xs animate-pulse">Sending code to your university email...</p>
                    <button
                      type="button"
                      onClick={() => { setUnivSending(false); setUnivOtpSent(false); setUnivLoading(false) }}
                      className="mt-3 text-xs text-gray-600 hover:text-gray-400 underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {univSuccess && <p className="text-emerald-400 text-sm text-center">{univSuccess}</p>}
                {!univSending && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">8-Digit Code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={8}
                        value={univOtp}
                        onChange={(e) => setUnivOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="12345678"
                        required
                        disabled={univLoading}
                        autoComplete="one-time-code"
                        className="w-full px-4 py-3.5 rounded-xl text-white text-lg outline-none placeholder-gray-600 tracking-[0.3em] font-mono text-center disabled:opacity-40"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <p className="text-gray-600 text-xs mt-1.5 text-center">Check your university inbox for the code</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={univLoading || univOtp.length !== 8}
                        className="flex-1 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.25)', color: '#2dd4bf' }}
                      >
                        {univLoading ? (
                          <>
                            <span className="inline-block w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></span>
                            <span>Verifying...</span>
                          </>
                        ) : 'Confirm'}
                      </button>
                      <button
                        type="button"
                        disabled={univLoading}
                        onClick={() => { setUnivOtpSent(false); setUnivOtp(''); setUnivError(null); setUnivSuccess(null) }}
                        className="px-4 py-3 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors cursor-pointer disabled:opacity-50"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        Back
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Badge Modal — hoisted outside all overflow/filter containers */}
      {showBadgeTooltip && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setShowBadgeTooltip(false)}
        >
          <div
            className="rounded-2xl p-6 w-72 max-w-[88vw]"
            style={{
              background: '#000000',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <img src="/BadgeIcon.svg" alt="" width={28} height={28} className="w-7 h-7 object-contain" />
              <p className="text-white font-bold text-base">Verified Student</p>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              This user is a verified student at their registered university.
            </p>
            <button
              onClick={() => setShowBadgeTooltip(false)}
              className="mt-5 w-full py-2 rounded-xl text-sm font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 relative z-10">

        {/* Success toast */}
        {success && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-2xl px-6 py-3 font-semibold shadow-lg text-emerald-400" style={{ borderColor: 'rgba(16,185,129,0.25)' }}>
            {success}
          </div>
        )}

        {/* Profile Header Card */}
        <div className="glass-strong rounded-3xl p-8 mb-6 relative overflow-hidden">
          {/* Inner gradient shimmer */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-teal-500/5 rounded-3xl pointer-events-none" />

          {/* Card action buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200"
              style={{
                background: isEditing ? 'rgba(45, 212, 191, 0.15)' : 'rgba(255,255,255,0.06)',
                border: isEditing ? '1px solid rgba(45, 212, 191, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                color: isEditing ? '#2dd4bf' : '#9ca3af',
              }}
              title={isEditing ? 'Cancel' : 'Edit Profile'}
            >
              {isEditing ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200 text-gray-500 hover:text-red-400"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              title="Log Out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          <div className="relative flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="avatar-glow rounded-full">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    width={112}
                    height={112}
                    className="w-28 h-28 rounded-full object-cover ring-4 ring-teal-500/30"
                  />
                ) : (
                  <div className="w-28 h-28 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-4xl font-black text-white ring-4 ring-teal-500/30">
                    {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Name + Email + Buttons */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                <h1 className="text-3xl font-black text-white">
                  {profile?.full_name || user?.email || 'User'}
                </h1>
                {profile?.university_email_verified && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowBadgeTooltip(true) }}
                    className="cursor-pointer flex items-center"
                  >
                    <img src="/BadgeIcon.svg" alt="Verified Student" width={24} height={24} className="w-6 h-6 object-contain" />
                  </button>
                )}
              </div>
              {profile?.university && (
                <p className="text-teal-400 text-sm font-bold mt-1 mb-1 flex items-center gap-1.5 justify-center md:justify-start">
                  <img src={UNIVERSITY_LOGOS[profile.university]} alt="" width={18} height={18} className="w-4.5 h-4.5 object-contain rounded-full" />
                  {UNIVERSITIES.find(u => u.id === profile.university)?.name || profile.university}
                </p>
              )}
              {!profile?.university_email_verified && (
                <button
                  onClick={() => { setUnivError(null); setUnivSuccess(null); setShowVerifyModal(true) }}
                  className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer"
                  style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)', color: '#5eead4' }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Get Verified
                </button>
              )}
            </div>
          </div>

          {/* Edit Form (collapsible) */}
          {isEditing && (
            <form onSubmit={handleSubmit} className="mt-8 pt-6 space-y-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {error && (
                <div className="glass rounded-xl p-4 text-red-400 font-medium text-sm" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}

              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3">Profile Picture</label>
                <div className="flex items-center gap-5">
                  {/* Preview */}
                  <div className="relative shrink-0">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Preview"
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-full object-cover ring-2 ring-teal-500/40"
                      />
                    ) : profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-full object-cover ring-2 ring-white/10"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-2xl font-black text-white ring-2 ring-white/10">
                        {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={removeAvatarPreview}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer"
                        style={{ background: 'rgba(239,68,68,0.8)' }}
                      >
                        {'\u2715'}
                      </button>
                    )}
                  </div>

                  {/* Upload button + info */}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarSelect}
                      className="hidden"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer text-teal-400 disabled:opacity-50"
                      style={{
                        background: 'rgba(45, 212, 191, 0.1)',
                        border: '1px solid rgba(45, 212, 191, 0.25)',
                      }}
                    >
                      {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      JPEG, PNG, or WebP. Max 2MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none transition-all duration-200 placeholder-gray-500"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  placeholder="Enter your name"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || avatarUploading}
                className="w-full py-3 rounded-xl font-bold text-white transition-all duration-200 disabled:opacity-50 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                {avatarUploading ? 'Uploading avatar...' : loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}
        </div>

        {/* Stats Bar */}
        <div className="mb-6">
          <Stats
            listingsCount={myListings.length}
            trustScore={profile?.trust_score || 0}
            reviewsCount={reviews.length}
            rating={averageRating}
          />
        </div>

        {/* Pending Confirmations */}
        {pendingTx.length > 0 && (
          <div className="mb-6 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(251,191,36,0.25)', background: 'rgba(251,191,36,0.05)' }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'rgba(251,191,36,0.15)' }}>
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <p className="text-yellow-400 font-black text-sm">
                {pendingTx.length} Pending Confirmation{pendingTx.length > 1 ? 's' : ''}
              </p>
              <p className="text-yellow-400/50 text-xs ml-auto">Did you buy these items?</p>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {pendingTx.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  {tx.listing?.image_urls?.[0] && (
                    <img src={tx.listing.image_urls[0]} alt={tx.listing.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold line-clamp-1">{tx.listing?.title}</p>
                    <p className="text-gray-500 text-xs">
                      from <span className="text-gray-400">{tx.seller?.full_name}</span> · ₩{tx.listing?.price?.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => { setConfirmModal(tx); setConfirmRating(5); setConfirmComment('') }}
                      className="px-3 py-1.5 rounded-lg text-xs font-black text-white transition"
                      style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}
                    >
                      Yes, confirm
                    </button>
                    <button
                      onClick={() => handleRejectTransaction(tx.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 transition hover:bg-red-500/10"
                      style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      Not me
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="glass rounded-2xl p-1.5 flex gap-1 mb-6">
          <button
            onClick={() => setActiveTab('listings')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'listings'
                ? 'text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            style={activeTab === 'listings' ? { background: 'rgba(255,255,255,0.1)' } : {}}
          >
            My Listings ({myListings.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'reviews'
                ? 'text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            style={activeTab === 'reviews' ? { background: 'rgba(255,255,255,0.1)' } : {}}
          >
            Reviews ({reviews.length})
          </button>
          {user?.email === 'keiratestaccount@yahoo.com' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                activeTab === 'admin'
                  ? 'text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              style={activeTab === 'admin' ? { background: 'rgba(59, 130, 246, 0.3)' } : {}}
            >
              🔐 Admin
            </button>
          )}
        </div>

        {/* Listings Tab */}
        {activeTab === 'listings' && (
          <div>
            <div className="mb-6">
              <div className="flex flex-col md:flex-row gap-2">
                <Link
                  href="/my-listings"
                  className="px-4 py-2 rounded-xl font-bold text-sm text-white bg-white/10 hover:bg-white/20 transition-all duration-200 text-center"
                >
                  View All
                </Link>
                <Link
                  href="/my-sold-items"
                  className="px-4 py-2 rounded-xl font-bold text-sm text-white bg-white/10 hover:bg-white/20 transition-all duration-200 text-center"
                >
                  Sold Items
                </Link>
                <Link
                  href="/sell"
                  className="px-4 py-2 rounded-xl font-bold text-sm text-white transition-all duration-200 text-center"
                  style={{ background: 'linear-gradient(135deg, #14b8a6, #06b6d4)' }}
                >
                  + New Listing
                </Link>
              </div>
            </div>

            <h2 className="text-lg font-black text-white mb-4">Recent Items</h2>

            {myListings.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center">
                <div className="text-4xl mb-3 opacity-30">
                  &#x1f4e6;
                </div>
                <p className="text-gray-400 font-medium">No listings yet</p>
                <p className="text-gray-500 text-sm mt-1">Create your first listing to start selling</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myListings.slice(0, 3).map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listing/${listing.id}`}
                    className="glass glass-card block rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-4">
                      {listing.image_urls?.[0] ? (
                        <img
                          src={listing.image_urls[0]}
                          alt={listing.title}
                          width={56}
                          height={56}
                          className="w-14 h-14 rounded-xl object-cover ring-1 ring-white/10"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-800/40 to-cyan-800/40 flex items-center justify-center">
                          <span className="text-gray-500 text-xs">No img</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate">{listing.title}</h3>
                        <p className="text-emerald-400 font-bold text-sm">{'\u20A9'}{Number(listing.price).toLocaleString()}</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                        listing.is_sold
                          ? 'bg-gray-700/50 text-gray-400'
                          : 'bg-emerald-500/15 text-emerald-400'
                      }`}>
                        {listing.is_sold ? 'Sold' : 'Active'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-lg font-black text-white mb-4">Reviews</h2>

            {reviews.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center">
                <div className="text-4xl mb-3 opacity-30">
                  &#x2B50;
                </div>
                <p className="text-gray-400 font-medium">No reviews yet</p>
                <p className="text-gray-500 text-sm mt-1">Reviews from buyers will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="glass rounded-2xl p-5"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                          ?
                        </div>
                        <span className="font-bold text-gray-300 text-sm">Anonymous</span>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`text-sm ${i < review.rating ? 'text-amber-400' : 'text-gray-600'}`}>
                            {'\u2605'}
                          </span>
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-300 text-sm leading-relaxed pl-10">
                        &ldquo;{review.comment}&rdquo;
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2 pl-10">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin Tab */}
        {activeTab === 'admin' && user?.email === 'keiratestaccount@yahoo.com' && (
          <div>
            <h2 className="text-lg font-black text-white mb-4">🔐 Admin Controls</h2>
            
            {/* Manage Approved Users Card */}
            <AdminApprovedUsers />

            {/* Push Notifications Card */}
            <div className="glass rounded-2xl p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-black text-white mb-1">🔔 Push Notifications</h3>
                  <p className="text-sm text-gray-400">Send notifications to all users</p>
                </div>
              </div>

              {notificationError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm mb-4">
                  {notificationError}
                </div>
              )}

              {notificationSuccess && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-green-400 text-sm mb-4">
                  ✓ {notificationSuccess}
                </div>
              )}

              <form onSubmit={handlePushNotification} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    placeholder="e.g., New Features Available"
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                    disabled={notificationLoading}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:bg-white/15 transition disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Message</label>
                  <textarea
                    placeholder="e.g., Check out our latest features and bug fixes..."
                    rows={4}
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    disabled={notificationLoading}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:bg-white/15 transition resize-none disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={notificationLoading}
                  className="w-full px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-all duration-200"
                >
                  {notificationLoading ? 'Pushing...' : 'Push Notification to All Users'}
                </button>
              </form>

              <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-white/10">
                💡 Only one notification can be active at a time. Pushing a new notification will replace the previous one.
              </p>
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="mt-10 text-center">
          <Link
            href="/"
            className="text-teal-400 hover:text-teal-300 font-bold text-sm transition-colors"
          >
            {'\u2190'} Back to Marketplace
          </Link>
          <p className="text-gray-600 text-xs mt-3">
            Wrong university?{' '}
            <a href="mailto:admin@shelterlab.shop" className="text-gray-500 hover:text-gray-400 transition">
              Contact admin@shelterlab.shop
            </a>
          </p>
        </div>
      </div>

      {/* Confirm Transaction Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'rgba(18,24,39,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <h2 className="text-xl font-black text-white mb-1">Confirm Purchase</h2>
            <p className="text-gray-400 text-sm mb-5">Leave a review for the seller to complete the sale and update trust scores.</p>
            <div className="flex items-center gap-3 mb-5 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {confirmModal.listing?.image_urls?.[0] && (
                <img src={confirmModal.listing.image_urls[0]} alt={confirmModal.listing.title} className="w-12 h-12 rounded-lg object-cover" />
              )}
              <div>
                <p className="text-white font-bold text-sm line-clamp-1">{confirmModal.listing?.title}</p>
                <p className="text-gray-400 text-xs">Sold by {confirmModal.seller?.full_name}</p>
                <p className="text-green-400 font-black text-sm">₩{confirmModal.listing?.price?.toLocaleString()}</p>
              </div>
            </div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Your Rating</label>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setConfirmRating(star)} className="text-2xl transition-transform hover:scale-110">
                  {star <= confirmRating ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Review (optional)</label>
            <textarea
              value={confirmComment}
              onChange={(e) => setConfirmComment(e.target.value)}
              placeholder="How was the transaction? Was the item as described?"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 resize-none mb-4"
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={handleConfirmTransaction}
                disabled={confirmLoading}
                className="w-full py-3 rounded-xl font-black text-sm text-white transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
              >
                {confirmLoading ? 'Confirming...' : 'Confirm & Submit Review'}
              </button>
              <button onClick={() => setConfirmModal(null)} disabled={confirmLoading} className="w-full py-2 rounded-xl font-bold text-xs text-gray-600 hover:text-gray-400 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminApprovedUsers() {
  const [allUsers, setAllUsers] = useState([])
  const [newSignups, setNewSignups] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchAllUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/approved-users?includeAll=true')
      const result = await response.json()
      if (response.ok && result.success) {
        setAllUsers(result.data || [])
      } else {
        setError(result.error || 'Failed to fetch users')
      }
    } catch (err) {
      setError('Error fetching users')
    } finally {
      setLoading(false)
    }
  }

  const fetchNewSignups = async () => {
    try {
      const response = await fetch('/api/new-signups')
      const result = await response.json()
      if (response.ok && result.success) {
        setNewSignups(result.data || [])
      }
    } catch (err) {
      console.warn('Error fetching new signups')
    }
  }

  const handleAddApprovedUser = async (e) => {
    e.preventDefault()
    if (!email.trim()) return

    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/approved-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          notes: notes.trim() || null,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(`✓ ${email} approved successfully`)
        setEmail('')
        setNotes('')
        await fetchAllUsers()
      } else {
        setError(data.error || 'Failed to add approved user')
      }
    } catch (err) {
      setError('Error adding approved user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveApprovedUser = async (email) => {
    try {
      const response = await fetch('/api/approved-users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      })

      if (response.ok && (await response.json()).success) {
        setSuccess('✓ User removed from approved list')
        await fetchAllUsers()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to remove user')
      }
    } catch (err) {
      setError('Error removing user')
    }
  }

  const handleApproveUser = async (userEmail) => {
    try {
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/approved-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail.toLowerCase(),
          notes: null,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(`✓ ${userEmail} approved successfully`)
        await fetchAllUsers()
      } else {
        setError(data.error || 'Failed to approve user')
      }
    } catch (err) {
      setError('Error approving user')
    }
  }

  const handleGrantBadge = async (userId, grant) => {
    try {
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/admin/grant-badge', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, grant }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(`✓ Badge ${grant ? 'granted' : 'revoked'} successfully`)
        await fetchAllUsers()
      } else {
        setError(data.error || 'Failed to update badge')
      }
    } catch (err) {
      setError('Error updating badge')
    }
  }

  useEffect(() => {
    fetchAllUsers()
    fetchNewSignups()
  }, [])

  return (
    <div className="space-y-6">
      {/* New Signups Notification */}
      {newSignups.length > 0 && (
        <div className="glass rounded-2xl p-6 border-l-4 border-orange-500">
          <h3 className="text-xl font-black text-white mb-4">🔔 New Signups ({newSignups.length})</h3>
          <p className="text-gray-400 text-sm mb-4">Users who clicked their confirmation email</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {newSignups.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border border-orange-500/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{user.email}</p>
                  {user.full_name && (
                    <p className="text-gray-400 text-xs mt-1">{user.full_name}</p>
                  )}
                </div>
                <button
                  onClick={() => handleApproveUser(user.email)}
                  className="ml-2 px-3 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/40 text-green-400 hover:text-green-300 font-bold transition-all duration-200 text-xs whitespace-nowrap"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Users Management */}
      <div className="glass rounded-2xl p-6 mb-6">
      <h3 className="text-xl font-black text-white mb-4">👥 Manage User Access</h3>
      <p className="text-sm text-gray-400 mb-6">Approve or reject new signups</p>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-400 text-sm mb-4">
          {success}
        </div>
      )}

      {/* All Users List */}
      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : allUsers.length === 0 ? (
        <div className="text-gray-400 text-sm">No users yet</div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {allUsers.map((user) => (
            <div
              key={user.id}
              className={`flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 rounded-lg border ${
                user.status === 'approved'
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-yellow-500/10 border-yellow-500/30'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 gap-1">
                  <p className="text-white font-medium text-sm truncate">{user.email}</p>
                  <span className={`text-xs px-2 py-1 rounded w-fit ${
                    user.status === 'approved'
                      ? 'bg-green-500/30 text-green-400'
                      : 'bg-yellow-500/30 text-yellow-400'
                  }`}>
                    {user.status === 'approved' ? '✓ Approved' : '⏳ Pending'}
                  </span>
                </div>
                {user.full_name && (
                  <p className="text-gray-400 text-xs mt-1">{user.full_name}</p>
                )}
              </div>
              <div className="flex gap-2">
                {user.status === 'pending' && (
                  <button
                    onClick={() => handleApproveUser(user.email)}
                    className="flex-1 md:flex-none px-3 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/40 text-green-400 hover:text-green-300 font-bold transition-all duration-200 text-xs whitespace-nowrap"
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() => handleGrantBadge(user.id, !user.university_email_verified)}
                  className={`flex-1 md:flex-none px-3 py-2 rounded-lg font-bold transition-all duration-200 text-xs whitespace-nowrap flex items-center gap-1 ${
                    user.university_email_verified
                      ? 'bg-teal-600/20 hover:bg-red-600/20 text-teal-400 hover:text-red-400'
                      : 'bg-white/5 hover:bg-teal-600/20 text-gray-500 hover:text-teal-400'
                  }`}
                  title={user.university_email_verified ? 'Revoke badge' : 'Grant badge'}
                >
                  <img src="/BadgeIcon.svg" alt="" className="w-3 h-3" />
                  {user.university_email_verified ? 'Revoke' : 'Badge'}
                </button>
                {user.status === 'approved' && (
                  <button
                    onClick={() => handleRemoveApprovedUser(user.email)}
                    className="flex-1 md:flex-none px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 font-bold transition-all duration-200 text-xs whitespace-nowrap"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
