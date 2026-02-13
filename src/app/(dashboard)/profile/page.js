'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { UNIVERSITIES } from '@/lib/constants'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, logout, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [myListings, setMyListings] = useState([])
  const [reviews, setReviews] = useState([])
  const [activeTab, setActiveTab] = useState('listings')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_url: '',
  })

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
              <h1 className="text-3xl font-black text-white mb-1">
                {profile?.full_name || user?.email || 'User'}
              </h1>
              {profile?.university && (
                <p className="text-teal-400 text-sm font-bold mt-1 mb-1">
                  🎓 {UNIVERSITIES.find(u => u.id === profile.university)?.name || profile.university}
                </p>
              )}
              <p className="text-gray-500 text-xs mb-4">
                Wrong university?{' '}
                <a href="mailto:admin@shelterlab.shop" className="text-blue-400 hover:text-blue-300 transition">
                  Contact admin@shelterlab.shop
                </a>
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer"
                  style={{
                    background: isEditing
                      ? 'rgba(45, 212, 191, 0.1)'
                      : 'linear-gradient(135deg, #14b8a6, #06b6d4)',
                    color: isEditing ? '#2dd4bf' : '#fff',
                    border: isEditing ? '1px solid rgba(45, 212, 191, 0.3)' : 'none',
                  }}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2.5 glass rounded-xl font-bold text-sm text-gray-400 hover:text-red-400 transition-all duration-200 cursor-pointer"
                >
                  Log Out
                </button>
              </div>
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
        <div className="glass-strong rounded-2xl p-4 mb-6 flex items-center justify-around">
          <div className="text-center px-4">
            <p className="text-2xl font-black text-white">{myListings.length}</p>
            <p className="text-xs text-teal-400 font-bold uppercase tracking-wider">Listings</p>
          </div>
          <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="text-center px-4">
            <p className="text-2xl font-black text-white">{profile?.trust_score || 0}</p>
            <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Trust</p>
          </div>
          <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="text-center px-4">
            <p className="text-2xl font-black text-white">{reviews.length}</p>
            <p className="text-xs text-violet-400 font-bold uppercase tracking-wider">Reviews</p>
          </div>
          {averageRating && (
            <>
              <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="text-center px-4">
                <p className="text-2xl font-black text-white">{averageRating}</p>
                <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">Rating</p>
              </div>
            </>
          )}
        </div>

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

        {/* Back link */}
        <div className="mt-10 text-center">
          <Link
            href="/"
            className="text-teal-400 hover:text-teal-300 font-bold text-sm transition-colors"
          >
            {'\u2190'} Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  )
}
