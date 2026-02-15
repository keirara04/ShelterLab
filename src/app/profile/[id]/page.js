'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/services/supabase'
import { useAuth } from '@/shared/context/AuthContext'
import { SchemaScript } from '@/shared/components/SchemaScript'
import { generateProfileSchema } from '@/schema'

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']
const MAX_COMMENT_LENGTH = 500

export default function SellerProfilePage() {
  const params = useParams()
  const sellerId = params.id
  const { user, isAuthenticated } = useAuth()
  const [seller, setSeller] = useState(null)
  const [listings, setListings] = useState([])
  const [reviews, setReviews] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [reviewContent, setReviewContent] = useState('')
  const [proofImage, setProofImage] = useState(null)
  const [proofImagePreview, setProofImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState(null)
  const [showAllListings, setShowAllListings] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showBadgeTooltip, setShowBadgeTooltip] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (sellerId) {
      fetchSellerData()
    }
  }, [sellerId])

  const fetchSellerData = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/profile/${sellerId}?role=seller`)
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch seller profile')
      }

      setSeller(data.profile)
      setListings(data.listings || [])

      if (data.reviews && data.reviews.length > 0) {
        setReviews(data.reviews)
        const avg = data.reviews.reduce((sum, review) => sum + review.rating, 0) / data.reviews.length
        setAverageRating(parseFloat(avg.toFixed(1)))
      }
    } catch (err) {
      console.error('Error fetching seller data:', err)
      setError('Seller profile not found')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setReviewError('Image must be under 2MB')
      return
    }

    setReviewError(null)
    setProofImage(file)
    const reader = new FileReader()
    reader.onloadend = () => setProofImagePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()

    if (!isAuthenticated) {
      setReviewError('You must be logged in to leave a review')
      return
    }

    if (user.id === sellerId) {
      setReviewError('You cannot review your own profile')
      return
    }

    if (!proofImage) {
      setReviewError('Please upload a proof of purchase image')
      return
    }

    try {
      setSubmitting(true)
      setReviewError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Upload proof image first
      const formData = new FormData()
      formData.append('files', proofImage)
      formData.append('userId', user.id)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadRes.json()

      if (!uploadRes.ok || !uploadData.urls?.[0]) {
        throw new Error(uploadData.error || 'Failed to upload proof image')
      }

      // Submit review with proof URL
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          reviewee_id: sellerId,
          reviewer_id: user.id,
          comment: reviewContent,
          rating: reviewRating,
          is_seller_review: true,
          proof_image_url: uploadData.urls[0],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      // Reset form and refresh
      setReviewContent('')
      setReviewRating(5)
      setHoveredStar(0)
      setProofImage(null)
      setProofImagePreview(null)
      setShowReviewForm(false)
      await fetchSellerData()
    } catch (err) {
      console.error('Error submitting review:', err)
      setReviewError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return
    }

    try {
      const response = await fetch(`/api/reviews?review_id=${reviewId}&reviewee_id=${sellerId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete review')
      }

      await fetchSellerData()
    } catch (err) {
      console.error('Error deleting review:', err)
      alert('Failed to delete review: ' + err.message)
    }
  }

  // Generate profile schema before any conditional returns (Rules of Hooks)
  const profileSchema = useMemo(
    () => generateProfileSchema(seller, averageRating, reviews.length),
    [seller, averageRating, reviews.length]
  )

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#000000' }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading seller profile...</p>
        </div>
      </div>
    )
  }

  if (error || !seller) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: '#000000' }}
      >
        <div className="text-center">
          <h1 className="text-3xl font-black text-white mb-4">Profile Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'This seller profile does not exist'}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    )
  }

  const activeRating = hoveredStar || reviewRating

  return (
    <div
      className="min-h-screen py-12"
      style={{ backgroundColor: '#000000' }}
    >
      <SchemaScript data={profileSchema} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link href="/" className="text-blue-400 hover:text-blue-300 active:text-blue-200 font-bold mb-6 inline-block py-2 touch-manipulation text-base sm:text-base">
          ← Back to Marketplace
        </Link>

        {/* Profile Header */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Avatar */}
            {seller.avatar_url ? (
              <img
                src={seller.avatar_url}
                alt={seller.full_name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-blue-500"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-500 rounded-full flex items-center justify-center text-white font-black text-3xl sm:text-4xl border-4 border-blue-500">
                {seller.full_name?.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 text-center sm:text-left w-full">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-4xl font-black text-white">{seller.full_name}</h1>
                {seller?.university_email_verified && (
                <div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowBadgeTooltip(true) }}
                    className="cursor-pointer flex items-center"
                  >
                    <img src="/BadgeIcon.svg" alt="Verified Student" width={24} height={24} className="w-6 h-6 object-contain" />
                  </button>
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
                </div>
                )}
                {isAuthenticated && user?.id !== sellerId && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="px-3 py-2 text-gray-400 hover:text-gray-300 active:text-gray-200 rounded-lg font-bold transition text-lg touch-manipulation min-h-[44px] flex items-center justify-center cursor-pointer"
                  >
                    ⚠️
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
                <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Trust Score</p>
                  <p className="text-xl sm:text-2xl font-black text-green-400">{seller.trust_score || 0}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Total Listings</p>
                  <p className="text-xl sm:text-2xl font-black text-blue-400">{listings.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Listings */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-white">Recent Items</h2>
            {listings.length > 3 && (
              <button
                onClick={() => setShowAllListings(!showAllListings)}
                className="w-full sm:w-auto px-6 py-3 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg transition text-base sm:text-sm touch-manipulation min-h-[44px]"
              >
                {showAllListings ? 'Show Less' : `View All (${listings.length})`}
              </button>
            )}
          </div>

          {listings.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
              <p className="text-gray-400">This seller has no active listings</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {(showAllListings ? listings : listings.slice(0, 3)).map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listing/${listing.id}`}
                  className="group block bg-white/8 border border-white/15 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-xl"
                >
                  {/* Image */}
                  <div className="relative h-40 sm:h-48 bg-gray-800 overflow-hidden">
                    {listing.image_urls && listing.image_urls.length > 0 ? (
                      <>
                        <img
                          src={listing.image_urls[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {listing.image_urls.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-bold">
                            +{listing.image_urls.length - 1}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}

                    {/* Sold Overlay */}
                    {listing.is_sold && (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 backdrop-blur-md flex items-center justify-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-2xl transform rotate-3 scale-110"></div>
                          <div className="relative bg-gradient-to-br from-red-500/90 to-red-600/90 backdrop-blur-sm px-4 py-2 sm:px-6 sm:py-3 rounded-xl border-2 border-white/20 shadow-2xl transform -rotate-12">
                            <p className="text-white font-black text-xl sm:text-2xl tracking-wider drop-shadow-lg">SOLD</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                    <h3 className="font-bold text-white text-sm sm:text-base line-clamp-2 group-hover:text-blue-400 transition">
                      {listing.title}
                    </h3>

                    <div className="text-xl sm:text-2xl font-black text-green-400">
                      ₩{listing.price.toLocaleString()}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <span className="px-2 py-1 rounded bg-blue-500/30 text-blue-300 text-xs font-bold">
                        {listing.condition}
                      </span>
                      {listing.categories && listing.categories[0] && (
                        <span className="px-2 py-1 rounded bg-purple-500/30 text-purple-300 text-xs font-bold">
                          {listing.categories[0]}
                        </span>
                      )}
                    </div>

                    <div className="pt-2 sm:pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-400">View →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-white">Reviews</h2>
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              {reviews.length > 0 && (
                <div className="text-left sm:text-right">
                  <p className="text-xs sm:text-sm text-gray-400">
                    {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-lg sm:text-xl font-black text-yellow-400">⭐ {averageRating}</p>
                </div>
              )}
              {isAuthenticated && user?.id !== sellerId && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg transition text-base whitespace-nowrap touch-manipulation min-h-[44px]"
                >
                  {showReviewForm ? 'Cancel' : 'Write Review'}
                </button>
              )}
            </div>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-7 mb-8">
              {/* Form Header */}
              <div className="flex items-center gap-3 pb-5 mb-5 border-b border-white/10">
                <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-base sm:text-lg leading-tight">Write a Review</h3>
                  <p className="text-xs text-gray-400">Share your experience transacting with this seller</p>
                </div>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-6">
                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-3">Your Rating</label>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="text-3xl sm:text-4xl transition-transform hover:scale-110 active:scale-95 touch-manipulation p-0.5 leading-none"
                        aria-label={`Rate ${star} stars`}
                      >
                        <span className={star <= activeRating ? 'text-yellow-400' : 'text-gray-600'}>★</span>
                      </button>
                    ))}
                    <span className="ml-3 text-sm font-semibold text-gray-300 min-w-17.5">
                      {RATING_LABELS[activeRating]}
                    </span>
                  </div>
                </div>

                {/* Review Comment */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Your Review</label>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => e.target.value.length <= MAX_COMMENT_LENGTH && setReviewContent(e.target.value)}
                    placeholder="Was the item as described? Was communication good? Describe your experience..."
                    required
                    minLength={10}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition text-sm resize-none"
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-gray-500">Minimum 10 characters</span>
                    <span className={`text-xs ${reviewContent.length >= MAX_COMMENT_LENGTH ? 'text-red-400' : 'text-gray-500'}`}>
                      {reviewContent.length} / {MAX_COMMENT_LENGTH}
                    </span>
                  </div>
                </div>

                {/* Proof of Purchase - Required */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">
                    Proof of Purchase <span className="text-red-400">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Upload a screenshot or photo showing your transaction (chat, payment receipt, etc.)
                  </p>

                  {!proofImagePreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-blue-500/60 hover:bg-blue-500/5 transition-all group">
                      <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-gray-300 transition-colors pointer-events-none">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium">Click to upload image</span>
                        <span className="text-xs">PNG, JPG, WEBP · Max 5MB</span>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                      <img
                        src={proofImagePreview}
                        alt="Proof of purchase preview"
                        className="w-full max-h-52 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => { setProofImage(null); setProofImagePreview(null) }}
                          className="opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
                        >
                          Remove Image
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent px-3 py-2 pointer-events-none">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="text-white text-xs truncate">{proofImage?.name}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error */}
                {reviewError && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {reviewError}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || reviewContent.trim().length < 10 || !proofImage}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-sm sm:text-base flex items-center justify-center gap-2 min-h-[48px]"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
              <p className="text-gray-400">No reviews yet</p>
              {isAuthenticated && user?.id !== sellerId && (
                <p className="text-gray-500 text-sm mt-2">Be the first to review this seller!</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3 relative"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-white">{review.reviewer?.full_name || 'Anonymous'}</p>
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} className={`text-base ${s <= review.rating ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
                        ))}
                        <span className="ml-1.5 text-xs text-gray-400">{RATING_LABELS[review.rating]}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                      {isAuthenticated && user?.id === sellerId && (
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-red-400 hover:text-red-300 font-bold text-sm px-2 py-1 hover:bg-red-500/10 rounded transition"
                          title="Delete review"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>

                  {review.proof_image_url && (
                    <a href={review.proof_image_url} target="_blank" rel="noopener noreferrer" className="block">
                      <img
                        src={review.proof_image_url}
                        alt="Proof of purchase"
                        className="w-full max-h-40 object-cover rounded-lg border border-white/10 hover:opacity-90 transition"
                      />
                      <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Proof of purchase · click to enlarge
                      </p>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900/80 border border-white/10 rounded-xl p-6 max-w-sm w-full space-y-4">
              <h2 className="text-2xl text-center">⚠️</h2>
              <p className="text-gray-300 text-sm">
                Feels like this items are against our Terms of Use
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-600/30 hover:bg-gray-600/40 active:bg-gray-600/50 text-gray-300 rounded-lg font-bold transition touch-manipulation"
                >
                  No
                </button>
                <a
                  href={`mailto:admin@shelterlab.shop?subject=${encodeURIComponent('Report Post/User')}&body=${encodeURIComponent(`Reported User: ${seller?.full_name || 'Unknown'}\n\nReason for Report:\n`)}`}
                  className="flex-1 py-3 px-4 bg-red-500/30 hover:bg-red-500/40 active:bg-red-500/50 text-red-300 rounded-lg font-bold transition touch-manipulation text-center flex items-center justify-center cursor-pointer"
                >
                  Yes
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
