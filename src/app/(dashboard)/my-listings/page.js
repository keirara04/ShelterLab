'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

export default function MyListingsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all, active, sold
 
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    // Only fetch if user is loaded
    if (user?.id) {
      fetchMyListings()
    }
  }, [isAuthenticated, filter, user?.id])

  const fetchMyListings = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user?.id) {
        setError('User not loaded')
        setLoading(false)
        return
      }

      let query = supabase
        .from('listings')
        .select('id, title, description, price, image_urls, categories, condition, is_sold, created_at, seller_id, kakao_link, whatsapp_link')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      const { data, error: fetchError } = await query

      if (fetchError) {
        console.error('Supabase error:', fetchError)
        throw fetchError
      }

      setListings(data || [])
    } catch (err) {
      console.error('Error fetching listings:', err)
      setError(`Failed to load listings: ${err.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteListing = async (listingId) => {
    if (!confirm('Are you sure you want to delete this listing?')) return

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)
        .eq('seller_id', user?.id)

      if (error) throw error

      setListings((prev) => prev.filter((l) => l.id !== listingId))
    } catch (err) {
      console.error('Error deleting listing:', err)
      alert('Failed to delete listing')
    }
  }

  const handleToggleSold = async (listingId, currentStatus) => {
    const newStatus = !currentStatus
    const message = newStatus
      ? 'Mark this listing as sold?'
      : 'Mark this listing as available again?'

    if (!confirm(message)) return

    try {
      const response = await fetch(`/api/listings/${listingId}/mark-sold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status')
      }

      // Update local state with the response data directly
      setListings((prev) =>
        prev.map((l) =>
          l.id === listingId ? data.data : l
        )
      )
      
      // Refetch after a short delay to ensure DB replication
      setTimeout(() => {
        fetchMyListings()
      }, 500)
    } catch (err) {
      console.error('Error toggling sold status:', err)
      alert('Failed to update status: ' + err.message)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div
      className="min-h-screen py-12"
      style={{
        backgroundColor: '#000000'
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/profile" className="text-blue-400 hover:text-blue-300 active:text-blue-200 font-bold mb-4 inline-block py-2 touch-manipulation text-base">
            ← Back to Profile
          </Link>
          <h1 className="text-4xl font-black text-white mb-2">My Listings</h1>
          <p className="text-gray-400">Manage your items for sale</p>
        </div>

        {/* Filter Tabs */}
        {/* <div className="flex gap-3 mb-8 border-b border-white/10 pb-4">
          {[
            { id: 'all', label: 'All Listings' },
            { id: 'active', label: 'Active' },
            { id: 'sold', label: 'Sold' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 font-bold rounded-lg transition ${
                filter === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div> */}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white/5 rounded-xl p-6 border border-white/10 animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-white/10 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
                    <div className="h-6 bg-white/10 rounded w-1/3"></div>
                    <div className="h-4 bg-white/10 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          // Empty State
          <div className="text-center py-16">
            <h2 className="text-2xl font-black text-white mb-2">No listings yet</h2>
            <p className="text-gray-400 mb-6">Create your first listing to get started</p>
            <Link
              href="/sell"
              className="inline-block px-6 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg transition touch-manipulation min-h-[48px] text-base"
            >
              Create Listing
            </Link>
          </div>
        ) : (
          // Grid of Listings
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white/8 border border-white/15 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-xl"
              >
                {/* Image */}
                <div className="relative aspect-square bg-gray-800 overflow-hidden">
                  {listing.image_urls && listing.image_urls.length > 0 ? (
                    <>
                      <img
                        src={listing.image_urls[0]}
                        alt={listing.title}
                        width={400}
                        height={400}
                        className="w-full h-full object-cover"
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
                        <div className="relative bg-gradient-to-br from-red-500/90 to-red-600/90 backdrop-blur-sm px-6 py-3 sm:px-8 sm:py-4 rounded-xl border-2 border-white/20 shadow-2xl transform -rotate-12">
                          <p className="text-white font-black text-2xl sm:text-3xl tracking-wider drop-shadow-lg">SOLD</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  {/* Title */}
                  <h3 className="font-bold text-white text-sm sm:text-base line-clamp-2">
                    {listing.title}
                  </h3>

                  {/* Price */}
                  <div className="text-xl sm:text-2xl font-black text-green-400">
                    ₩{listing.price.toLocaleString()}
                  </div>

                  {/* Condition & Category */}
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

                  {/* Date */}
                  <div className="pt-2 sm:pt-3 border-t border-white/10">
                    <p className="text-xs text-gray-400 mb-3">
                      Posted {new Date(listing.created_at).toLocaleDateString()}
                    </p>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href={`/listing/${listing.id}`}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg text-xs transition text-center touch-manipulation min-h-[40px] flex items-center justify-center"
                        >
                          View
                        </Link>
                        {!listing.is_sold ? (
                          <Link
                            href={`/listing/${listing.id}/edit`}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold rounded-lg text-xs transition text-center touch-manipulation min-h-[40px] flex items-center justify-center"
                          >
                            Edit
                          </Link>
                        ) : (
                          <div></div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleToggleSold(listing.id, listing.is_sold)}
                          className={`px-3 py-2 ${
                            listing.is_sold
                              ? 'bg-green-500/20 hover:bg-green-500/30 active:bg-green-500/40 text-green-300'
                              : 'bg-orange-500/20 hover:bg-orange-500/30 active:bg-orange-500/40 text-orange-300'
                          } font-bold rounded-lg text-xs transition touch-manipulation min-h-[40px]`}
                        >
                          {listing.is_sold ? '↻ Unmark' : 'Mark Sold'}
                        </button>
                        <button
                          onClick={() => handleDeleteListing(listing.id)}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 text-red-300 font-bold rounded-lg text-xs transition touch-manipulation min-h-[40px]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}