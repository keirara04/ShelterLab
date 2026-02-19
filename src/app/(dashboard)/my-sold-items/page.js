'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/context/AuthContext'
import { supabase } from '@/services/supabase'

export default function MySoldItemsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (user?.id) {
      fetchMySoldListings()
    }
  }, [isAuthenticated, user?.id])

  const fetchMySoldListings = async () => {
    try {
      setLoading(true)
      setError(null)

      if (process.env.NODE_ENV === 'development') console.log('Fetching sold items for user:', user.id)

      const response = await fetch(`/api/sold-listings?userId=${user.id}`)
      const data = await response.json()

      if (process.env.NODE_ENV === 'development') console.log('API Response:', data)

      if (!response.ok) throw new Error(data.error)
      
      setListings(data.listings || [])
    } catch (err) {
      console.error('Error:', err)
      setError(`Failed to load: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div
      className="min-h-screen py-12"
      style={{
        backgroundColor: '#000000'
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/profile" className="text-blue-400 hover:text-blue-300 active:text-blue-200 font-bold mb-4 inline-block py-2 touch-manipulation text-base">
            ← Back to Profile
          </Link>
          <h1 className="text-4xl font-black text-white mb-2">My Sold Items</h1>
          <p className="text-gray-400">Items you've sold ({listings.length})</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading sold items...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-black text-white mb-2">No sold items yet</h2>
            <p className="text-gray-400 mb-6">Mark items as sold to see them here</p>
            <Link
              href="/profile"
              className="inline-block px-6 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg transition touch-manipulation min-h-[48px] text-base"
            >
              Back to Profile
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listing/${listing.id}`}
                className="bg-white/8 border border-white/15 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-xl"
              >
                <div className="relative h-40 sm:h-48 bg-gray-800 overflow-hidden">
                  {listing.image_urls && listing.image_urls.length > 0 ? (
                    <>
                      <img
                        src={listing.image_urls[0]}
                        alt={listing.title}
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

                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <h3 className="font-bold text-white text-sm sm:text-base line-clamp-2">
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
