'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { UNIVERSITIES, UNIVERSITY_LOGOS } from '@/lib/constants'

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id
  const { user } = useAuth()

  const [listing, setListing] = useState(null)
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [markingSold, setMarkingSold] = useState(false)
  const [reviews, setReviews] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewFormData, setReviewFormData] = useState({ rating: 5, content: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState(null)

  useEffect(() => {
    if (id) {
      fetchListing()
    }
  }, [id])

  const fetchListing = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch listing, seller, and reviews via server API (bypasses RLS)
      const res = await fetch(`/api/listings/${id}`)
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch listing')
      }

      setListing(data.listing)

      if (data.seller) {
        setSeller(data.seller)
      }

      if (data.reviews && data.reviews.length > 0) {
        setReviews(data.reviews)
        const avg = data.reviews.reduce((sum, review) => sum + review.rating, 0) / data.reviews.length
        setAverageRating(parseFloat(avg.toFixed(1)))
      }
    } catch (err) {
      console.error('Error fetching listing:', err)
      setError('Listing not found or has expired')
    } finally {
      setLoading(false)
    }
  }

  const handlePrevImage = () => {
    if (listing?.image_urls) {
      setCurrentImageIndex(
        (prev) =>
          (prev - 1 + listing.image_urls.length) % listing.image_urls.length
      )
    }
  }

  const handleNextImage = () => {
    if (listing?.image_urls) {
      setCurrentImageIndex((prev) => (prev + 1) % listing.image_urls.length)
    }
  }

  const handleToggleSold = async () => {
    if (!user) {
      alert('You must be logged in to update listing status')
      return
    }

    const newStatus = !listing.is_sold
    const message = newStatus
      ? 'Mark this listing as sold?'
      : 'Mark this listing as available again?'

    if (!confirm(message)) return

    try {
      setMarkingSold(true)

      const response = await fetch(`/api/listings/${id}/mark-sold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status')
      }

      // Update local state
      setListing({ ...listing, is_sold: data.data.is_sold })
      alert(data.data.is_sold ? 'Listing marked as sold!' : 'Listing marked as available!')
    } catch (err) {
      console.error('Error toggling sold status:', err)
      alert('Failed to update status: ' + err.message)
    } finally {
      setMarkingSold(false)
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError(null)

    if (!user) {
      setReviewError('You must be logged in to leave a review')
      return
    }

    if (user.id === listing.seller_id) {
      setReviewError('You cannot review your own listing')
      return
    }

    if (!reviewFormData.content.trim() || reviewFormData.content.trim().length < 3) {
      setReviewError('Review must be at least 3 characters')
      return
    }

    try {
      setSubmittingReview(true)

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: listing.seller_id,
          reviewer_id: user.id,
          reviewer_name: user.user_metadata?.full_name || 'Anonymous',
          content: reviewFormData.content,
          rating: parseInt(reviewFormData.rating),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to post review')
      }

      // Update reviews
      setReviews([data.data, ...reviews])
      const newAvg = [data.data, ...reviews].reduce((sum, review) => sum + review.rating, 0) / ([data.data, ...reviews].length)
      setAverageRating(parseFloat(newAvg.toFixed(1)))

      // Reset form
      setReviewFormData({ rating: 5, content: '' })
      setShowReviewForm(false)
      alert('Review posted successfully!')
    } catch (err) {
      console.error('Error posting review:', err)
      setReviewError(err.message || 'Failed to post review')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center"
        style={{
          backgroundImage: 'url(/background.png)',
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          backgroundBlendMode: 'overlay'
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading listing...</p>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center p-4"
        style={{
          backgroundImage: 'url(/background.png)',
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          backgroundBlendMode: 'overlay'
        }}
      >
        <div className="text-center">
          <h1 className="text-3xl font-black text-white mb-4">Oops!</h1>
          <p className="text-gray-400 mb-6">{error || 'Listing not found'}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
          >
            Back to Listings
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = user?.id === listing.seller_id

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed py-12"
      style={{
        backgroundImage: 'url(/background.png)',
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        backgroundBlendMode: 'overlay'
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="text-blue-400 hover:text-blue-300 active:text-blue-200 font-bold mb-6 inline-block cursor-pointer py-2 touch-manipulation text-base min-h-[44px]"
        >
          ← Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Image Carousel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Main Image */}
            <div className="relative bg-gray-800 rounded-xl overflow-hidden h-64 sm:h-80 lg:aspect-square lg:h-auto group">
              {listing.image_urls && listing.image_urls.length > 0 ? (
                <>
                  <img
                    src={listing.image_urls[currentImageIndex]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />

                  {/* Navigation Arrows */}
                  {listing.image_urls.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full md:opacity-0 md:group-hover:opacity-100 transition z-10 touch-manipulation text-xl"
                        aria-label="Previous image"
                      >
                        ←
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full md:opacity-0 md:group-hover:opacity-100 transition z-10 touch-manipulation text-xl"
                        aria-label="Next image"
                      >
                        →
                      </button>

                      {/* Image Counter */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-white text-xs sm:text-sm font-bold">
                        {currentImageIndex + 1} / {listing.image_urls.length}
                      </div>
                    </>
                  )}

                  {/* Sold Overlay with Liquid Glass Effect */}
                  {listing.is_sold && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 backdrop-blur-md flex items-center justify-center">
                      <div className="relative">
                        {/* Glass morphism background */}
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-2xl transform rotate-3 scale-110"></div>
                        {/* Main SOLD badge - responsive sizing */}
                        <div className="relative bg-gradient-to-br from-red-500/90 to-red-600/90 backdrop-blur-sm px-8 py-4 sm:px-12 sm:py-6 rounded-xl border-2 border-white/20 shadow-2xl transform -rotate-12">
                          <p className="text-white font-black text-3xl sm:text-4xl md:text-5xl tracking-wider drop-shadow-lg">SOLD</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {listing.image_urls && listing.image_urls.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {listing.image_urls.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 transition touch-manipulation ${
                      idx === currentImageIndex
                        ? 'border-blue-500'
                        : 'border-white/20 hover:border-white/40 active:border-white/60'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details Panel */}
          <div className="space-y-4 sm:space-y-6">
            {/* Title & Price */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{listing.title}</h1>

              <div className="text-3xl sm:text-4xl font-black text-green-400">
                ₩{listing.price.toLocaleString()}
              </div>

              {/* Badges */}
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-blue-500/30 text-blue-300 text-sm font-bold">
                  {listing.condition}
                </span>
                {listing.categories && listing.categories.map((cat) => (
                  <span
                    key={cat}
                    className="px-3 py-1 rounded-full bg-purple-500/30 text-purple-300 text-sm font-bold"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6">
              <h2 className="text-xs sm:text-sm font-bold text-gray-300 uppercase mb-3">
                Description
              </h2>
              <p className="text-white text-sm leading-relaxed">
                {listing.description || 'No description provided'}
              </p>
            </div>

            {/* Seller Info */}
            {seller && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 space-y-4">
                <h2 className="text-sm font-bold text-gray-300 uppercase">
                  Seller Info
                </h2>

                <Link
                  href={`/profile/${seller.id}`}
                  className="flex items-center gap-3 hover:opacity-80 transition"
                >
                  {seller.avatar_url ? (
                    <img
                      src={seller.avatar_url}
                      alt={seller.full_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold border-2 border-blue-500">
                      {seller.full_name?.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <p className="font-bold text-white hover:text-blue-400">{seller.full_name}</p>
                    <p className="text-xs text-gray-400">
                      Trust Score: {seller.trust_score || 0}
                    </p>
                    {seller.university && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <img src={UNIVERSITY_LOGOS[seller.university]} alt="" className="w-4 h-4 object-contain rounded-full" />
                        <span className="text-xs text-teal-400 font-bold">
                          {UNIVERSITIES.find(u => u.id === seller.university)?.name || seller.university}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Contact Buttons */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  {listing.kakao_link && (
                    <a
                      href={listing.kakao_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-4 px-4 bg-yellow-500/20 hover:bg-yellow-500/30 active:bg-yellow-500/40 text-yellow-300 rounded-lg font-bold transition text-center text-base touch-manipulation min-h-[48px]"
                    >
                      Contact on Kakao
                    </a>
                  )}

                  {!listing.kakao_link && (
                    <p className="text-xs text-gray-400 text-center py-2">
                      No contact info available
                    </p>
                  )}
                </div>

                {/* Edit/Delete for Owner */}
                {isOwner && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    {!listing.is_sold && (
                      <Link
                        href={`/listing/${listing.id}/edit`}
                        className="block w-full py-4 px-4 bg-blue-600/20 hover:bg-blue-600/30 active:bg-blue-600/40 text-blue-300 rounded-lg font-bold transition text-center text-base touch-manipulation min-h-[48px]"
                      >
                        Edit Listing
                      </Link>
                    )}
                    <button
                      onClick={handleToggleSold}
                      disabled={markingSold}
                      className={`block w-full py-4 px-4 ${
                        listing.is_sold
                          ? 'bg-green-500/20 hover:bg-green-500/30 active:bg-green-500/40 text-green-300'
                          : 'bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 text-red-300'
                      } disabled:bg-gray-600/20 disabled:cursor-not-allowed rounded-lg font-bold transition text-center text-base touch-manipulation min-h-[48px]`}
                    >
                      {markingSold
                        ? 'Updating...'
                        : listing.is_sold
                        ? '↻ Mark as Available'
                        : 'Mark as Sold'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Post Date */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 space-y-3 text-center">
              <div>
                <p className="text-xs text-gray-400 uppercase mb-1">Posted by</p>
                <Link
                  href={`/profile/${seller?.id}`}
                  className="text-white font-bold hover:text-blue-400 transition"
                >
                  {seller?.full_name || 'Unknown Seller'}
                </Link>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase mb-1">Date Posted</p>
                <p className="text-white font-bold">
                  {new Date(listing.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase mb-1">Price</p>
                <p className="text-2xl font-black text-green-400">
                  ₩{listing.price.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-300 uppercase">Reviews</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                    {averageRating > 0 && (
                      <span className="ml-2 text-yellow-400 font-bold">
                        ⭐ {averageRating}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Review Form Toggle */}
              {/* Removed: Leave a Review button */}

              {/* Reviews List */}
              {reviews.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-white/10">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="bg-white/5 rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-white text-sm">{review.reviewer_name}</p>
                          <p className="text-yellow-400 text-xs">
                            {'⭐'.repeat(review.rating)}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm line-clamp-2">{review.content}</p>
                    </div>
                  ))}

                  {reviews.length > 3 && (
                    <Link
                      href={`/profile/${seller?.id}`}
                      className="block text-center text-blue-400 hover:text-blue-300 text-sm font-bold py-2"
                    >
                      View all {reviews.length} reviews →
                    </Link>
                  )}
                </div>
              )}

              {reviews.length === 0 && !showReviewForm && (
                <p className="text-gray-400 text-sm text-center py-3">
                  No reviews yet. Be the first to review!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}