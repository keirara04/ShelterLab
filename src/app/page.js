'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { CATEGORIES, UNIVERSITIES, UNIVERSITY_LOGOS } from '@/lib/constants'
import AuthModal from '@/components/AuthModal'

export default function HomePage() {
  const { isAuthenticated, profile, user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedUniversity, setSelectedUniversity] = useState('all')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedListingId, setSelectedListingId] = useState(null)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)

  // Default filter to user's university once profile loads
  useEffect(() => {
    if (profile?.university) {
      setSelectedUniversity(profile.university)
    }
  }, [profile?.university])

  // Fetch listings on mount and when filters change
  useEffect(() => {
    fetchListings()
  }, [selectedCategory, searchQuery, selectedUniversity])

  const fetchListings = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.set('category', selectedCategory)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (selectedUniversity !== 'all') params.set('university', selectedUniversity)

      const response = await fetch(`/api/listings?${params}`)
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Failed to load listings')

      setListings(result.data || [])
    } catch (err) {
      console.error('Error fetching listings:', err)
      setError('Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  const openAuthModal = (listingId) => {
    setSelectedListingId(listingId)
    setShowAuthModal(true)
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: 'url(/background.png)',
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        backgroundBlendMode: 'overlay'
      }}
    >
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 sticky top-0 z-40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 sm:gap-3 group cursor-pointer touch-manipulation"
            >
              <img
                src="/logo.png"
                alt="ShelterLab"
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300"
              />
            </button>

            {/* Right side actions - Desktop only */}
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated ? (
                <Link
                  href="/sell"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-blue-500/25"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Sell
                </Link>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 text-white font-bold text-sm transition-all duration-200"
                >
                  Sign in
                </button>
              )}
              {isAuthenticated && user && (
                <Link
                  href="/profile"
                  className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-teal-400/50 transition touch-manipulation flex-shrink-0"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'Profile'}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {profile?.full_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 pb-36 lg:pb-24">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 sm:mb-4">ShelterLab</h2>
          <p className="text-gray-400 text-base sm:text-lg mb-6 sm:mb-8 px-4">Find what you need, leave what you don't.</p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-4 px-4">
            <input
              type="text"
              placeholder="Search the marketplace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 sm:px-6 sm:py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:bg-white/20 transition text-sm sm:text-base"
            />
          </div>

          {/* University Filter */}
          <div className="flex gap-2 justify-center flex-wrap mb-6 sm:mb-8 px-4">
            <button
              onClick={() => setSelectedUniversity('all')}
              className={`px-4 py-2 rounded-full font-bold text-sm transition ${
                selectedUniversity === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300'
              }`}
            >
              All Universities
            </button>
            {UNIVERSITIES.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUniversity(u.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition ${
                  selectedUniversity === u.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300'
                }`}
              >
                <img src={UNIVERSITY_LOGOS[u.id]} alt="" className="w-5 h-5 object-contain rounded-full" />
                {u.name}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400 mb-8">
            {error}
          </div>
        )}

        {/* Results Count */}
        {!loading && !error && (
          <p className="text-gray-400 text-sm mb-6">
            Found {listings.length} listing{listings.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {listings.map((listing) => {
            const cardClass = "group w-full text-left bg-white/8 border border-white/15 rounded-xl overflow-hidden transition-all duration-300 backdrop-blur-xl"
            const cardInner = (
              <>
                {/* Image Container */}
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
                        <div className="relative bg-gradient-to-br from-red-500/90 to-red-600/90 backdrop-blur-sm px-6 py-3 sm:px-8 sm:py-4 rounded-xl border-2 border-white/20 shadow-2xl transform -rotate-12">
                          <p className="text-white font-black text-2xl sm:text-3xl tracking-wider drop-shadow-lg">SOLD</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Content */}
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
                    {listing.profiles?.university && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded bg-teal-500/20 text-teal-300 text-xs font-bold">
                        <img src={UNIVERSITY_LOGOS[listing.profiles.university]} alt="" className="w-3.5 h-3.5 object-contain rounded-full" />
                        {UNIVERSITIES.find(u => u.id === listing.profiles.university)?.name || listing.profiles.university}
                      </span>
                    )}
                  </div>
                  <div className="pt-2 sm:pt-3 border-t border-white/10 space-y-1 sm:space-y-2">
                    <div className="text-xs text-gray-400">
                      <span>Posted by </span>
                      <span className="text-white font-bold">
                        {listing.profiles?.full_name || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </span>
                      {isAuthenticated ? (
                        <span className="text-xs text-gray-400">View Details →</span>
                      ) : (
                        <span className="text-xs text-amber-400 font-bold">🔒 Sign in</span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )

            return isAuthenticated ? (
              <Link
                key={listing.id}
                href={`/listing/${listing.id}`}
                className={`${cardClass} hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20`}
              >
                {cardInner}
              </Link>
            ) : (
              <button
                key={listing.id}
                onClick={() => openAuthModal(listing.id)}
                className={`${cardClass} hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10 cursor-pointer`}
              >
                {cardInner}
              </button>
            )
          })}
        </div>

        {/* Empty State */}
        {!loading && listings.length === 0 && !error && (
          <div className="text-center py-12">
            <h3 className="text-2xl font-black text-white mb-4">No listings yet</h3>
            <p className="text-gray-400 mb-6">Create your first listing to get started</p>
            {isAuthenticated && (
              <Link
                href="/sell"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
              >
                Create Listing
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        redirectPath={selectedListingId ? `/listing/${selectedListingId}` : null}
      />

      {/* Floating Category Bar - Desktop */}
      <div className="hidden lg:flex fixed bottom-4 left-0 right-0 z-40 justify-center px-4 pointer-events-none">
        <div className="bg-gray-900/80 backdrop-blur-2xl border border-white/15 rounded-full px-3 py-2 flex gap-1.5 overflow-x-auto pointer-events-auto shadow-2xl max-w-2xl w-full scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs transition-all duration-200 whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Floating Category Button - Mobile */}
      {!showCategoryPicker && (
        <div className="lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => setShowCategoryPicker(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-sm touch-manipulation whitespace-nowrap"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            {(() => {
              const cat = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0]
              return (
                <>
                  {cat.icon && <span>{cat.icon}</span>}
                  <span>{cat.name}</span>
                  <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )
            })()}
          </button>
        </div>
      )}

      {/* Category Picker Sheet - Mobile */}
      {showCategoryPicker && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex items-end"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          onClick={() => setShowCategoryPicker(false)}
        >
          <div
            className="w-full pb-20 px-3 pointer-events-auto"
            onClick={e => e.stopPropagation()}
          >
            <div
              className="rounded-3xl overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
              }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/25" />
              </div>
              <div className="px-4 pt-2 pb-4">
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3 text-center">Category</p>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id)
                        setShowCategoryPicker(false)
                      }}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-150 touch-manipulation"
                      style={
                        selectedCategory === cat.id
                          ? {
                              background: 'rgba(59, 130, 246, 0.65)',
                              border: '1px solid rgba(59,130,246,0.5)',
                              color: 'white',
                              boxShadow: '0 2px 12px rgba(59,130,246,0.3)',
                            }
                          : {
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: 'rgba(255,255,255,0.75)',
                            }
                      }
                    >
                      {cat.icon && <span className="text-base">{cat.icon}</span>}
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}