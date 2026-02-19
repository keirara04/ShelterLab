'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/shared/context/AuthContext'
import { CATEGORIES, UNIVERSITIES, UNIVERSITY_LOGOS } from '@/services/utils/constants'
import AuthModal from '@/shared/components/AuthModal'
import NotificationBell from '@/shared/components/NotificationBell'
import FilterDropdown from '@/shared/components/FilterDropdown'

export default function HomePage() {
  const { isAuthenticated, profile, user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedUniversity, setSelectedUniversity] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedListingId, setSelectedListingId] = useState(null)
  const [showUniversityPicker, setShowUniversityPicker] = useState(false)
  const universityPickerRef = useRef(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showHeader, setShowHeader] = useState(true)
  const lastScrollYRef = useRef(0)
  const showHeaderRef = useRef(true)
  const [notification, setNotification] = useState(null)
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)
  const [hasUnreadNotification, setHasUnreadNotification] = useState(false)

  // Hide/show header on scroll — throttled: only calls setShowHeader when direction changes
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const next = currentScrollY < lastScrollYRef.current || currentScrollY < 10
      if (next !== showHeaderRef.current) {
        showHeaderRef.current = next
        setShowHeader(next)
      }
      lastScrollYRef.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close university picker on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (universityPickerRef.current && !universityPickerRef.current.contains(e.target)) {
        setShowUniversityPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Default filter to user's university once profile loads
  useEffect(() => {
    if (profile?.university) {
      setSelectedUniversity(profile.university)
    }
  }, [profile?.university])

  // Close notification panel on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const notificationButton = document.querySelector('[data-notification-bell]')
      const notificationPanel = document.querySelector('[data-notification-panel]')
      if (
        showNotificationPanel &&
        !notificationButton?.contains(e.target) &&
        !notificationPanel?.contains(e.target)
      ) {
        setShowNotificationPanel(false)
      }
    }
    if (showNotificationPanel) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotificationPanel])

  // Fetch notification on mount
  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const response = await fetch('/api/notifications')
        const data = await response.json()
        if (data.success && data.data) {
          setNotification(data.data)
          setHasUnreadNotification(true)
        }
      } catch (err) {
        console.error('Error fetching notification:', err)
      }
    }
    fetchNotification()
  }, [])

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset to page 1 when filters or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, debouncedSearch, selectedUniversity, sortBy, minPrice, maxPrice])

  // Fetch listings on mount and when filters change
  useEffect(() => {
    fetchListings()
  }, [selectedCategory, debouncedSearch, selectedUniversity])

  const fetchListings = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.set('category', selectedCategory)
      if (selectedUniversity !== 'all') params.set('university', selectedUniversity)
      if (debouncedSearch) params.set('search', debouncedSearch)
      params.set('limit', '100')

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

  // Price filter + sort (search is now server-side)
  const filteredListings = useMemo(() => {
    let result = listings.filter((listing) => {
      const price = listing.price ?? 0
      if (minPrice !== '' && !isNaN(parseFloat(minPrice)) && price < parseFloat(minPrice)) return false
      if (maxPrice !== '' && !isNaN(parseFloat(maxPrice)) && price > parseFloat(maxPrice)) return false
      return true
    })
    if (sortBy === 'price_asc') result = [...result].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    else if (sortBy === 'price_desc') result = [...result].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    return result
  }, [listings, sortBy, minPrice, maxPrice])

  // Pagination
  const ITEMS_PER_PAGE = 12
  const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedListings = filteredListings.slice(startIndex, endIndex)

  const openAuthModal = (listingId) => {
    setSelectedListingId(listingId)
    setShowAuthModal(true)
  }

  const hasActiveFilters = selectedCategory !== 'all' || selectedUniversity !== 'all' || sortBy !== 'newest' || minPrice !== '' || maxPrice !== '' || searchQuery.trim() !== ''

  const clearFilters = () => {
    setSelectedCategory('all')
    setSelectedUniversity('all')
    setSortBy('newest')
    setMinPrice('')
    setMaxPrice('')
    setSearchQuery('')
  }

  const SORT_OPTIONS = [
    { id: 'newest', label: 'Newest First' },
    { id: 'price_asc', label: 'Price: Low → High' },
    { id: 'price_desc', label: 'Price: High → Low' },
  ]

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: '#000000',
      }}
    >
      {/* Header */}
      <div className={`bg-white/5 border-b border-white/10 fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
          {/* Warning Banner for Mobile */}
          <div className="flex sm:hidden gap-2 mb-2 pb-2 border-b border-white/10">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/> 
              <path d="M12 17h.01"/>
            </svg>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <p className="text-xs font-bold text-yellow-200">Version 0.1.2-beta</p>
              <p className="text-xs text-yellow-200/70">Lag & bugs possible. <a href="mailto:admin@shelterlab.shop?subject=ShelterLab%20Bug%20Report" className="underline hover:text-yellow-100">Report</a></p>
              <p className="text-xs text-gray-400">Best experience on desktop</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            {/* Left side - Logo + Warning */}
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 sm:gap-3 group cursor-pointer touch-manipulation flex-shrink-0"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                    <img
                      src="/logo.svg"
                      alt="ShelterLab"
                      width={40}
                      height={40}
                      className="w-full h-full object-contain group-hover:brightness-110 group-hover:rotate-6 transition-all duration-300"
                    />
                  </div>
                </button>

                {/* Warning Text - Desktop only */}
                <div className="hidden sm:flex flex-col gap-2">
                  <div className="flex items-center gap-3 text-xs">
                    <svg className="w-4 h-4 flex-shrink-0 text-yellow-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                      <path d="M12 9v4"/>
                      <path d="M12 17h.01"/>
                    </svg>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-200 font-semibold">Version 0.1.2-beta:</span>
                      <span className="text-yellow-200/80">Site in development. May experience lag, bugs, or data loss.</span>
                      <a
                        href="mailto:admin@shelterlab.shop?subject=ShelterLab%20Bug%20Report"
                        className="text-yellow-300 hover:text-yellow-100 underline transition font-semibold flex-shrink-0"
                      >
                        Report Bug
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Bell - Mobile only */}
              <div className="lg:hidden">
                <NotificationBell
                  size="sm"
                  showNotificationPanel={showNotificationPanel}
                  hasUnreadNotification={hasUnreadNotification}
                  notification={notification}
                  onToggle={() => {
                    setShowNotificationPanel(!showNotificationPanel)
                    if (!showNotificationPanel) setHasUnreadNotification(false)
                  }}
                />
              </div>
            </div>

            {/* Right side actions - Desktop only */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                href="/pasarmalam"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold transition-all duration-200"
                style={{
                  background: 'rgba(251,191,36,0.08)',
                  border: '1px solid rgba(251,191,36,0.2)',
                  color: '#fbbf24',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 7 Q7 5.5 8 4" />
                  <path d="M12 7 Q11 5.5 12 4" />
                  <path d="M2 7 L22 7 L22 11 Q19.5 13 17 11 Q14.5 13 12 11 Q9.5 13 7 11 Q4.5 13 2 11 Z" />
                  <rect x="3" y="11" width="18" height="8" rx="1" />
                  <circle cx="17" cy="21" r="1.5" />
                  <path d="M4 14 L1 9" />
                </svg>
                Pasar Malam
              </Link>

              <div className="w-px h-6 bg-white/15" />

              {/* Notification Bell - Desktop only */}
              <NotificationBell
                size="lg"
                showNotificationPanel={showNotificationPanel}
                hasUnreadNotification={hasUnreadNotification}
                notification={notification}
                onToggle={() => {
                  setShowNotificationPanel(!showNotificationPanel)
                  if (!showNotificationPanel) setHasUnreadNotification(false)
                }}
              />

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
                    <div className="w-9 h-9 flex items-center justify-center">
                      <Image
                        src={profile.avatar_url}
                        alt={profile.full_name || 'Profile'}
                        width={36}
                        height={36}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 pb-36 lg:pb-12 pt-32 sm:pt-32 md:pt-36">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 sm:mb-4">ShelterLab</h2>
          <p className="text-gray-400 text-base sm:text-lg mb-6 sm:mb-8 px-4">Find what you need, leave what you don't.</p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-full blur-lg group-focus-within:blur-xl transition-all duration-300 opacity-0 group-focus-within:opacity-100"></div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search the shelter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-500 outline-none focus:border-blue-400 focus:bg-white/15 transition duration-300 backdrop-blur-xl text-sm sm:text-base"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Search items by name, category, or seller</p>
          </div>

          {/* Filters — Row 1: Category + University + (desktop: Sort) + (mobile: toggle) */}
          <div className="flex justify-center items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
            <FilterDropdown
              options={CATEGORIES}
              value={selectedCategory}
              onChange={setSelectedCategory}
              color="blue"
            />

            {/* University Filter */}
            <div className="relative" ref={universityPickerRef}>
              <button
                onClick={() => setShowUniversityPicker(!showUniversityPicker)}
                aria-expanded={showUniversityPicker}
                aria-haspopup="listbox"
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-200 cursor-pointer"
                style={{
                  background: selectedUniversity !== 'all' ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.08)',
                  border: selectedUniversity !== 'all' ? '1px solid rgba(20,184,166,0.4)' : '1px solid rgba(255,255,255,0.15)',
                  color: 'white',
                  backdropFilter: 'blur(24px)',
                }}
              >
                {selectedUniversity !== 'all' ? (
                  <>
                    <img loading="lazy" src={UNIVERSITY_LOGOS[selectedUniversity]} alt="" width={18} height={18} className="w-4 h-4 object-contain rounded-full" />
                    <span className="hidden sm:inline">{UNIVERSITIES.find(u => u.id === selectedUniversity)?.name}</span>
                    <span className="sm:hidden">{UNIVERSITIES.find(u => u.id === selectedUniversity)?.name?.split(' ')[0]}</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">All Universities</span>
                    <span className="sm:hidden">Univ</span>
                  </>
                )}
                <svg className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${showUniversityPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showUniversityPicker && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 sm:w-96 rounded-2xl p-3 z-50"
                  style={{
                    background: 'rgba(15,15,20,0.92)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                >
                  <button
                    onClick={() => { setSelectedUniversity('all'); setShowUniversityPicker(false) }}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold mb-2 transition-all duration-150 flex items-center gap-2"
                    style={selectedUniversity === 'all'
                      ? { background: 'rgba(59,130,246,0.25)', color: 'rgba(147,197,253,1)' }
                      : { color: 'rgba(255,255,255,0.7)' }
                    }
                  >
                    <span className="text-base">🏫</span>
                    All Universities
                    {selectedUniversity === 'all' && (
                      <svg className="w-4 h-4 ml-auto" style={{ color: 'rgba(147,197,253,1)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="h-px mb-2" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="grid grid-cols-3 gap-2">
                    {UNIVERSITIES.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { setSelectedUniversity(u.id); setShowUniversityPicker(false) }}
                        className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-150"
                        style={selectedUniversity === u.id
                          ? { background: 'rgba(20,184,166,0.2)', border: '1px solid rgba(20,184,166,0.4)' }
                          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                        }
                      >
                        <img loading="lazy" src={UNIVERSITY_LOGOS[u.id]} alt="" width={32} height={32} className="w-8 h-8 object-contain rounded-full" />
                        <span className="text-xs font-bold leading-tight text-center" style={{ color: selectedUniversity === u.id ? 'rgba(94,234,212,1)' : 'rgba(255,255,255,0.75)' }}>
                          {u.name}
                        </span>
                        {selectedUniversity === u.id && (
                          <svg className="w-3.5 h-3.5" style={{ color: 'rgba(94,234,212,1)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sort — desktop only inline */}
            <div className="hidden sm:block">
              <FilterDropdown
                options={SORT_OPTIONS}
                value={sortBy}
                onChange={setSortBy}
                defaultValue="newest"
                color="purple"
                dropdownWidth="w-52"
                dropdownAlign="right-0"
              />
            </div>

            {/* Mobile: filter toggle + clear */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="sm:hidden flex items-center gap-1.5 px-3 py-2.5 rounded-full font-bold text-xs transition-all duration-200 cursor-pointer"
              style={{
                background: (showMobileFilters || sortBy !== 'newest' || minPrice || maxPrice) ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.08)',
                border: (showMobileFilters || sortBy !== 'newest' || minPrice || maxPrice) ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.15)',
                color: 'white',
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {(sortBy !== 'newest' || minPrice || maxPrice) && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 cursor-pointer"
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: 'rgba(252,165,165,1)',
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>

          {/* Mobile expanded filters panel */}
          {showMobileFilters && (
            <div className="sm:hidden flex flex-col gap-3 mb-4 px-2">
              <div className="flex items-center gap-2 justify-center">
                <FilterDropdown
                  options={SORT_OPTIONS}
                  value={sortBy}
                  onChange={setSortBy}
                  defaultValue="newest"
                  color="purple"
                  dropdownWidth="w-52"
                  dropdownAlign="left-0"
                />
              </div>
              <div className="flex items-center gap-2 justify-center">
                <input
                  type="number"
                  placeholder="Min ₩"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  min="0"
                  className="w-24 px-3 py-2 rounded-full text-white placeholder-gray-500 outline-none transition duration-200 text-xs text-center"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: minPrice !== '' ? '1px solid rgba(168,85,247,0.5)' : '1px solid rgba(255,255,255,0.15)',
                    MozAppearance: 'textfield',
                  }}
                />
                <span className="text-gray-500 text-xs font-bold">—</span>
                <input
                  type="number"
                  placeholder="Max ₩"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  min="0"
                  className="w-24 px-3 py-2 rounded-full text-white placeholder-gray-500 outline-none transition duration-200 text-xs text-center"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: maxPrice !== '' ? '1px solid rgba(168,85,247,0.5)' : '1px solid rgba(255,255,255,0.15)',
                    MozAppearance: 'textfield',
                  }}
                />
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 rounded-full text-xs font-bold cursor-pointer"
                    style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(252,165,165,1)' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Desktop: Price Range + Sort row */}
          <div className="hidden sm:flex justify-center items-center gap-3 mb-6 sm:mb-8 flex-wrap">
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min ₩"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min="0"
                className="w-28 px-3 py-2 rounded-full text-white placeholder-gray-500 outline-none transition duration-200 text-sm text-center"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: minPrice !== '' ? '1px solid rgba(168,85,247,0.5)' : '1px solid rgba(255,255,255,0.15)',
                  MozAppearance: 'textfield',
                }}
              />
              <span className="text-gray-500 text-sm font-bold">—</span>
              <input
                type="number"
                placeholder="Max ₩"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
                className="w-28 px-3 py-2 rounded-full text-white placeholder-gray-500 outline-none transition duration-200 text-sm text-center"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: maxPrice !== '' ? '1px solid rgba(168,85,247,0.5)' : '1px solid rgba(255,255,255,0.15)',
                  MozAppearance: 'textfield',
                }}
              />
            </div>
          </div>
        </div>

        {/* Loading State — Skeleton Grid */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden animate-pulse" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="aspect-square" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="p-3 sm:p-4 space-y-2.5">
                  <div className="h-3.5 rounded-full w-4/5" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="h-3 rounded-full w-3/5" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="h-6 rounded-full w-2/5" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="flex gap-2">
                    <div className="h-5 rounded w-14" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <div className="h-5 rounded w-18" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400 mb-8">
            {error}
          </div>
        )}


        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {paginatedListings.map((listing) => {
            const cardClass = "group w-full text-left bg-white/8 border border-white/15 rounded-xl overflow-hidden transition-all duration-300 backdrop-blur-xl hover:bg-white/12 hover:border-white/25 hover:shadow-2xl hover:shadow-blue-500/10"
            const cardInner = (
              <>
                {/* Image Container */}
                <div className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                  {listing.image_urls && listing.image_urls.length > 0 ? (
                    <>
                      <Image
                        src={listing.image_urls[0]}
                        alt={listing.title}
                        fill
                        sizes="(max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {listing.image_urls.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white font-bold border border-white/20 shadow-lg">
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
                <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                  <h3 className="font-bold text-white text-sm sm:text-base line-clamp-2 group-hover:text-blue-300 transition duration-300">
                    {listing.title}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400">₩</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-400">{(listing.price ?? 0).toLocaleString()}</span>
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
                        <img loading="lazy" src={UNIVERSITY_LOGOS[listing.profiles.university]} alt="" width={14} height={14} className="w-3.5 h-3.5 object-contain rounded-full" />
                        {UNIVERSITIES.find(u => u.id === listing.profiles.university)?.name || listing.profiles.university}
                      </span>
                    )}
                  </div>
                  <div className="pt-2 sm:pt-3 border-t border-white/10 space-y-1 sm:space-y-2">
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <span>Posted by </span>
                      <span className="text-white font-bold">
                        {listing.profiles?.full_name || 'Unknown'}
                      </span>
                      {listing.profiles?.university_email_verified && (
                        <img src="/BadgeIcon.svg" alt="Verified Student" width={14} height={14} className="w-3.5 h-3.5 object-contain" />
                      )}
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

            return (
              <Link
                key={listing.id}
                href={`/listing/${listing.id}`}
                className={`${cardClass} hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20`}
              >
                {cardInner}
              </Link>
            )
          })}
        </div>

        {/* Page Info */}
        {!loading && !error && filteredListings.length > 0 && (
          <div className="flex flex-col items-center gap-3 mt-8 mb-4">
            <p className="text-center text-xs text-gray-400 h-4">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredListings.length)} of {filteredListings.length}
            </p>

            {/* Pagination Controls - iPhone Sheet Style */}
            {totalPages > 1 && (
              <div
                className="flex items-center justify-center gap-2 p-3 rounded-full backdrop-blur-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                }}
              >
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 text-white"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex items-center gap-0.5 px-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-6 h-6 rounded-full text-xs font-semibold transition duration-200 ${currentPage === page
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 text-white"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* No Search Results State */}
        {!loading && listings.length > 0 && filteredListings.length === 0 && !error && (
          <div className="text-center py-16 px-4">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-black text-white mb-2">No results found</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              {searchQuery.trim()
                ? `Nothing matched "${searchQuery}" — try a different keyword or clear your filters`
                : 'No listings match your current filters'}
            </p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-200 cursor-pointer"
              style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', color: 'rgba(147,197,253,1)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && listings.length === 0 && !error && (
          <div className="text-center py-16 px-4">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-white mb-2">The shelter is empty</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">Be the first to list something — furniture, clothes, gadgets, anything goes.</p>
            {isAuthenticated ? (
              <Link
                href="/sell"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all duration-200"
                style={{ background: 'rgba(59,130,246,0.9)', color: 'white' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Post a Listing
              </Link>
            ) : (
              <p className="text-gray-500 text-sm">Sign in to post the first listing.</p>
            )}
          </div>
        )}
      </div>

      {/* Footer - Minimalist & Clean */}
      <footer className="border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Simple Layout */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-8">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <img loading="lazy" src="/logo.svg" alt="ShelterLab" width={40} height={40} className="w-10 h-10 object-contain" />
              <span className="text-white font-black text-2xl bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">ShelterLab</span>
            </div>

            {/* Links - Horizontal */}
            <div className="flex items-center gap-6 sm:gap-8">
              <Link href="/help-center" className="text-gray-400 text-sm hover:text-teal-400 transition">Help Center</Link>
              <Link href="/contact" className="text-gray-400 text-sm hover:text-teal-400 transition">Contact Us</Link>
              <Link href="/terms" className="text-gray-400 text-sm hover:text-teal-400 transition">Terms of Use</Link>
              <Link href="/privacy" className="text-gray-400 text-sm hover:text-teal-400 transition">Privacy Policy</Link>
            </div>
          </div>

          {/* Copyright - Simple */}
          <div className="border-t border-white/5 mt-8 pt-8">
            <p className="text-gray-400 text-xs text-center">© 2025 ShelterLab. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        redirectPath={selectedListingId ? `/listing/${selectedListingId}` : null}
      />

    </div>
  )
}