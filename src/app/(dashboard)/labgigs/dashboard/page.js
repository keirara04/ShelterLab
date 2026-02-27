'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/context/AuthContext'
import { supabase } from '@/services/supabase'
import { GIG_TYPES } from '@/services/utils/constants'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const TIPS = [
  "Add your KakaoTalk link so students can reach you directly.",
  "Campus-only gigs attract more responses from classmates.",
  "Mark gigs as fulfilled when done — it keeps your profile trustworthy.",
  "Looking For gigs work great for finding study partners or moving helpers.",
  "Negotiable pricing often attracts more inquiries than a fixed rate.",
  "Write a clear description — students are more likely to reach out when they know exactly what you offer.",
]

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

function formatPrice(gig) {
  if (gig.pricing_type === 'negotiable' || gig.gig_type === 'looking_for') {
    return gig.gig_type === 'looking_for'
      ? (gig.price > 0 ? `₩${gig.price.toLocaleString()} budget` : 'Open Budget')
      : 'Negotiable'
  }
  const suffix = gig.pricing_type === 'per_hour' ? '/hr' : gig.pricing_type === 'per_session' ? '/session' : ''
  return `₩${(gig.price ?? 0).toLocaleString()}${suffix}`
}

function GigRow({ gig, onToggle, onDelete, deletingId, togglingId, router }) {
  const gtInfo = GIG_TYPES.find(t => t.id === gig.gig_type) || GIG_TYPES[0]
  const priceAmber = gig.pricing_type === 'negotiable' || gig.gig_type === 'looking_for'
  const isFulfilled = gig.is_sold
  const isDeleting = deletingId === gig.id
  const isToggling = togglingId === gig.id

  return (
    <div className="py-3 flex items-center gap-3 group" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Type badge */}
      <span
        className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide"
        style={{ background: gtInfo.bg, color: gtInfo.color }}
      >
        {gig.gig_type === 'looking_for' ? 'LF' : 'OFF'}
      </span>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <span
          className="text-sm font-semibold leading-snug line-clamp-1 cursor-pointer transition-colors"
          style={{ color: isFulfilled ? '#4b5563' : '#e5e7eb' }}
          onClick={() => router.push(`/labgigs/${gig.id}`)}
          onMouseEnter={e => { if (!isFulfilled) e.target.style.color = '#14b8a6' }}
          onMouseLeave={e => { e.target.style.color = isFulfilled ? '#4b5563' : '#e5e7eb' }}
        >
          {gig.title}
        </span>
        <p className="text-[11px] text-gray-600 mt-0.5">
          {timeAgo(gig.created_at)}
          {gig.visible_to_all ? '' : ' · campus only'}
        </p>
      </div>

      {/* Price */}
      <span
        className="shrink-0 text-xs font-bold hidden sm:block"
        style={{ color: isFulfilled ? '#4b5563' : (priceAmber ? '#d97706' : '#34d399') }}
      >
        {formatPrice(gig)}
      </span>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Toggle fulfilled */}
        <button
          onClick={() => onToggle(gig)}
          disabled={isToggling}
          title={isFulfilled ? 'Mark active' : (gig.gig_type === 'looking_for' ? 'Mark found' : 'Mark fulfilled')}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40"
          style={{ color: isFulfilled ? '#14b8a6' : '#6b7280' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {isToggling ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : isFulfilled ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Edit — only for active */}
        {!isFulfilled && (
          <Link
            href={`/listing/${gig.id}/edit`}
            title="Edit"
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: '#6b7280' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#9ca3af' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Link>
        )}

        {/* Delete */}
        <button
          onClick={() => onDelete(gig.id)}
          disabled={isDeleting}
          title="Delete"
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40"
          style={{ color: '#6b7280' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' }}
        >
          {isDeleting ? '…' : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

export default function LabGigsDashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.push('/login?redirect=/labgigs/dashboard')
      return
    }
    if (user?.id) fetchMyGigs()
  }, [authLoading, isAuthenticated, user?.id])

  const fetchMyGigs = async () => {
    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('listings')
        .select('id, title, description, price, categories, gig_type, pricing_type, visible_to_all, is_sold, created_at, kakao_link')
        .eq('seller_id', user.id)
        .contains('categories', ['services'])
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setGigs(data || [])
    } catch (err) {
      setError(`Failed to load gigs: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this gig? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)
        .eq('seller_id', user.id)
      if (error) throw error
      setGigs(prev => prev.filter(g => g.id !== id))
    } catch {
      alert('Failed to delete gig.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleFulfilled = async (gig) => {
    const label = gig.is_sold
      ? 'Mark this gig as active again?'
      : (gig.gig_type === 'looking_for' ? 'Mark this as found/closed?' : 'Mark this gig as fulfilled?')
    if (!confirm(label)) return
    setTogglingId(gig.id)
    try {
      const res = await fetch(`/api/listings/${gig.id}/mark-sold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGigs(prev => prev.map(g => g.id === gig.id ? { ...g, is_sold: data.data.is_sold } : g))
    } catch {
      alert('Failed to update gig status.')
    } finally {
      setTogglingId(null)
    }
  }

  if (authLoading || !isAuthenticated) return null

  const applyTypeFilter = (list) => activeFilter === 'all' ? list : list.filter(g => g.gig_type === activeFilter)
  const activeGigs = applyTypeFilter(gigs.filter(g => !g.is_sold))
  const pastGigs = applyTypeFilter(gigs.filter(g => g.is_sold))

  const rowProps = { onToggle: handleToggleFulfilled, onDelete: handleDelete, deletingId, togglingId, router }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/labgigs" className="text-gray-600 hover:text-gray-400 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white">My LabGigs</h1>
              {!loading && (
                <p className="text-xs text-gray-600 mt-0.5">
                  {activeGigs.length + pastGigs.length === 0
                    ? 'No gigs yet'
                    : `${gigs.filter(g => !g.is_sold).length} active · ${gigs.filter(g => g.is_sold).length} past`}
                </p>
              )}
            </div>
          </div>
          <Link
            href="/labgigs/new"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-black"
            style={{ background: 'linear-gradient(135deg, #14b8a6, #5eead4)' }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Post Gig
          </Link>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 mb-4">{error}</p>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="py-3 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-8 h-4 rounded bg-white/10 animate-pulse" />
                <div className="flex-1 h-4 rounded bg-white/8 animate-pulse" />
                <div className="w-16 h-4 rounded bg-white/6 animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && gigs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-600 text-sm mb-4">You haven't posted any gigs yet.</p>
            <Link
              href="/labgigs/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-black"
              style={{ background: 'linear-gradient(135deg, #14b8a6, #5eead4)' }}
            >
              Post Your First Gig
            </Link>
          </div>
        )}

        {!loading && gigs.length > 0 && (
          <>
            {/* Stats + chart */}
            {(() => {
              const totalCount = gigs.length
              const activeCount = gigs.filter(g => !g.is_sold).length
              const fulfilledCount = gigs.filter(g => g.is_sold).length
              const offeringCount = gigs.filter(g => g.gig_type === 'offering').length
              const lookingCount = gigs.filter(g => g.gig_type === 'looking_for').length
              const chartData = [
                { name: 'Offering', value: offeringCount, color: '#34d399' },
                { name: 'Looking For', value: lookingCount, color: '#fbbf24' },
              ].filter(d => d.value > 0)

              return (
                <div className="flex items-stretch gap-3 mb-5">
                  {/* Stat cards */}
                  <div className="flex gap-3 flex-1 flex-wrap">
                    {[
                      { label: 'Total', value: totalCount, color: '#e5e7eb' },
                      { label: 'Active', value: activeCount, color: '#14b8a6' },
                      { label: 'Fulfilled', value: fulfilledCount, color: '#6b7280' },
                    ].map(s => (
                      <div
                        key={s.label}
                        className="flex-1 min-w-[80px] rounded-2xl px-4 py-3 flex flex-col gap-1"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        <span className="font-black text-2xl leading-none" style={{ color: s.color }}>{s.value}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{s.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Donut chart */}
                  <div
                    className="shrink-0 rounded-2xl px-3 py-2 flex flex-col items-center justify-center gap-1"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', width: 130 }}
                  >
                    <div className="relative" style={{ width: 90, height: 90 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData} cx="50%" cy="50%" innerRadius={28} outerRadius={42} paddingAngle={chartData.length > 1 ? 3 : 0} dataKey="value" stroke="none">
                            {chartData.map((d) => <Cell key={d.name} fill={d.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-sm font-black text-white leading-none">{totalCount}</span>
                        <span className="text-[8px] text-gray-500 uppercase tracking-wide">gigs</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[9px] font-bold flex items-center gap-1" style={{ color: '#34d399' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />OFF
                      </span>
                      <span className="text-[9px] font-bold flex items-center gap-1" style={{ color: '#fbbf24' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />LF
                      </span>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Tip card */}
            <div
              className="flex items-start gap-3 rounded-xl px-4 py-3 mb-6 border-l-2"
              style={{ background: 'rgba(251,191,36,0.04)', borderColor: 'rgba(251,191,36,0.4)' }}
            >
              <svg className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#fbbf24' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.5-1.5 4.5-3 5.5V17H9v-2.5C7.5 13.5 6 11.5 6 9a6 6 0 0 1 6-6z" />
              </svg>
              <p className="text-xs text-gray-400 leading-relaxed"><span className="font-bold text-amber-400">Tip:</span> {tip}</p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6">
              {[
                { id: 'all', label: 'All' },
                { id: 'offering', label: 'Offering' },
                { id: 'looking_for', label: 'Looking For' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className="text-xs font-bold transition-colors pb-1"
                  style={{
                    color: activeFilter === f.id ? '#14b8a6' : '#4b5563',
                    borderBottom: activeFilter === f.id ? '1.5px solid #14b8a6' : '1.5px solid transparent',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Active gigs */}
            {activeGigs.length > 0 && (
              <div className="mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Active</p>
                {activeGigs.map(gig => (
                  <GigRow key={gig.id} gig={gig} {...rowProps} />
                ))}
              </div>
            )}

            {/* Past gigs */}
            {pastGigs.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-700 mb-1">Past</p>
                {pastGigs.map(gig => (
                  <GigRow key={gig.id} gig={gig} {...rowProps} />
                ))}
              </div>
            )}

            {/* Empty filter state */}
            {activeGigs.length === 0 && pastGigs.length === 0 && (
              <p className="text-gray-600 text-sm py-6 text-center">
                No {activeFilter === 'looking_for' ? '"looking for"' : activeFilter} gigs.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
