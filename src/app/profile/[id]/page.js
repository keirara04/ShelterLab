'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/services/supabase'
import { useAuth } from '@/shared/context/AuthContext'
import { compressImage } from '@/services/utils/helpers'
import { SchemaScript } from '@/shared/components/SchemaScript'
import { generateProfileSchema } from '@/schema'
import { TRUST_SCORE_THRESHOLDS } from '@/services/utils/constants'
import LogoHome from '@/shared/components/LogoHome'

// ─── Constants ────────────────────────────────────────────────────────────────

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']
const MAX_COMMENT_LENGTH = 500

function getTrustTier(score) {
  if (score >= TRUST_SCORE_THRESHOLDS.POWER_USER)
    return { label: 'Power User', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)' }
  if (score >= TRUST_SCORE_THRESHOLDS.VERY_TRUSTED)
    return { label: 'Very Trusted', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)' }
  if (score >= TRUST_SCORE_THRESHOLDS.TRUSTED)
    return { label: 'Trusted', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)' }
  return { label: 'New User', color: '#9ca3af', bg: 'rgba(156,163,175,0.08)', border: 'rgba(156,163,175,0.15)' }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SellerProfilePage() {
  const params = useParams()
  const sellerId = params.id
  const { user, isAuthenticated } = useAuth()

  // Data state
  const [seller, setSeller] = useState(null)
  const [listings, setListings] = useState([])
  const [reviews, setReviews] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // UI state
  const [listingsTab, setListingsTab] = useState('active')
  const [showBadgeTooltip, setShowBadgeTooltip] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [reviewContent, setReviewContent] = useState('')
  const [proofImage, setProofImage] = useState(null)
  const [proofImagePreview, setProofImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState(null)
  const fileInputRef = useRef(null)
  const submittingRef = useRef(false)
  const abortControllerRef = useRef(null)
  const submittingTimeoutRef = useRef(null)

  // ─── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (sellerId) fetchSellerData()
  }, [sellerId])

  useEffect(() => {
    const handleInterruption = () => {
      if (submittingRef.current) {
        clearTimeout(submittingTimeoutRef.current)
        abortControllerRef.current?.abort()
        submittingRef.current = false
        setSubmitting(false)
        setReviewError('Submission was interrupted. Please try again.')
      }
    }
    const onVisibility = () => { if (document.visibilityState === 'visible') handleInterruption() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', handleInterruption)
    window.addEventListener('pageshow', handleInterruption)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', handleInterruption)
      window.removeEventListener('pageshow', handleInterruption)
    }
  }, [])

  // ─── Data fetching ───────────────────────────────────────────────────────────

  const fetchSellerData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/profile/${sellerId}?role=seller`)
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch seller profile')
      setSeller(data.profile)
      setListings(data.listings || [])
      if (data.reviews?.length > 0) {
        setReviews(data.reviews)
        const avg = data.reviews.reduce((sum, r) => sum + r.rating, 0) / data.reviews.length
        setAverageRating(parseFloat(avg.toFixed(1)))
      }
    } catch (err) {
      setError('Seller profile not found')
    } finally {
      setLoading(false)
    }
  }

  // ─── Review handlers ─────────────────────────────────────────────────────────

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setReviewError('Image must be under 5MB'); return }
    setReviewError(null)
    const compressed = await compressImage(file)
    setProofImage(compressed)
    const reader = new FileReader()
    reader.onloadend = () => setProofImagePreview(reader.result)
    reader.readAsDataURL(compressed)
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) { setReviewError('You must be logged in to leave a review'); return }
    if (user.id === sellerId) { setReviewError('You cannot review your own profile'); return }
    if (!proofImage) { setReviewError('Please upload a proof of purchase image'); return }

    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current

    try {
      setSubmitting(true)
      submittingRef.current = true
      setReviewError(null)

      submittingTimeoutRef.current = setTimeout(() => {
        if (submittingRef.current) {
          abortControllerRef.current?.abort()
          submittingRef.current = false
          setSubmitting(false)
          setReviewError('Request timed out. Please try again.')
        }
      }, 30000)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const formData = new FormData()
      formData.append('files', proofImage)
      formData.append('userId', user.id)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData, signal })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok || !uploadData.urls?.[0]) throw new Error(uploadData.error || 'Failed to upload proof image')

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          reviewee_id: sellerId,
          reviewer_id: user.id,
          comment: reviewContent,
          rating: reviewRating,
          is_seller_review: true,
          proof_image_url: uploadData.urls[0],
        }),
        signal,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to submit review')

      setReviewContent('')
      setReviewRating(5)
      setHoveredStar(0)
      setProofImage(null)
      setProofImagePreview(null)
      setShowReviewForm(false)
      await fetchSellerData()
    } catch (err) {
      if (err.name === 'AbortError') return
      setReviewError(err.message)
    } finally {
      clearTimeout(submittingTimeoutRef.current)
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) return
    try {
      const response = await fetch(`/api/reviews?review_id=${reviewId}&reviewee_id=${sellerId}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to delete review')
      await fetchSellerData()
    } catch (err) {
      alert('Failed to delete review: ' + err.message)
    }
  }

  // ─── Derived state ────────────────────────────────────────────────────────────

  const profileSchema = useMemo(
    () => generateProfileSchema(seller, averageRating, reviews.length),
    [seller, averageRating, reviews.length]
  )

  const activeListings = useMemo(() => listings.filter(l => !l.is_sold), [listings])
  const soldListings = useMemo(() => listings.filter(l => l.is_sold), [listings])
  const displayedListings = listingsTab === 'active' ? activeListings : soldListings

  const ratingDistribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) dist[r.rating]++ })
    return dist
  }, [reviews])

  // ─── Loading / error ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !seller) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#000000' }}>
        <div className="text-center">
          <h1 className="text-3xl font-black text-white mb-3">Profile Not Found</h1>
          <p className="text-gray-400 mb-6 text-sm">{error || 'This seller profile does not exist'}</p>
          <Link href="/" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition">
            Back to Marketplace
          </Link>
        </div>
      </div>
    )
  }

  const activeRating = hoveredStar || reviewRating
  const tier = getTrustTier(seller.trust_score || 0)

  // Shared glass style tokens
  const glass = {
    panel: {
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(24px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.09)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 32px rgba(0,0,0,0.35)',
    },
    card: {
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(16px) saturate(160%)',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
    },
    input: {
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
    },
  }

  return (
    <div className="min-h-screen pb-24 relative overflow-x-hidden" style={{ backgroundColor: '#000000' }}>
      <SchemaScript data={profileSchema} />

      {/* ── Ambient light blobs ─────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20"
          style={{ background: `radial-gradient(ellipse, ${tier.color} 0%, transparent 70%)`, filter: 'blur(60px)' }} />
        <div className="absolute top-1/3 -left-32 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(ellipse, #8b5cf6 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(ellipse, #3b82f6 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      {/* ── Hero Header ────────────────────────────────────────────────────── */}
      <div className="relative">
        {/* Top bar */}
        <div className="max-w-3xl mx-auto px-4 pt-5 pb-1 flex items-center justify-between">
          <LogoHome />
          {isAuthenticated && user?.id !== sellerId && (
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-400 transition px-2.5 py-1.5 rounded-lg hover:bg-red-500/10"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
              Report
            </button>
          )}
        </div>

        {/* Identity block */}
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-6">
          <div
            className="rounded-3xl p-6 flex flex-col sm:flex-row items-center sm:items-end gap-5"
            style={glass.panel}
          >
            {/* Avatar with ambient glow */}
            <div className="relative shrink-0">
              <div
                className="absolute inset-0 rounded-2xl blur-xl opacity-50 scale-110"
                style={{ background: `radial-gradient(ellipse, ${tier.color}, transparent 70%)` }}
                aria-hidden="true"
              />
              {seller.avatar_url ? (
                <Image
                  src={seller.avatar_url}
                  alt={seller.full_name}
                  width={96}
                  height={96}
                  className="relative w-24 h-24 rounded-2xl object-cover"
                  style={{ border: '1.5px solid rgba(255,255,255,0.15)', boxShadow: `0 0 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)` }}
                />
              ) : (
                <div
                  className="relative w-24 h-24 rounded-2xl flex items-center justify-center text-white font-black text-4xl"
                  style={{ background: `linear-gradient(135deg, ${tier.color}99, #8b5cf6)`, border: '1.5px solid rgba(255,255,255,0.15)', boxShadow: '0 0 24px rgba(0,0,0,0.6)' }}
                >
                  {seller.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">{seller.full_name}</h1>
                {seller.university_email_verified && (
                  <button onClick={() => setShowBadgeTooltip(true)} className="shrink-0 cursor-pointer" aria-label="Verified Student">
                    <img loading="lazy" src="/BadgeIcon.svg" alt="Verified Student" width={22} height={22} className="object-contain" />
                  </button>
                )}
              </div>
              {seller.university && (
                <p className="text-gray-400 text-sm mt-1">{seller.university}</p>
              )}
              {seller.bio && (
                <p className="text-gray-500 text-sm mt-1.5 max-w-xs leading-snug sm:text-left text-center italic">
                  {seller.bio}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap mt-3">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{
                  color: tier.color,
                  background: `rgba(0,0,0,0.4)`,
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${tier.border}`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 12px ${tier.color}22`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: tier.color }} />
                {tier.label}
              </div>
              {seller.meetup_place && (
                <a
                  href={seller.meetup_place}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors"
                  style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)' }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Meetup Spot
                </a>
              )}
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div
            className="mt-3 grid grid-cols-4 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(20px) saturate(160%)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
            }}
          >
            {[
              { label: 'LabCred', value: seller.trust_score || 0, color: tier.color },
              { label: 'Avg Rating', value: reviews.length > 0 ? `${averageRating}★` : '—', color: '#facc15' },
              { label: 'Active', value: activeListings.length, color: '#60a5fa' },
              { label: 'Reviews', value: reviews.length, color: '#a78bfa' },
            ].map(({ label, value, color }, i, arr) => (
              <div
                key={label}
                className="text-center py-4 px-2"
                style={i < arr.length - 1 ? { borderRight: '1px solid rgba(255,255,255,0.05)' } : {}}
              >
                <p className="text-xl sm:text-2xl font-black" style={{ color, textShadow: `0 0 20px ${color}66` }}>{value}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Page body ──────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 mt-8 space-y-10">

        {/* ── Listings ──────────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-white">Listings</h2>
            <div
              className="flex rounded-xl overflow-hidden text-xs font-bold"
              style={{
                backdropFilter: 'blur(12px)',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              <button
                onClick={() => setListingsTab('active')}
                className="px-3 py-1.5 transition"
                style={listingsTab === 'active'
                  ? { background: 'rgba(96,165,250,0.2)', color: '#93c5fd', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' }
                  : { color: '#4b5563' }}
              >
                Active ({activeListings.length})
              </button>
              <button
                onClick={() => setListingsTab('sold')}
                className="px-3 py-1.5 transition"
                style={listingsTab === 'sold'
                  ? { background: 'rgba(239,68,68,0.18)', color: '#fca5a5', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }
                  : { color: '#4b5563' }}
              >
                Sold ({soldListings.length})
              </button>
            </div>
          </div>

          {displayedListings.length === 0 ? (
            <div
              className="rounded-2xl py-12 text-center"
              style={{
                backdropFilter: 'blur(16px)',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <p className="text-gray-400 text-sm">
                {listingsTab === 'active' ? 'No active listings' : 'No sold items yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {displayedListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listing/${listing.id}`}
                  className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] hover:-translate-y-0.5"
                  style={{
                    ...glass.card,
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                  }}
                >
                  {/* Thumbnail */}
                  <div className="relative h-36 sm:h-44 bg-gray-900 overflow-hidden">
                    {listing.image_urls?.[0] ? (
                      <Image
                        src={listing.image_urls[0]}
                        alt={listing.title}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-700 text-xs">No image</span>
                      </div>
                    )}
                    {listing.is_sold && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.45)' }}>
                        <span
                          className="px-3 py-1 rounded-xl font-black text-sm text-white"
                          style={{
                            background: 'rgba(239,68,68,0.3)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(239,68,68,0.5)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
                          }}
                        >
                          SOLD
                        </span>
                      </div>
                    )}
                    {listing.image_urls?.length > 1 && (
                      <div
                        className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-lg text-xs text-white font-bold"
                        style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        +{listing.image_urls.length - 1}
                      </div>
                    )}
                    {/* Glass shine overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)' }} />
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-white text-sm font-bold line-clamp-1 group-hover:text-blue-300 transition">
                      {listing.title}
                    </p>
                    <p className="text-green-400 font-black text-base mt-0.5">
                      ₩{listing.price.toLocaleString()}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      <span
                        className="px-1.5 py-0.5 rounded text-xs font-bold"
                        style={{ background: 'rgba(96,165,250,0.12)', color: '#93c5fd' }}
                      >
                        {listing.condition}
                      </span>
                      {listing.categories?.[0] && (
                        <span
                          className="px-1.5 py-0.5 rounded text-xs font-bold"
                          style={{ background: 'rgba(167,139,250,0.12)', color: '#c4b5fd' }}
                        >
                          {listing.categories[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Reviews ────────────────────────────────────────────────────────── */}
        <section>
          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-white">Reviews</h2>
              {reviews.length > 0 && (
                <p className="text-gray-400 text-xs mt-0.5">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
              )}
            </div>
            {isAuthenticated && user?.id !== sellerId && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white transition"
                style={showReviewForm
                  ? { backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }
                  : { backdropFilter: 'blur(12px)', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 0 16px rgba(59,130,246,0.15)' }}
              >
                {showReviewForm ? 'Cancel' : 'Write Review'}
              </button>
            )}
          </div>

          {/* Rating summary */}
          {reviews.length > 0 && (
            <div
              className="rounded-2xl p-4 mb-5 flex items-center gap-6"
              style={glass.panel}
            >
              <div className="text-center shrink-0">
                <p className="text-4xl font-black text-white" style={{ textShadow: '0 0 24px rgba(250,204,21,0.4)' }}>{averageRating}</p>
                <div className="flex justify-center gap-0.5 my-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} className={`text-sm ${s <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-800'}`}>★</span>
                  ))}
                </div>
                <p className="text-gray-400 text-xs">{reviews.length} reviews</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map(star => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-2 shrink-0">{star}</span>
                    <span className="text-yellow-400 text-xs shrink-0">★</span>
                    <div className="flex-1 rounded-full overflow-hidden h-2" style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: reviews.length > 0 ? `${(ratingDistribution[star] / reviews.length) * 100}%` : '0%',
                          background: star >= 4
                            ? 'linear-gradient(90deg, #ca8a04, #facc15)'
                            : star === 3
                            ? 'linear-gradient(90deg, #c2410c, #fb923c)'
                            : 'linear-gradient(90deg, #991b1b, #f87171)',
                          boxShadow: star >= 4 ? '0 0 8px rgba(250,204,21,0.4)' : star === 3 ? '0 0 8px rgba(251,146,60,0.4)' : '0 0 8px rgba(248,113,113,0.4)',
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-700 w-4 text-right shrink-0">{ratingDistribution[star]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review form */}
          {showReviewForm && (
            <div className="rounded-2xl p-5 mb-5" style={glass.panel}>
              <h3 className="font-black text-white text-base mb-4">Write a Review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-5">

                {/* Star rating */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Your Rating</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="text-3xl transition-transform hover:scale-110 active:scale-95 touch-manipulation leading-none"
                        aria-label={`Rate ${star} stars`}
                      >
                        <span className={star <= activeRating ? 'text-yellow-400' : 'text-gray-800'} style={star <= activeRating ? { textShadow: '0 0 12px rgba(250,204,21,0.6)' } : {}}>★</span>
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-bold text-gray-400">{RATING_LABELS[activeRating]}</span>
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Your Review</label>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => e.target.value.length <= MAX_COMMENT_LENGTH && setReviewContent(e.target.value)}
                    placeholder="Was the item as described? How was communication?"
                    required
                    minLength={10}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl text-white placeholder-gray-600 text-sm resize-none focus:outline-none transition"
                    style={glass.input}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">Min 10 characters</span>
                    <span className={`text-xs ${reviewContent.length >= MAX_COMMENT_LENGTH ? 'text-red-400' : 'text-gray-400'}`}>
                      {reviewContent.length}/{MAX_COMMENT_LENGTH}
                    </span>
                  </div>
                </div>

                {/* Proof of purchase */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Proof of Purchase <span className="text-red-400">*</span>
                  </label>
                  <p className="text-xs text-gray-400 mb-3">
                    Screenshot or photo of your transaction (chat, payment receipt, etc.)
                  </p>
                  {!proofImagePreview ? (
                    <label
                      className="flex flex-col items-center justify-center w-full h-28 rounded-xl cursor-pointer transition-all group"
                      style={{ border: '2px dashed rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.02)' }}
                    >
                      <div className="flex flex-col items-center gap-1.5 text-gray-400 group-hover:text-gray-400 transition pointer-events-none">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium">Click to upload</span>
                        <span className="text-xs">PNG, JPG, WEBP · Max 5MB</span>
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden group" style={{ border: '1px solid rgba(255,255,255,0.09)' }}>
                      <img loading="lazy" src={proofImagePreview} alt="Proof preview" className="w-full max-h-48 object-cover" />
                      <div
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        style={{ background: 'rgba(0,0,0,0.5)' }}
                      >
                        <button
                          type="button"
                          onClick={() => { setProofImage(null); setProofImagePreview(null) }}
                          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error */}
                {reviewError && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-xl text-red-400 text-sm"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {reviewError}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || reviewContent.trim().length < 10 || !proofImage}
                  className="w-full py-3 rounded-xl font-black text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
                  style={{ background: 'rgba(59,130,246,0.25)', border: '1px solid rgba(59,130,246,0.35)' }}
                >
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                  ) : 'Submit Review'}
                </button>
              </form>
            </div>
          )}

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <div
              className="rounded-2xl py-12 text-center"
              style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            >
              <p className="text-gray-400 text-sm">No reviews yet</p>
              {isAuthenticated && user?.id !== sellerId && (
                <p className="text-gray-700 text-xs mt-1">Be the first to review this seller!</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl p-4"
                  style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.025)' }}
                >
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      {/* Reviewer avatar */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                      >
                        {review.reviewer?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-white text-sm font-bold leading-tight">
                          {review.reviewer?.full_name || 'Anonymous'}
                        </p>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <span key={s} className={`text-xs ${s <= review.rating ? 'text-yellow-400' : 'text-gray-700'}`}>★</span>
                          ))}
                          <span className="text-xs text-gray-400 ml-1">{RATING_LABELS[review.rating]}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                      {isAuthenticated && user?.id === sellerId && (
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-gray-400 hover:text-red-400 transition text-xs px-1 py-0.5 rounded hover:bg-red-500/10"
                          title="Delete review"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>

                  {review.proof_image_url && (
                    <a href={review.proof_image_url} target="_blank" rel="noopener noreferrer" className="mt-3 block">
                      <Image
                        src={review.proof_image_url}
                        alt="Proof of purchase"
                        width={400}
                        height={144}
                        className="w-full max-h-36 object-cover rounded-xl opacity-75 hover:opacity-100 transition"
                        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                      />
                      <p className="text-xs text-gray-400 mt-1">Proof of purchase · tap to enlarge</p>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Verified badge tooltip ─────────────────────────────────────────── */}
      {showBadgeTooltip && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setShowBadgeTooltip(false)}
        >
          <div
            className="rounded-2xl p-6 w-72 max-w-[88vw]"
            style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <img loading="lazy" src="/BadgeIcon.svg" alt="" width={28} height={28} className="w-7 h-7 object-contain" />
              <p className="text-white font-bold">Verified Student</p>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              This user has verified their student status at their registered university.
            </p>
            <button
              onClick={() => setShowBadgeTooltip(false)}
              className="mt-5 w-full py-2 rounded-xl text-sm font-semibold text-gray-300 hover:text-white transition"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── Report modal ───────────────────────────────────────────────────── */}
      {showReportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.5)' }}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-sm space-y-4"
            style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <h3 className="text-white font-black text-base">Report this user?</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              This will open your email to send a report to our admin team about{' '}
              <span className="text-white font-bold">{seller?.full_name}</span>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2.5 rounded-xl text-gray-300 font-bold text-sm transition"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Cancel
              </button>
              <a
                href={`mailto:admin@shelterlab.shop?subject=${encodeURIComponent('Report Post/User')}&body=${encodeURIComponent(`Reported User: ${seller?.full_name || 'Unknown'}\n\nReason for Report:\n`)}`}
                className="flex-1 py-2.5 rounded-xl text-red-300 font-bold text-sm transition text-center"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                Send Report
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
