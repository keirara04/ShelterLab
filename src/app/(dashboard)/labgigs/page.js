'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/context/AuthContext'
import { GIG_TYPES, UNIVERSITIES } from '@/services/utils/constants'
import AuthModal from '@/shared/components/AuthModal'
import LogoHome from '@/shared/components/LogoHome'

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateString).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export default function LabGigsPage() {
  const { isAuthenticated, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [gigTypeFilter, setGigTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showBetaBanner, setShowBetaBanner] = useState(false)
  const searchTimerRef = useRef(null)

  useEffect(() => {
    const dismissed = localStorage.getItem('labgigs_beta_banner_dismissed')
    if (!dismissed) setShowBetaBanner(true)
  }, [])

  const dismissBetaBanner = () => {
    setShowBetaBanner(false)
    localStorage.setItem('labgigs_beta_banner_dismissed', '1')
  }

  const fetchGigs = async (page = 1, search = '', gigType = 'all') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        category: 'services',
        page: String(page - 1),
        limit: '15',
      })
      if (search) params.set('search', search)
      if (gigType && gigType !== 'all') params.set('gig_type', gigType)
      if (profile?.university) params.set('viewer_university', profile.university)

      const res = await fetch(`/api/listings?${params}`)
      const data = await res.json()
      if (!data.success) return

      const gigsData = data.data || []
      setTotalPages(data.pagination?.pages || 1)

      if (gigsData.length > 0) {
        const ids = gigsData.map(g => g.id).join(',')
        const countsRes = await fetch(`/api/gig-comments?listing_ids=${ids}`)
        const countsData = await countsRes.json()
        const countsMap = countsData.data || {}
        setGigs(gigsData.map(g => ({ ...g, comment_count: countsMap[g.id] || 0 })))
      } else {
        setGigs([])
      }
    } catch (err) {
      console.error('Failed to fetch gigs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) return
    fetchGigs(currentPage, searchQuery, gigTypeFilter)
  }, [authLoading, isAuthenticated, currentPage, gigTypeFilter, profile?.university])

  const handleSearch = (value) => {
    setSearchQuery(value)
    clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setCurrentPage(1)
      fetchGigs(1, value, gigTypeFilter)
    }, 400)
  }

  const handleShare = async (e, gig) => {
    e.stopPropagation()
    const url = `${window.location.origin}/labgigs/${gig.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: gig.title, url })
      } else {
        await navigator.clipboard.writeText(url)
      }
    } catch { /* user cancelled */ }
  }

  const getGigTypeInfo = (gigType) => GIG_TYPES.find(gt => gt.id === gigType) || GIG_TYPES[0]

  const formatPrice = (gig) => {
    if (gig.pricing_type === 'negotiable' || gig.gig_type === 'looking_for') {
      return gig.gig_type === 'looking_for'
        ? (gig.price > 0 ? `Budget: ₩${gig.price.toLocaleString()}` : 'Open Budget')
        : 'Negotiable'
    }
    const suffix = gig.pricing_type === 'per_hour' ? '/hr' : gig.pricing_type === 'per_session' ? '/session' : ''
    return `₩${(gig.price ?? 0).toLocaleString()}${suffix}`
  }

  const isPriceAmber = (gig) => gig.pricing_type === 'negotiable' || gig.gig_type === 'looking_for'

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#000000' }}>
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 30% 0%, rgba(20,184,166,0.1) 0%, transparent 50%), radial-gradient(ellipse at 70% 20%, rgba(52,211,153,0.06) 0%, transparent 50%)',
        }} />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-6">
          <div className="mb-5">
            <LogoHome />
          </div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-black text-white">LabGigs</h1>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider" style={{ background: 'rgba(20,184,166,0.15)', color: '#14b8a6', border: '1px solid rgba(20,184,166,0.3)' }}>
                Campus Only
              </span>
            </div>
            {isAuthenticated && (
              <Link
                href="/labgigs/dashboard"
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:bg-teal-400/10"
                style={{ color: '#14b8a6', border: '1px solid rgba(20,184,166,0.25)' }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                My Gigs
              </Link>
            )}
          </div>
          <p className="text-gray-500 text-sm max-w-md leading-relaxed mb-5">
            Offer services or find what you need — tutoring, moving help, language exchange, and more.
          </p>

          {/* Beta banner */}
          {showBetaBanner && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-2xl" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-300 font-bold mb-0.5">New feature in ShelterLab!</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Found a bug or have an idea?{' '}
                  <a
                    href="mailto:shelterlab.contact@gmail.com?subject=LabGigs%20Feedback"
                    className="text-amber-300 hover:underline underline-offset-2 font-semibold"
                  >
                    Drop us a message
                  </a>
                  {' '}— we read every one.
                </p>
              </div>
              <button
                onClick={dismissBetaBanner}
                className="shrink-0 text-gray-600 hover:text-gray-400 transition-colors cursor-pointer mt-0.5"
                aria-label="Dismiss"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search gigs…"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-white text-sm outline-none placeholder-gray-600"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div className="flex gap-2">
              {[{ id: 'all', name: 'All', color: '#9ca3af' }, ...GIG_TYPES].map(gt => {
                const active = gigTypeFilter === gt.id
                return (
                  <button
                    key={gt.id}
                    onClick={() => { setGigTypeFilter(gt.id); setCurrentPage(1) }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap"
                    style={{
                      background: active ? (gt.bg || 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.04)',
                      border: active ? `1.5px solid ${gt.color}50` : '1px solid rgba(255,255,255,0.07)',
                      color: active ? gt.color : '#9ca3af',
                    }}
                  >
                    {gt.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Post Feed */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Login wall for unauthenticated users */}
        {!authLoading && !isAuthenticated ? (
          <div className="relative">
            {/* Fake blurred gig cards as background preview */}
            <div className="space-y-2 pointer-events-none select-none" style={{ filter: 'blur(3px)', opacity: 0.35 }}>
              {[
                { type: 'OFF', title: 'Python & Data Science Tutoring', meta: 'Korea University · 2m ago', price: '₩25,000/hr', w1: 'w-2/3', w2: 'w-full', w3: 'w-4/5' },
                { type: 'LF', title: 'Looking for someone to help move furniture', meta: 'Yonsei · 14m ago', price: 'Open Budget', w1: 'w-1/2', w2: 'w-full', w3: 'w-3/5' },
                { type: 'OFF', title: 'English / Korean Language Exchange', meta: 'Seoul Nat\'l · 1h ago', price: 'Negotiable', w1: 'w-3/4', w2: 'w-5/6', w3: 'w-2/3' },
              ].map((c, i) => (
                <div key={i} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full" style={{ background: 'linear-gradient(135deg,#14b8a6,#5eead4)' }} />
                    <div className={`h-2.5 ${c.w1} rounded-full bg-white/20`} />
                    <div className="h-2 w-12 rounded-full bg-white/10 ml-auto" />
                  </div>
                  <div className={`h-4 ${c.w2} rounded-full bg-white/15 mb-2`} />
                  <div className={`h-3 ${c.w3} rounded-full bg-white/10 mb-3`} />
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-16 rounded-full bg-teal-400/20" />
                    <div className="h-5 w-20 rounded-full bg-white/10" />
                  </div>
                </div>
              ))}
            </div>

            {/* Gradient fade */}
            <div className="absolute inset-x-0 bottom-0 h-48 pointer-events-none" style={{ background: 'linear-gradient(to top, #000000 40%, transparent)' }} />

            {/* CTA card */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-6 px-4">
              <div
                className="w-full max-w-sm rounded-2xl px-6 py-6 flex flex-col items-center text-center"
                style={{ background: 'rgba(10,10,10,0.85)', border: '1px solid rgba(20,184,166,0.25)', backdropFilter: 'blur(16px)' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)' }}
                >
                  <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.5-1.5 4.5-3 5.5V17H9v-2.5C7.5 13.5 6 11.5 6 9a6 6 0 0 1 6-6z" />
                  </svg>
                </div>
                <h2 className="text-base font-black text-white mb-1">Join to explore LabGigs</h2>
                <p className="text-xs text-gray-500 leading-relaxed mb-5">
                  Discover services posted by students at your campus — tutoring, moving help, language exchange, and more.
                </p>
                <div className="flex items-center gap-2.5 w-full">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-black text-black transition-opacity hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #14b8a6, #5eead4)' }}
                  >
                    Sign In
                  </button>
                  <a
                    href="/signup"
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-300 text-center transition-colors hover:text-white hover:border-white/25"
                    style={{ border: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    Sign Up
                  </a>
                </div>
              </div>
            </div>

            {/* Spacer so CTA card has room */}
            <div className="h-52" />
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="h-3 w-32 rounded" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>
                <div className="h-5 w-3/4 rounded mb-2" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="h-3 w-full rounded mb-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="h-3 w-2/3 rounded mb-3" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="flex gap-2">
                  <div className="h-5 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="h-5 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : gigs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)' }}>
              <svg className="w-7 h-7 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-white mb-2">No gigs yet</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">Be the first to post a LabGig for your campus community!</p>
            {isAuthenticated ? (
              <Link href="/labgigs/new" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black text-black" style={{ background: 'linear-gradient(135deg, #14b8a6, #5eead4)' }}>
                Post a LabGig
              </Link>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black text-black" style={{ background: 'linear-gradient(135deg, #14b8a6, #5eead4)' }}>
                Sign in to post
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {gigs.map((gig) => {
                const gtInfo = getGigTypeInfo(gig.gig_type)
                const hasImage = gig.image_urls?.length > 0
                const uniName = UNIVERSITIES.find(u => u.id === gig.profiles?.university)?.shortName || gig.profiles?.university || ''

                return (
                  <div
                    key={gig.id}
                    onClick={() => router.push(`/labgigs/${gig.id}`)}
                    className="rounded-2xl p-4 cursor-pointer transition-all duration-150"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.055)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  >
                    {/* Author meta */}
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      {/* Avatar */}
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-black shrink-0"
                        style={{ background: 'linear-gradient(135deg, #14b8a6, #5eead4)' }}>
                        {gig.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      {/* Username — profile link */}
                      <Link
                        href={`/profile/${gig.seller_id}`}
                        onClick={e => e.stopPropagation()}
                        className="text-xs font-bold text-teal-400 hover:underline underline-offset-2"
                      >
                        {gig.profiles?.full_name || 'Unknown'}
                      </Link>
                      {uniName && (
                        <>
                          <span className="text-gray-700 text-xs">·</span>
                          <span className="text-[11px] text-gray-500">{uniName}</span>
                        </>
                      )}
                      <span className="text-gray-700 text-xs">·</span>
                      <span className="text-[11px] text-gray-600">{timeAgo(gig.created_at)}</span>
                      {!gig.visible_to_all && (
                        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#6b7280' }}>
                          Campus
                        </span>
                      )}
                    </div>

                    {/* Main content row */}
                    <div className="flex gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h3 className="text-base font-black text-white leading-snug mb-1 pr-1">{gig.title}</h3>
                        {/* Description */}
                        {gig.description && (
                          <p className="text-xs text-gray-500 leading-relaxed mb-2.5 line-clamp-2">{gig.description}</p>
                        )}
                        {/* Badges + price */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-black"
                            style={{ background: gtInfo.bg, color: gtInfo.color, border: `1px solid ${gtInfo.color}25` }}
                          >
                            {gtInfo.name}
                          </span>
                          <span className="text-sm font-black" style={{ color: isPriceAmber(gig) ? '#fbbf24' : '#34d399' }}>
                            {formatPrice(gig)}
                          </span>
                        </div>
                        {/* Footer actions */}
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5 text-xs text-gray-600">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {gig.comment_count} {gig.comment_count === 1 ? 'comment' : 'comments'}
                          </span>
                          <button
                            onClick={(e) => handleShare(e, gig)}
                            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share
                          </button>
                        </div>
                      </div>

                      {/* Thumbnail */}
                      {hasImage && (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 self-start mt-0.5">
                          <img
                            src={gig.image_urls[0]}
                            alt={gig.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg text-xs font-bold text-gray-400 disabled:opacity-30 transition-colors hover:bg-white/5">
                  Previous
                </button>
                <span className="text-xs text-gray-500">{currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg text-xs font-bold text-gray-400 disabled:opacity-30 transition-colors hover:bg-white/5">
                  Next
                </button>
              </div>
            )}

            {/* Post CTA */}
            <div className="text-center mt-8 mb-4">
              {isAuthenticated ? (
                <Link href="/labgigs/new" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black text-black transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #14b8a6, #5eead4)' }}>
                  Post a LabGig
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                </Link>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black text-black transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #14b8a6, #5eead4)' }}>
                  Sign in to post a LabGig
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} redirectPath="/labgigs" />
    </div>
  )
}
