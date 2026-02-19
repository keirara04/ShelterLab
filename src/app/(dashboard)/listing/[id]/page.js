'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/shared/context/AuthContext'
import { supabase } from '@/services/supabase'
import { UNIVERSITIES, UNIVERSITY_LOGOS } from '@/services/utils/constants'
import LogoHome from '@/shared/components/LogoHome'

export default function ListingDetailPage() {
  const params = useParams()
  const id = params.id
  const { user, isAuthenticated } = useAuth()

  const [listing, setListing] = useState(null)
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  const [reviews, setReviews] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewFormData, setReviewFormData] = useState({ rating: 5, content: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState(null)
  const [showReportModal, setShowReportModal] = useState(false)

  useEffect(() => {
    if (id) {
      fetchListing()
    }
  }, [id])

  const fetchListing = async () => {
    try {
      setLoading(true)
      setError(null)

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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, url: window.location.href })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch { /* user cancelled or clipboard denied */ }
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

      setReviews([data.data, ...reviews])
      const newAvg = [data.data, ...reviews].reduce((sum, review) => sum + review.rating, 0) / ([data.data, ...reviews].length)
      setAverageRating(parseFloat(newAvg.toFixed(1)))

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading listing...</p>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#000000' }}>
        <div className="text-center">
          <h1 className="text-3xl font-black text-white mb-4">Oops!</h1>
          <p className="text-gray-400 mb-6">{error || 'Listing not found'}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 text-white font-bold rounded-xl transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #14b8a6, #06b6d4)' }}
          >
            Back to Listings
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = user?.id === listing.seller_id

  return (
    <div className="min-h-screen py-12" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-6">
          <LogoHome />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

          {/* Left: Image Carousel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Main Image */}
            <div className="relative bg-gray-900 rounded-3xl overflow-hidden h-64 sm:h-80 lg:aspect-square lg:h-auto group">
              {listing.image_urls && listing.image_urls.length > 0 ? (
                <>
                  <Image
                    src={listing.image_urls[currentImageIndex]}
                    alt={listing.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover"
                  />

                  {/* Navigation Arrows */}
                  {listing.image_urls.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 active:bg-black/80 backdrop-blur-sm text-white w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full md:opacity-0 md:group-hover:opacity-100 transition z-10 touch-manipulation text-xl"
                        aria-label="Previous image"
                      >
                        ←
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 active:bg-black/80 backdrop-blur-sm text-white w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full md:opacity-0 md:group-hover:opacity-100 transition z-10 touch-manipulation text-xl"
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

                  {/* Sold Overlay */}
                  {listing.is_sold && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 backdrop-blur-md flex items-center justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-2xl transform rotate-3 scale-110"></div>
                        <div className="relative bg-gradient-to-br from-red-500/90 to-red-600/90 backdrop-blur-sm px-8 py-4 sm:px-12 sm:py-6 rounded-xl border-2 border-white/20 shadow-2xl transform -rotate-12">
                          <p className="text-white font-black text-3xl sm:text-4xl md:text-5xl tracking-wider drop-shadow-lg">SOLD</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-500/10 to-cyan-500/10">
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
                    className={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 transition touch-manipulation ${
                      idx === currentImageIndex
                        ? 'border-teal-500'
                        : 'border-white/20 hover:border-white/40 active:border-white/60'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx}`}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details Panel */}
          <div className="space-y-4">

            {/* Title & Price */}
            <div className="glass-strong rounded-3xl p-6 sm:p-7 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-teal-500/5 rounded-3xl pointer-events-none" />
              <div className="relative space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-2xl sm:text-3xl font-black text-white flex-1 leading-tight">{listing.title}</h1>
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Share button */}
                    <button
                      onClick={handleShare}
                      aria-label="Share listing"
                      className="px-3 py-2 text-gray-400 hover:text-teal-300 active:text-teal-200 rounded-xl transition touch-manipulation min-h-11 flex items-center justify-center cursor-pointer"
                    >
                      {copied ? (
                        <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      )}
                    </button>
                    {/* Report button — authenticated non-owners only */}
                    {isAuthenticated && !isOwner && (
                      <button
                        onClick={() => setShowReportModal(true)}
                        className="px-3 py-2 text-red-400/70 hover:text-red-300 active:text-red-200 rounded-xl transition touch-manipulation min-h-11 flex items-center justify-center cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-3xl sm:text-4xl font-black text-emerald-400">
                  ₩{listing.price.toLocaleString()}
                </div>

                {/* Badges */}
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/20 text-blue-300 text-xs font-bold">
                    {listing.condition}
                  </span>
                  {listing.categories && listing.categories.map((cat) => (
                    <span
                      key={cat}
                      className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/20 text-purple-300 text-xs font-bold"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="glass rounded-3xl p-6 sm:p-7 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/3 via-transparent to-cyan-500/3 rounded-3xl pointer-events-none" />
              <div className="relative">
                <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Description
                </h2>
                {isAuthenticated ? (
                  <p className="text-white text-sm leading-relaxed whitespace-pre-line">
                    {listing.description || 'No description provided'}
                  </p>
                ) : (
                  <div className="relative">
                    <p className="text-white text-sm leading-relaxed blur-sm select-none pointer-events-none whitespace-pre-line">
                      {listing.description?.substring(0, 100) || 'Sign in to see the full description of this listing and contact the seller directly.'}
                    </p>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <p className="text-xs text-gray-400 font-medium">Sign in to see full description</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Seller Info */}
            {seller && (
              <div className="glass-strong rounded-3xl p-6 sm:p-7 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-teal-500/5 rounded-3xl pointer-events-none" />
                <div className="relative space-y-4">
                  <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                    Seller Info
                  </h2>

                  <Link
                    href={`/profile/${seller.id}`}
                    className="flex items-center gap-3 hover:opacity-80 transition"
                  >
                    {seller.avatar_url ? (
                      <Image
                        src={seller.avatar_url}
                        alt={seller.full_name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover border-2 border-teal-500/60"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold border-2 border-teal-500/60 text-lg"
                        style={{ background: 'linear-gradient(135deg, #14b8a6, #06b6d4)' }}>
                        {seller.full_name?.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <p className="font-bold text-white hover:text-teal-300 transition-colors">{seller.full_name}</p>
                      <p className="text-xs text-gray-400">
                        LabCred: <span className="text-teal-400 font-bold">{seller.trust_score || 0}</span>
                      </p>
                      {seller.university && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <img loading="lazy" src={UNIVERSITY_LOGOS[seller.university]} alt="" width={14} height={14} className="w-3.5 h-3.5 object-contain rounded-full" />
                          <span className="text-xs text-teal-400 font-bold">
                            {UNIVERSITIES.find(u => u.id === seller.university)?.name || seller.university}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Meetup Spot — authenticated only */}
                  {isAuthenticated && seller.meetup_place && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-teal-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <a
                        href={seller.meetup_place}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors"
                      >
                        View meetup spot on Naver Maps
                      </a>
                    </div>
                  )}

                  {/* Contact Buttons */}
                  <div className="space-y-2 pt-3 border-t border-white/8">
                    {isAuthenticated ? (
                      <>
                        {listing.kakao_link && (
                          <a
                            href={listing.kakao_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full py-3.5 px-4 bg-yellow-500/15 hover:bg-yellow-500/25 active:bg-yellow-500/35 border border-yellow-500/20 text-yellow-300 rounded-xl font-black transition text-center text-sm touch-manipulation min-h-12"
                          >
                            Contact on Kakao
                          </a>
                        )}
                        {!listing.kakao_link && (
                          <p className="text-xs text-gray-500 text-center py-2">
                            No contact info available
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="space-y-2 py-1">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <p className="text-xs text-gray-400">Sign in to contact the seller</p>
                        </div>
                        <Link
                          href={`/login?redirect=/listing/${id}`}
                          className="block w-full py-3 px-4 rounded-xl font-bold text-center text-sm text-white touch-manipulation transition hover:opacity-90"
                          style={{ background: 'linear-gradient(135deg, #14b8a6, #06b6d4)' }}
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/signup"
                          className="block w-full py-3 px-4 glass hover:bg-white/10 text-gray-300 rounded-xl font-bold text-center text-sm touch-manipulation transition"
                        >
                          Create Account
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Edit for Owner */}
                  {isOwner && (
                    <div className="space-y-2 pt-3 border-t border-white/8">
                      {!listing.is_sold && (
                        <Link
                          href={`/listing/${listing.id}/edit`}
                          className="block w-full py-3.5 px-4 bg-teal-500/10 hover:bg-teal-500/20 active:bg-teal-500/30 border border-teal-500/20 text-teal-300 rounded-xl font-bold transition text-center text-sm touch-manipulation min-h-12"
                        >
                          Edit Listing
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Post Date */}
            <div className="glass rounded-3xl p-6 sm:p-7 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/3 via-transparent to-cyan-500/3 rounded-3xl pointer-events-none" />
              <div className="relative space-y-3 text-center">
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Posted by</p>
                  <Link
                    href={`/profile/${seller?.id}`}
                    className="text-white font-bold hover:text-teal-300 transition-colors"
                  >
                    {seller?.full_name || 'Unknown Seller'}
                  </Link>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Date Posted</p>
                  <p className="text-white font-bold">
                    {new Date(listing.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Price</p>
                  <p className="text-2xl font-black text-emerald-400">
                    ₩{listing.price.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="glass-strong rounded-3xl p-6 sm:p-7 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-teal-500/5 rounded-3xl pointer-events-none" />
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Reviews</h2>
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

                {/* Reviews List */}
                {reviews.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-white/8">
                    {reviews.map((review) => (
                      <div key={review.id} className="glass rounded-xl p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-white text-sm">{review.reviewer_name}</p>
                            <p className="text-yellow-400 text-xs">
                              {'⭐'.repeat(review.rating)}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{review.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {reviews.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-3">
                    No reviews yet.
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-strong rounded-3xl p-6 max-w-sm w-full space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent rounded-3xl pointer-events-none" />
            <div className="relative">
              <svg className="w-8 h-8 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-gray-300 text-sm text-center mb-4">
                Report this listing as against our Terms of Use?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-3 px-4 glass hover:bg-white/10 text-gray-300 rounded-xl font-bold transition touch-manipulation"
                >
                  Cancel
                </button>
                <a
                  href={`mailto:admin@shelterlab.shop?subject=${encodeURIComponent('Report Post/User')}&body=${encodeURIComponent(`Reported User: ${seller?.full_name || 'Unknown'}\n\nListing Title: ${listing?.title || 'N/A'}\n\nListing Image: ${listing?.image_urls?.[0] || 'N/A'}\n\nReason for Report:\n`)}`}
                  className="flex-1 py-3 px-4 bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 border border-red-500/20 text-red-300 rounded-xl font-bold transition touch-manipulation text-center flex items-center justify-center cursor-pointer"
                >
                  Report
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
