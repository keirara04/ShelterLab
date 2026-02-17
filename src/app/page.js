'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/shared/context/AuthContext'
import { CATEGORIES, UNIVERSITIES, UNIVERSITY_LOGOS } from '@/services/utils/constants'
import AuthModal from '@/shared/components/AuthModal'

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
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const categoryDropdownRef = useRef(null)
  const [showUniversityPicker, setShowUniversityPicker] = useState(false)
  const universityPickerRef = useRef(null)
  const [showHeader, setShowHeader] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [notification, setNotification] = useState(null)
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)
  const [hasUnreadNotification, setHasUnreadNotification] = useState(false)

  // Hide/show header on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setShowHeader(currentScrollY < lastScrollY || currentScrollY < 10)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Close category dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setShowCategoryDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  // Reset to page 1 when filters or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, searchQuery, selectedUniversity])

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
      if (selectedUniversity !== 'all') params.set('university', selectedUniversity)
      params.set('limit', 100) // Fetch up to 100 listings for pagination
      // Don't send search to API, we'll filter on frontend for better UX

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

  // Filter listings on frontend for search (category, seller, title)
  const filteredListings = listings.filter((listing) => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase()
    const title = listing.title?.toLowerCase() || ''
    const seller = listing.profiles?.full_name?.toLowerCase() || ''
    const category = listing.categories?.[0]?.toLowerCase() || ''

    return title.includes(query) || seller.includes(query) || category.includes(query)
  })

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
              <p className="text-xs font-bold text-yellow-200">Version 0.1.1-beta</p>
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
                      <span className="text-yellow-200 font-semibold">Version 0.1.1-beta:</span>
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

              {/* Category Button - Mobile only */}
              <button
                onClick={() => setShowCategoryPicker(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white font-bold text-xs touch-manipulation"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255,255,255,0.18)',
                }}
              >
                {(() => {
                  const cat = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0]
                  return (
                    <>
                      {cat.icon && <span>{cat.icon}</span>}
                      <span>{cat.name}</span>
                      <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )
                })()}
              </button>

              {/* Notification Bell - Mobile only */}
              <div className="lg:hidden relative">
                <button
                  data-notification-bell
                  onClick={() => {
                    setShowNotificationPanel(!showNotificationPanel)
                    if (!showNotificationPanel) {
                      setHasUnreadNotification(false)
                    }
                  }}
                  className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    boxShadow: showNotificationPanel ? '0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.12)' : 'none',
                  }}
                >
                  <img src="/bell.svg" alt="Notifications" className="w-4 h-4" />
                  {hasUnreadNotification && (
                    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </button>

                {/* Notification Panel - Mobile */}
                <div className="absolute top-full right-0 mt-2 w-72 z-50" style={{ contain: 'layout style paint' }}>
                  {showNotificationPanel && notification && (
                    <div
                      data-notification-panel
                      className="rounded-2xl overflow-hidden p-4 opacity-100 pointer-events-auto"
                      style={{
                        background: 'rgba(0, 0, 0, 0.95)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                          <img src="/bell.svg" alt="" className="w-6 h-6 flex-shrink-0" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-white mb-1 truncate">
                            {notification.title || 'Updates Available'}
                          </h3>
                          <p className="text-xs text-gray-300 leading-relaxed break-words">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side actions - Desktop only */}
            <div className="hidden lg:flex items-center gap-4">              {/* Category Dropdown */}
              <div className="relative" ref={categoryDropdownRef}>
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold text-sm transition-all duration-200 cursor-pointer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.12)',
                  }}
                >
                  <span>{CATEGORIES.find(c => c.id === selectedCategory)?.name || 'All'}</span>
                  <svg className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showCategoryDropdown && (
                  <div
                    className="absolute top-full right-0 mt-2 w-48 rounded-2xl overflow-hidden py-1.5 opacity-100 pointer-events-auto transition-opacity duration-150"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(40px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
                    }}
                  >
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id)
                          setShowCategoryDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-bold transition-all duration-150 flex items-center gap-2 cursor-pointer"
                        style={
                          selectedCategory === cat.id
                            ? { background: 'rgba(59, 130, 246, 0.25)', color: 'rgba(147, 197, 253, 1)' }
                            : { color: 'rgba(255, 255, 255, 0.75)' }
                        }
                        onMouseEnter={(e) => {
                          if (selectedCategory !== cat.id) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                            e.currentTarget.style.color = 'white'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedCategory !== cat.id) {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)'
                          }
                        }}
                      >
                        {cat.icon && <span>{cat.icon}</span>}
                        <span>{cat.name}</span>
                        {selectedCategory === cat.id && (
                          <svg className="w-4 h-4 ml-auto" style={{ color: 'rgba(147, 197, 253, 1)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

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
              <div className="relative">
                <button
                  data-notification-bell
                  onClick={() => {
                    setShowNotificationPanel(!showNotificationPanel)
                    if (!showNotificationPanel) {
                      setHasUnreadNotification(false)
                    }
                  }}
                  className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    boxShadow: showNotificationPanel ? '0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.12)' : 'none',
                  }}
                >
                  <img src="/bell.svg" alt="Notifications" className="w-5 h-5" />
                  {hasUnreadNotification && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </button>
                  
                {/* Notification Panel */}
                <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 z-50" style={{ contain: 'layout style paint' }}>
                  {showNotificationPanel && notification && (
                    <div
                      data-notification-panel
                      className="rounded-2xl overflow-hidden p-4 opacity-100 pointer-events-auto"
                      style={{
                        background: 'rgba(0, 0, 0, 0.95)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                          <img src="/bell.svg" alt="" className="w-6 h-6 flex-shrink-0" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-white mb-1 truncate">
                            {notification.title || 'Updates Available'}
                          </h3>
                          <p className="text-xs text-gray-300 leading-relaxed break-words">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

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

          {/* University Filter */}
          <div className="flex justify-center mb-6 sm:mb-8" ref={universityPickerRef}>
            <div className="relative">
              {/* Trigger button */}
              <button
                onClick={() => setShowUniversityPicker(!showUniversityPicker)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-200 cursor-pointer"
                style={{
                  background: selectedUniversity !== 'all' ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.08)',
                  border: selectedUniversity !== 'all' ? '1px solid rgba(20,184,166,0.4)' : '1px solid rgba(255,255,255,0.15)',
                  color: 'white',
                  backdropFilter: 'blur(24px)',
                }}
              >
                {selectedUniversity !== 'all' ? (
                  <>
                    <img src={UNIVERSITY_LOGOS[selectedUniversity]} alt="" width={18} height={18} className="w-4 h-4 object-contain rounded-full" />
                    <span>{UNIVERSITIES.find(u => u.id === selectedUniversity)?.name}</span>
                  </>
                ) : (
                  <span>All Universities</span>
                )}
                <svg className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${showUniversityPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Grid popover */}
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
                  {/* All Universities option */}
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

                  {/* University grid */}
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
                        <img src={UNIVERSITY_LOGOS[u.id]} alt="" width={32} height={32} className="w-8 h-8 object-contain rounded-full" />
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
                    <span className="text-xl sm:text-2xl font-black text-emerald-400">{listing.price.toLocaleString()}</span>
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
                        <img src={UNIVERSITY_LOGOS[listing.profiles.university]} alt="" width={14} height={14} className="w-3.5 h-3.5 object-contain rounded-full" />
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
          <div className="text-center py-12">
            <h3 className="text-2xl font-black text-white mb-4">No results found</h3>
            <p className="text-gray-400">Try searching by item name, category, or seller</p>
          </div>
        )}

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

      {/* Footer - Minimalist & Clean */}
      <footer className="border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Simple Layout */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-8">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="ShelterLab" width={40} height={40} className="w-10 h-10 object-contain" />
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