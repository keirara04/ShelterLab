'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { UNIVERSITIES, UNIVERSITY_LOGOS } from '@/lib/constants'

export default function BuyerProfilePage() {
  const params = useParams()
  const buyerId = params.id
  const { user, profile, isAuthenticated } = useAuth()
  const [buyer, setBuyer] = useState(null)
  const [reviews, setReviews] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewContent, setReviewContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState(null)

  useEffect(() => {
    if (buyerId) {
      fetchBuyerData()
    }
  }, [buyerId])

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

    try {
      setSubmitting(true)
      setReviewError(null)

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewee_id: buyerId,
          reviewer_id: user.id,
          comment: reviewContent,
          rating: reviewRating,
          is_seller_review: false,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      // Reset form and refresh reviews
      setReviewContent('')
      setReviewRating(5)
      setShowReviewForm(false)
      await fetchBuyerData()
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
      const response = await fetch(`/api/reviews?review_id=${reviewId}&reviewee_id=${buyerId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete review')
      }

      // Refresh reviews
      await fetchBuyerData()
    } catch (err) {
      console.error('Error deleting review:', err)
      alert('Failed to delete review: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading buyer profile...</p>
        </div>
      </div>
    )
  }

  if (error || !buyer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link href="/" className="text-blue-400 hover:text-blue-300 font-bold mb-6 inline-block">
          ← Back to Marketplace
        </Link>

        {/* Profile Header */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Avatar */}
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

            {/* Info */}
            <div className="flex-1 text-center sm:text-left w-full">
              <h1 className="text-2xl sm:text-4xl font-black text-white mb-2">{buyer.full_name}</h1>
              {buyer.university ? (
                <div className="flex items-center gap-2 justify-center sm:justify-start mb-3">
                  <img src={UNIVERSITY_LOGOS[buyer.university]} alt="" className="w-6 h-6 object-contain rounded-full" />
                  <span className="text-teal-400 font-bold text-sm">
                    {UNIVERSITIES.find(u => u.id === buyer.university)?.name || buyer.university}
                  </span>
                </div>
              ) : (
                <p className="text-gray-400 text-sm mb-4">Buyer Profile</p>
              )}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
                <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Trust Score</p>
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
                  <p className="text-lg sm:text-xl font-black text-yellow-400">
                    ⭐ {averageRating}
                  </p>
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
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 mb-6">
              <h3 className="text-base sm:text-lg font-bold text-white mb-4">Leave a Review for this Buyer</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Rating
                  </label>
                  <div className="flex gap-1 sm:gap-2 items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`text-2xl sm:text-3xl transition touch-manipulation p-1 ${
                          star <= reviewRating ? 'text-yellow-400' : 'text-gray-600'
                        } hover:text-yellow-300 active:brightness-125`}
                        aria-label={`Rate ${star} stars`}
                      >
                        ⭐
                      </button>
                    ))}
                    <span className="ml-2 text-white font-bold self-center text-sm sm:text-base">
                      {reviewRating} / 5
                    </span>
                  </div>
                </div>

                {/* Review Content */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Your Review
                  </label>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="Share your experience with this buyer..."
                    required
                    minLength={3}
                    rows={4}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition text-sm sm:text-base"
                  />
                </div>

                {/* Error Message */}
                {reviewError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {reviewError}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !reviewContent.trim()}
                  className="w-full px-6 py-3 sm:py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition touch-manipulation text-sm sm:text-base"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
              <p className="text-gray-400">No reviews yet</p>
              {isAuthenticated && user?.id !== buyerId && (
                <p className="text-gray-500 text-sm mt-2">Be the first to review this buyer!</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3 relative"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-white">{review.reviewer?.full_name || 'Anonymous'}</p>
                      <div className="text-yellow-400 text-sm mt-1">
                        {'⭐'.repeat(review.rating)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                      {/* Delete button - only visible to the buyer */}
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

                  <p className="text-gray-300 text-sm leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
