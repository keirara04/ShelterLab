'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function SoldItemsPage() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchSoldListings()
  }, [])

  const fetchSoldListings = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true)
      if (isRefresh) setRefreshing(true)
      setError(null)

      // Add cache buster to force fresh data
      const response = await fetch(`/api/listings?is_sold=true&t=${Date.now()}`)
      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()

      // If no API endpoint, use supabase directly
      if (!data.listings) {
        const { data: supabaseData, error: fetchError } = await supabase
          .from('listings')
          .select('id, title, description, price, image_urls, categories, condition, is_sold, created_at, seller_id, updated_at')
          .eq('is_sold', true)
          .order('updated_at', { ascending: false })

        if (fetchError) {
          console.error('Supabase error:', fetchError)
          throw fetchError
        }

        setListings(supabaseData || [])
      } else {
        setListings(data.listings || [])
      }
    } catch (err) {
      console.error('Error fetching sold listings:', err)
      setError(`Failed to load sold items: ${err.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    await fetchSoldListings(true)
  }

  if (error) {
    return (
      <div
        className="min-h-screen py-12"
        style={{
          backgroundColor: '#000000'
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/" className="text-blue-400 hover:text-blue-300 active:text-blue-200 font-bold mb-4 inline-block py-2 touch-manipulation text-base">
              ← Back Home
            </Link>
            <h1 className="text-4xl font-black text-white mb-2">Sold Items</h1>
            <p className="text-gray-400">Browse items that have been sold</p>
          </div>

          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div
        className="min-h-screen py-12"
        style={{
          backgroundColor: '#000000'
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading sold items...</p>
          </div>
        </div>
      </div>
    )
  }

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
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 active:text-blue-200 font-bold mb-4 inline-block py-2 touch-manipulation text-base">
            ← Back Home
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-white mb-2">Sold Items</h1>
              <p className="text-gray-400">Browse items that have been sold ({listings.length})</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition touch-manipulation min-h-[48px] text-base"
            >
              {refreshing ? '⟳ Refreshing...' : '⟳ Refresh'}
            </button>
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-black text-white mb-2">No sold items yet</h2>
            <p className="text-gray-400 mb-6">Check back later for sold items</p>
            <Link
              href="/"
              className="inline-block px-6 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg transition touch-manipulation min-h-[48px] text-base"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listing/${listing.id}`}
                className="bg-white/8 border border-white/15 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-xl group"
              >
                {/* Image */}
                <div className="relative h-40 sm:h-48 bg-gray-800 overflow-hidden">
                  {listing.image_urls && listing.image_urls.length > 0 ? (
                    <>
                      <img
                        src={listing.image_urls[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
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

                  {/* Sold Badge */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 backdrop-blur-md flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-2xl transform rotate-3 scale-110"></div>
                      <div className="relative bg-gradient-to-br from-red-500/90 to-red-600/90 backdrop-blur-sm px-6 py-3 sm:px-8 sm:py-4 rounded-xl border-2 border-white/20 shadow-2xl transform -rotate-12">
                        <p className="text-white font-black text-2xl sm:text-3xl tracking-wider drop-shadow-lg">SOLD</p>
                      </div>
                    </div>
                  </div>
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
                    <p className="text-xs text-gray-400">
                      Sold on {new Date(listing.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
