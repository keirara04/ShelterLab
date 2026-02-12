'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export default function SellerProfilePage() {
  const params = useParams()
  const sellerId = params.id
  const { user, profile, isAuthenticated } = useAuth()
  const [seller, setSeller] = useState(null)
  const [listings, setListings] = useState([])
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
  const [showAllListings, setShowAllListings] = useState(false)

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

    try {
      setSubmitting(true)
      setReviewError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

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

      // Refresh reviews
      await fetchSellerData()
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
          <p className="text-gray-400">Loading seller profile...</p>
        </div>
      </div>
    )
  }

  if (error || !seller) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
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
              <h1 className="text-2xl sm:text-4xl font-black text-white mb-2">{seller.full_name}</h1>
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
                  <p className="text-lg sm:text-xl font-black text-yellow-400">
                    ⭐ {averageRating}
                  </p>
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
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 mb-6">
              <h3 className="text-base sm:text-lg font-bold text-white mb-4">Leave a Review</h3>
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
                        className={`text-3xl sm:text-3xl transition touch-manipulation p-2 min-w-[44px] min-h-[44px] flex items-center justify-center ${
                          star <= reviewRating ? 'text-yellow-400' : 'text-gray-600'
                        } hover:text-yellow-300 active:scale-110 active:text-yellow-200`}
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
                    placeholder="Share your experience with this seller..."
                    required
                    minLength={3}
                    rows={4}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition text-sm sm:text-base"
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
                  className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition touch-manipulation text-base min-h-[48px]"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}

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
                      {/* Delete button - only visible to the seller */}
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