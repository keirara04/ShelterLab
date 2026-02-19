'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/shared/context/AuthContext'
import { UNIVERSITIES, UNIVERSITY_LOGOS } from '@/services/utils/constants'
import { compressImage } from '@/services/utils/helpers'
import { SchemaScript } from '@/shared/components/SchemaScript'
import { generateProfileSchema } from '@/schema'

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']
const MAX_COMMENT_LENGTH = 500

export default function BuyerProfilePage() {
  const params = useParams()
  const buyerId = params.id
  const { user, isAuthenticated } = useAuth()
  const [buyer, setBuyer] = useState(null)
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
  const fileInputRef = useRef(null)
  const submittingRef = useRef(false)
  const abortControllerRef = useRef(null)
  const submittingTimeoutRef = useRef(null)

  useEffect(() => {
    if (buyerId) {
      fetchBuyerData()
    }
  }, [buyerId])

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
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') handleInterruption()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleInterruption)
    window.addEventListener('pageshow', handleInterruption)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleInterruption)
      window.removeEventListener('pageshow', handleInterruption)
    }
  }, [])

  const fetchBuyerData = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/profile/${buyerId}?role=buyer`)
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch buyer profile')
      }

      setBuyer(data.profile)

      if (data.reviews && data.reviews.length > 0) {
        setReviews(data.reviews)
        const avg = data.reviews.reduce((sum, review) => sum + review.rating, 0) / data.reviews.length
        setAverageRating(parseFloat(avg.toFixed(1)))
      }
    } catch (err) {
      console.error('Error fetching buyer data:', err)
      setError('Buyer profile not found')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setReviewError('Image must be under 5MB')
      return
    }

    setReviewError(null)
    const compressed = await compressImage(file)
    setProofImage(compressed)
    const reader = new FileReader()
    reader.onloadend = () => setProofImagePreview(reader.result)
    reader.readAsDataURL(compressed)
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()

    if (!isAuthenticated) {
      setReviewError('You must be logged in to leave a review')
      return
    }

    if (user.id === buyerId) {
      setReviewError('You cannot review your own profile')
      return
    }

    if (!proofImage) {
      setReviewError('Please upload a proof of purchase image')
      return
    }

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

      // Upload proof image first
      const formData = new FormData()
      formData.append('files', proofImage)
      formData.append('userId', user.id)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        signal,
      })

      const uploadData = await uploadRes.json()

      if (!uploadRes.ok || !uploadData.urls?.[0]) {
        throw new Error(uploadData.error || 'Failed to upload proof image')
      }

      // Submit review with proof URL
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewee_id: buyerId,
          reviewer_id: user.id,
          comment: reviewContent,
          rating: reviewRating,
          is_seller_review: false,
          proof_image_url: uploadData.urls[0],
        }),
        signal,
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
      await fetchBuyerData()
    } catch (err) {
      if (err.name === 'AbortError') return
      console.error('Error submitting review:', err)
      setReviewError(err.message)
    } finally {
      clearTimeout(submittingTimeoutRef.current)
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return
    }

    try {
      const response = await fetch(`/api/reviews?review_id=${reviewId}&reviewee_id=${buyerId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete review')
      }

      await fetchBuyerData()
    } catch (err) {
      console.error('Error deleting review:', err)
      alert('Failed to delete review: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading buyer profile...</p>
        </div>
      </div>
    )
  }

  if (error || !buyer) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-black text-white mb-4">Profile Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'This buyer profile does not exist'}</p>
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

  const profileSchema = useMemo(
    () => generateProfileSchema(buyer, averageRating, reviews.length),
    [buyer, averageRating, reviews.length]
  )

  const activeRating = hoveredStar || reviewRating

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
      <SchemaScript data={profileSchema} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link href="/" className="text-blue-400 hover:text-blue-300 font-bold mb-6 inline-block">
          ← Back to Marketplace
        </Link>

        {/* Profile Header */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {buyer.avatar_url ? (
              <img
                src={buyer.avatar_url}
                alt={buyer.full_name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-green-500"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-500 rounded-full flex items-center justify-center text-white font-black text-3xl sm:text-4xl border-4 border-green-500">
                {buyer.full_name?.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 text-center sm:text-left w-full">
              <h1 className="text-2xl sm:text-4xl font-black text-white mb-2">{buyer.full_name}</h1>
              {buyer.university ? (
                <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                  <img loading="lazy" src={UNIVERSITY_LOGOS[buyer.university]} alt="" className="w-6 h-6 object-contain rounded-full" />
                  <span className="text-teal-400 font-bold text-sm">
                    {UNIVERSITIES.find(u => u.id === buyer.university)?.name || buyer.university}
                  </span>
                </div>
              ) : (
                <p className="text-gray-400 text-sm mb-2">Buyer Profile</p>
              )}
              {buyer.meetup_place && (
                <div className="flex items-center gap-1.5 justify-center sm:justify-start mb-3">
                  <svg className="w-3.5 h-3.5 text-teal-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <a
                    href={buyer.meetup_place}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors"
                  >
                    View meetup spot on Naver Maps
                  </a>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
                <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">LabCred</p>
                  <p className="text-xl sm:text-2xl font-black text-green-400">{buyer.trust_score || 0}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Total Reviews</p>
                  <p className="text-xl sm:text-2xl font-black text-yellow-400">{reviews.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-white">Buyer Reviews</h2>
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              {reviews.length > 0 && (
                <div className="text-left sm:text-right">
                  <p className="text-xs sm:text-sm text-gray-400">
                    {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-lg sm:text-xl font-black text-yellow-400">⭐ {averageRating}</p>
                </div>
              )}
              {isAuthenticated && user?.id !== buyerId && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition text-sm sm:text-base whitespace-nowrap touch-manipulation"
                >
                  {showReviewForm ? 'Cancel' : 'Review Buyer'}
                </button>
              )}
            </div>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-7 mb-8">
              {/* Form Header */}
              <div className="flex items-center gap-3 pb-5 mb-5 border-b border-white/10">
                <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-base sm:text-lg leading-tight">Write a Review</h3>
                  <p className="text-xs text-gray-400">Share your experience transacting with this buyer</p>
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
                        <span className={star <= activeRating ? 'text-yellow-400' : 'text-gray-400'}>★</span>
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
                    placeholder="Was payment prompt? Was communication good? Describe your experience..."
                    required
                    minLength={10}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition text-sm resize-none"
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-gray-400">Minimum 10 characters</span>
                    <span className={`text-xs ${reviewContent.length >= MAX_COMMENT_LENGTH ? 'text-red-400' : 'text-gray-400'}`}>
                      {reviewContent.length} / {MAX_COMMENT_LENGTH}
                    </span>
                  </div>
                </div>

                {/* Proof of Purchase - Required */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">
                    Proof of Purchase <span className="text-red-400">*</span>
                  </label>
                  <p className="text-xs text-gray-400 mb-3">
                    Upload a screenshot or photo showing your transaction (chat, payment receipt, etc.)
                  </p>

                  {!proofImagePreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-green-500/60 hover:bg-green-500/5 transition-all group">
                      <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-gray-300 transition-colors pointer-events-none">
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
                  className="w-full py-3.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-sm sm:text-base flex items-center justify-center gap-2"
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
              {isAuthenticated && user?.id !== buyerId && (
                <p className="text-gray-400 text-sm mt-2">Be the first to review this buyer!</p>
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
                          <span key={s} className={`text-base ${s <= review.rating ? 'text-yellow-400' : 'text-gray-400'}`}>★</span>
                        ))}
                        <span className="ml-1.5 text-xs text-gray-400">{RATING_LABELS[review.rating]}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                      {isAuthenticated && user?.id === buyerId && (
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
                      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
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
      </div>
    </div>
  )
}
