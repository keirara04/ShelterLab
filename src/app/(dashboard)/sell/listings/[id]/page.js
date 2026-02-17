'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/shared/context/AuthContext'

export default function ListingDetailPage() {
  const params = useParams()
  const id = params.id
  const { user } = useAuth()

  const [listing, setListing] = useState(null)
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [markingSold, setMarkingSold] = useState(false)

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

  const handleMarkAsSold = async () => {
    if (!confirm('Mark this listing as sold?')) return

    try {
      setMarkingSold(true)

      const response = await fetch(`/api/listings/${listing.id}/mark-sold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to mark as sold')
      }

      const result = await response.json()
      setListing(result.data)
      alert('Listing marked as sold!')
    } catch (err) {
      console.error('Error marking as sold:', err)
      alert('Failed to mark as sold: ' + err.message)
    } finally {
      setMarkingSold(false)
    }
  }

  const bgStyle = {
    backgroundColor: '#000000',
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading listing...</p>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={bgStyle}>
        <div className="glass-strong rounded-3xl p-8 text-center">
          <h1 className="text-3xl font-black text-white mb-4">Oops!</h1>
          <p className="text-gray-400 mb-6">{error || 'Listing not found'}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 text-white font-bold rounded-xl transition"
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
    <div className="min-h-screen py-12" style={bgStyle}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link href="/" className="text-teal-400 hover:text-teal-300 font-bold mb-6 inline-block">
          {'\u2190'} Back to Listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Image Carousel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Main Image */}
            <div className="relative glass-strong rounded-2xl overflow-hidden aspect-square group">
              {listing.image_urls && listing.image_urls.length > 0 ? (
                <>
                  <img
                    src={listing.image_urls[currentImageIndex]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />

                  {listing.image_urls.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 glass text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition z-10 cursor-pointer"
                      >
                        {'\u2190'}
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 glass text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition z-10 cursor-pointer"
                      >
                        {'\u2192'}
                      </button>

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-full text-white text-sm font-bold">
                        {currentImageIndex + 1} / {listing.image_urls.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-800/20 to-cyan-800/20">
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
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden transition cursor-pointer ${
                      idx === currentImageIndex
                        ? 'ring-2 ring-teal-500'
                        : 'ring-1 ring-white/10 hover:ring-white/30'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details Panel */}
          <div className="space-y-6">
            {/* Title & Price */}
            <div className="glass-strong rounded-2xl p-6 space-y-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-teal-500/5 rounded-2xl pointer-events-none" />
              <div className="relative">
                <h1 className="text-3xl font-black text-white">{listing.title}</h1>
                <div className="text-4xl font-black text-emerald-400 mt-2">
                  {'\u20A9'}{listing.price.toLocaleString()}
                </div>
                <div className="flex gap-2 flex-wrap mt-3">
                  <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ background: 'rgba(20,184,166,0.15)', color: '#2dd4bf' }}>
                    {listing.condition}
                  </span>
                  {listing.categories && listing.categories.map((cat) => (
                    <span
                      key={cat}
                      className="px-3 py-1 rounded-full text-sm font-bold" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-bold text-gray-400 uppercase mb-3">Description</h2>
              <p className="text-gray-200 text-sm leading-relaxed">
                {listing.description || 'No description provided'}
              </p>
            </div>

            {/* Seller Info */}
            {seller && (
              <div className="glass rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-bold text-gray-400 uppercase">Seller Info</h2>

                <Link
                  href={`/profile/${seller.id}`}
                  className="flex items-center gap-3 hover:opacity-80 transition"
                >
                  {seller.avatar_url ? (
                    <img
                      src={seller.avatar_url}
                      alt={seller.full_name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-teal-500/30"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-teal-500/30">
                      {seller.full_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-white hover:text-teal-400">{seller.full_name}</p>
                    <p className="text-xs text-gray-400">LabCred: {seller.trust_score || 0}</p>
                  </div>
                </Link>

                {/* Contact Buttons */}
                <div className="space-y-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  {listing.kakao_link && (
                    <a
                      href={listing.kakao_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-2 px-4 rounded-xl font-bold transition text-center text-sm"
                      style={{ background: 'rgba(250, 204, 21, 0.15)', color: '#facc15' }}
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
                {isOwner && !listing.is_sold && (
                  <div className="space-y-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <Link
                      href={`/listing/${listing.id}/edit`}
                      className="block w-full py-2 px-4 rounded-xl font-bold transition text-center text-sm"
                      style={{ background: 'rgba(20,184,166,0.15)', color: '#2dd4bf' }}
                    >
                      Edit Listing
                    </Link>
                    <button
                      onClick={handleMarkAsSold}
                      disabled={markingSold}
                      className="block w-full py-2 px-4 rounded-xl font-bold transition text-center text-sm disabled:opacity-50 cursor-pointer"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
                    >
                      {markingSold ? 'Marking as Sold...' : 'Mark as Sold'}
                    </button>
                  </div>
                )}

                {isOwner && listing.is_sold && (
                  <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                      <p className="text-emerald-400 font-bold text-sm">{'\u2713'} Marked as Sold</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Post Info */}
            <div className="glass rounded-2xl p-6 space-y-3 text-center">
              <div>
                <p className="text-xs text-gray-400 uppercase mb-1">Posted by</p>
                <Link
                  href={`/profile/${seller?.id}`}
                  className="text-white font-bold hover:text-teal-400 transition"
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
                <p className="text-2xl font-black text-emerald-400">
                  {'\u20A9'}{listing.price.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
