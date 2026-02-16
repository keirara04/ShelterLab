'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/context/AuthContext'
import { supabase } from '@/services/supabase'

export default function MyListingsPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  // Mark as sold modal state
  const [soldModal, setSoldModal] = useState(null) // listing object
  const [buyerSearch, setBuyerSearch] = useState('')
  const [buyerResults, setBuyerResults] = useState([])
  const [selectedBuyer, setSelectedBuyer] = useState(null)
  const [soldLoading, setSoldLoading] = useState(false)
  const searchTimeout = useRef(null)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (user?.id) {
      fetchMyListings()
    }
  }, [isAuthenticated, authLoading, filter, user?.id])

  // Refetch when user returns to this tab after being away
  useEffect(() => {
    if (!user?.id) return
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchMyListings()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user?.id])

  // Debounced buyer search
  useEffect(() => {
    if (!buyerSearch || buyerSearch.trim().length < 2) {
      setBuyerResults([])
      return
    }
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      const res = await fetch(`/api/users/search?name=${encodeURIComponent(buyerSearch.trim())}`)
      const data = await res.json()
      // Filter out the current seller
      setBuyerResults((data.users || []).filter((u) => u.id !== user?.id))
    }, 300)
    return () => clearTimeout(searchTimeout.current)
  }, [buyerSearch, user?.id])

  const fetchMyListings = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user?.id) {
        setError('User not loaded')
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('listings')
        .select('id, title, description, price, image_urls, categories, condition, is_sold, created_at, seller_id, kakao_link, whatsapp_link')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setListings(data || [])
    } catch (err) {
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
      alert('Failed to delete listing')
    }
  }

  const handleToggleSold = async (listing) => {
    // If already sold — just unmark (no modal needed)
    if (listing.is_sold) {
      if (!confirm('Mark this listing as available again?')) return
      try {
        const response = await fetch(`/api/listings/${listing.id}/mark-sold`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        setListings((prev) => prev.map((l) => (l.id === listing.id ? data.data : l)))
        setTimeout(fetchMyListings, 500)
      } catch (err) {
        alert('Failed to update status: ' + err.message)
      }
      return
    }

    // Open modal for marking as sold
    setSoldModal(listing)
    setBuyerSearch('')
    setBuyerResults([])
    setSelectedBuyer(null)
  }

  const handleConfirmSold = async (skipBuyer = false) => {
    if (!soldModal) return
    setSoldLoading(true)
    try {
      const body = { userId: user.id }
      if (!skipBuyer && selectedBuyer) {
        body.buyerId = selectedBuyer.id
      }
      const response = await fetch(`/api/listings/${soldModal.id}/mark-sold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setListings((prev) => prev.map((l) => (l.id === soldModal.id ? data.data : l)))
      setSoldModal(null)
      setTimeout(fetchMyListings, 500)
    } catch (err) {
      alert('Failed to mark as sold: ' + err.message)
    } finally {
      setSoldLoading(false)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen py-12" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/profile" className="text-blue-400 hover:text-blue-300 font-bold mb-4 inline-block py-2 touch-manipulation text-base">
            ← Back to Profile
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black text-white">My Listings</h1>
            <button
              onClick={() => window.location.reload()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition touch-manipulation"
              title="Refresh"
            >
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </button>
          </div>
          <p className="text-gray-400">Manage your items for sale</p>
        </div>

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
              <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-white/10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-1/2" />
                    <div className="h-6 bg-white/10 rounded w-1/3" />
                    <div className="h-4 bg-white/10 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-black text-white mb-2">No listings yet</h2>
            <p className="text-gray-400 mb-6">Create your first listing to get started</p>
            <Link href="/sell" className="inline-block px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition touch-manipulation min-h-[48px] text-base">
              Create Listing
            </Link>
          </div>
        ) : (
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
                      <img src={listing.image_urls[0]} alt={listing.title} className="w-full h-full object-cover" />
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
                  {listing.is_sold && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 backdrop-blur-md flex items-center justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-2xl transform rotate-3 scale-110" />
                        <div className="relative bg-gradient-to-br from-red-500/90 to-red-600/90 backdrop-blur-sm px-6 py-3 sm:px-8 sm:py-4 rounded-xl border-2 border-white/20 shadow-2xl transform -rotate-12">
                          <p className="text-white font-black text-2xl sm:text-3xl tracking-wider drop-shadow-lg">SOLD</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <h3 className="font-bold text-white text-sm sm:text-base line-clamp-2">{listing.title}</h3>
                  <div className="text-xl sm:text-2xl font-black text-green-400">₩{listing.price.toLocaleString()}</div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-1 rounded bg-blue-500/30 text-blue-300 text-xs font-bold">{listing.condition}</span>
                    {listing.categories?.[0] && (
                      <span className="px-2 py-1 rounded bg-purple-500/30 text-purple-300 text-xs font-bold">{listing.categories[0]}</span>
                    )}
                  </div>
                  <div className="pt-2 sm:pt-3 border-t border-white/10">
                    <p className="text-xs text-gray-400 mb-3">Posted {new Date(listing.created_at).toLocaleDateString()}</p>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Link href={`/listing/${listing.id}`} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition text-center touch-manipulation min-h-[40px] flex items-center justify-center">
                          View
                        </Link>
                        {!listing.is_sold ? (
                          <Link href={`/listing/${listing.id}/edit`} className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-xs transition text-center touch-manipulation min-h-[40px] flex items-center justify-center">
                            Edit
                          </Link>
                        ) : (
                          <div />
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleToggleSold(listing)}
                          className={`px-3 py-2 ${
                            listing.is_sold
                              ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300'
                              : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300'
                          } font-bold rounded-lg text-xs transition touch-manipulation min-h-[40px]`}
                        >
                          {listing.is_sold ? '↻ Unmark' : 'Mark Sold'}
                        </button>
                        <button
                          onClick={() => handleDeleteListing(listing.id)}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold rounded-lg text-xs transition touch-manipulation min-h-[40px]"
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

      {/* Mark as Sold Modal */}
      {soldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'rgba(18,24,39,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <h2 className="text-xl font-black text-white mb-1">Mark as Sold</h2>
            <p className="text-gray-400 text-sm mb-5">
              Search for the buyer by name to link the sale. Their LabCred will update when they confirm.
            </p>

            {/* Item preview */}
            <div className="flex items-center gap-3 mb-5 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {soldModal.image_urls?.[0] && (
                <img src={soldModal.image_urls[0]} alt={soldModal.title} className="w-12 h-12 rounded-lg object-cover" />
              )}
              <div>
                <p className="text-white font-bold text-sm line-clamp-1">{soldModal.title}</p>
                <p className="text-green-400 font-black text-sm">₩{soldModal.price.toLocaleString()}</p>
              </div>
            </div>

            {/* Buyer search */}
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Search Buyer by Name</label>
            <input
              type="text"
              value={buyerSearch}
              onChange={(e) => { setBuyerSearch(e.target.value); setSelectedBuyer(null) }}
              placeholder="Type a name..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 mb-2"
            />

            {/* Search results */}
            {buyerResults.length > 0 && !selectedBuyer && (
              <div className="rounded-xl overflow-hidden border border-white/10 mb-4">
                {buyerResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setSelectedBuyer(u); setBuyerSearch(u.full_name); setBuyerResults([]) }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition text-left border-b border-white/5 last:border-0"
                  >
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.full_name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-black">
                        {u.full_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <p className="text-white text-sm font-bold">{u.full_name}</p>
                      {u.university && <p className="text-gray-500 text-xs">{u.university}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected buyer confirmation */}
            {selectedBuyer && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
                {selectedBuyer.avatar_url ? (
                  <img src={selectedBuyer.avatar_url} alt={selectedBuyer.full_name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-black">
                    {selectedBuyer.full_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-blue-300 text-sm font-bold">{selectedBuyer.full_name}</p>
                  <p className="text-blue-400/60 text-xs">Selected as buyer</p>
                </div>
                <button onClick={() => { setSelectedBuyer(null); setBuyerSearch('') }} className="text-gray-500 hover:text-white text-xs">✕</button>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => handleConfirmSold(false)}
                disabled={soldLoading || !selectedBuyer}
                className="w-full py-3 rounded-xl font-black text-sm bg-orange-500 hover:bg-orange-400 text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {soldLoading ? 'Marking...' : 'Confirm Sale with Buyer'}
              </button>
              <button
                onClick={() => handleConfirmSold(true)}
                disabled={soldLoading}
                className="w-full py-3 rounded-xl font-bold text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
              >
                Skip — sold offline (no LabCred update)
              </button>
              <button
                onClick={() => setSoldModal(null)}
                disabled={soldLoading}
                className="w-full py-2 rounded-xl font-bold text-xs text-gray-600 hover:text-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
