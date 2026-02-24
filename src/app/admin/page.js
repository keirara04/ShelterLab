'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/shared/context/AuthContext'
import { supabase } from '@/services/supabase'
import { UNIVERSITIES } from '@/services/utils/constants'
import { formatTimeAgo } from '@/services/utils/helpers'
import Link from 'next/link'
import Image from 'next/image'
import LogoHome from '@/shared/components/LogoHome'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts'

export default function AdminPage() {
  const { user } = useAuth()
  const isAdminUser = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  // Enhanced stats (charts, activity, expiring)
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Push notification state
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notificationError, setNotificationError] = useState(null)
  const [notificationSuccess, setNotificationSuccess] = useState(null)

  useEffect(() => {
    if (!isAdminUser) return
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => { if (d.success) setStats(d.data) })
      .finally(() => setStatsLoading(false))
  }, [isAdminUser])

  const handlePushNotification = async (e) => {
    e.preventDefault()
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      setNotificationError('Title and message are required')
      return
    }
    setNotificationLoading(true)
    setNotificationError(null)
    setNotificationSuccess(null)
    try {
      let { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        const { data: refreshData } = await supabase.auth.refreshSession()
        session = refreshData?.session
      }
      if (!session) {
        try {
          const storedSession = localStorage.getItem('sb-xehylbvuqnwrgocgqelm-auth-token')
          if (storedSession) {
            const parsed = JSON.parse(storedSession)
            session = parsed.session || parsed
            if (session?.access_token && session?.refresh_token) {
              const { data: restored } = await supabase.auth.setSession({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
              })
              if (restored?.session) session = restored.session
            }
          }
        } catch (e) {
          console.error('Error parsing stored session:', e)
        }
      }
      if (!session || !session.access_token) {
        throw new Error('Session expired. Please log out and log back in.')
      }
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title: notificationTitle, message: notificationMessage }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to push notification')
      setNotificationSuccess('Notification pushed to all users!')
      setNotificationTitle('')
      setNotificationMessage('')
    } catch (err) {
      console.error('Error:', err)
      setNotificationError(err.message || 'Failed to push notification')
    } finally {
      setNotificationLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #000000 0%, #0a0f1a 40%, #0d1117 60%, #000000 100%)' }}>
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  if (!isAdminUser) {
    return (
      <div className="min-h-screen pt-20 pb-16 relative" style={{ background: 'linear-gradient(135deg, #000000 0%, #0a0f1a 40%, #0d1117 60%, #000000 100%)' }}>
        <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 0%, rgba(20,184,166,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(6,182,212,0.04) 0%, transparent 50%)' }} />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="glass-strong rounded-3xl p-8 text-center">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <h2 className="text-xl font-black text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 text-sm mb-6">You don&apos;t have permission to view this page.</p>
            <Link href="/profile" className="text-teal-400 hover:text-teal-300 font-bold text-sm transition-colors">
              &larr; Back to Profile
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-16 relative" style={{ background: 'linear-gradient(135deg, #000000 0%, #0a0f1a 40%, #0d1117 60%, #000000 100%)' }}>
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 20% 0%, rgba(20,184,166,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(6,182,212,0.04) 0%, transparent 50%)',
      }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <LogoHome />
            <Link href="/profile" className="text-teal-400 hover:text-teal-300 font-bold text-sm transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Profile
            </Link>
          </div>
          <div className="glass-strong rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.2)' }}>
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-white">Admin Dashboard</h1>
              <p className="text-sm text-gray-400 truncate">Signed in as <span className="text-indigo-400 font-semibold">{user?.email}</span></p>
            </div>
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <Link href="/admin/notifications" className="px-3 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Notification Page
              </Link>
            </div>
          </div>
        </div>

        {/* KPI Summary Bar */}
        {!statsLoading && stats && <AdminKPIBar stats={stats} />}

        {/* Analytics Charts */}
        {!statsLoading && stats && <AdminCharts stats={stats} />}

        {/* Expiring Listings Alert */}
        {stats?.expiringSoon?.length > 0 && <AdminExpiringListings listings={stats.expiringSoon} />}

        {/* Recent Activity Feed */}
        {stats?.recentActivity?.length > 0 && <AdminRecentActivity activity={stats.recentActivity} />}

        {/* User Management */}
        <AdminApprovedUsers />

        {/* Listing Management */}
        <AdminListings />

        {/* Push Notifications */}
        <div className="glass-strong rounded-3xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-black text-white mb-1">Push Notifications</h3>
              <p className="text-sm text-gray-400">Send notifications to all users</p>
            </div>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.15)' }}>
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>

          {notificationError && (
            <div className="rounded-2xl p-4 text-red-400 text-sm mb-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {notificationError}
            </div>
          )}
          {notificationSuccess && (
            <div className="rounded-2xl p-4 text-emerald-400 text-sm mb-4" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              &check; {notificationSuccess}
            </div>
          )}

          <form onSubmit={handlePushNotification} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Title</label>
              <input
                type="text"
                placeholder="e.g., New Features Available"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                disabled={notificationLoading}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-teal-500 focus:bg-white/8 transition disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Message</label>
              <textarea
                placeholder="e.g., Check out our latest features and bug fixes..."
                rows={4}
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                disabled={notificationLoading}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-teal-500 focus:bg-white/8 transition resize-none disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={notificationLoading}
              className="w-full px-6 py-3 rounded-xl font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: 'linear-gradient(135deg, #14b8a6, #06b6d4)' }}
            >
              {notificationLoading ? 'Pushing...' : 'Push Notification to All Users'}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-white/5">
            Only one notification can be active at a time. Pushing a new notification will replace the previous one.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── KPI Summary Bar ─── */
function AdminKPIBar({ stats }) {
  const kpis = [
    { label: 'Total GMV', value: `₩${(stats.totalGMV || 0).toLocaleString()}`, gradient: 'from-emerald-400 to-teal-400', text: 'text-emerald-400' },
    { label: 'Avg Rating', value: stats.averageRating > 0 ? `${stats.averageRating} ★` : '—', gradient: 'from-amber-400 to-yellow-400', text: 'text-amber-400' },
    { label: 'New Users (7d)', value: `+${stats.newSignupsThisWeek || 0}`, gradient: 'from-blue-400 to-cyan-400', text: 'text-blue-400' },
    { label: 'Active Listings', value: stats.activeListings ?? 0, gradient: 'from-purple-400 to-pink-400', text: 'text-purple-400' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="glass-strong rounded-2xl p-4 relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${kpi.gradient} opacity-[0.07] rounded-full blur-2xl -translate-y-6 translate-x-6`} />
          <p className={`text-2xl font-black ${kpi.text} relative z-10`}>{kpi.value}</p>
          <p className="text-xs text-gray-400 mt-1 relative z-10">{kpi.label}</p>
        </div>
      ))}
    </div>
  )
}

/* ─── Charts Section ─── */
const CHART_COLORS = ['#34d399', '#6b7280']
const UNIV_COLORS = ['#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#10b981']

const darkTooltipStyle = {
  contentStyle: { background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: '#fff' },
  cursor: { fill: 'rgba(255,255,255,0.05)' },
}

function UniversityTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, count } = payload[0].payload
  return (
    <div style={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 14px' }}>
      <p style={{ color: '#fff', fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>{name}</p>
      <p style={{ color: '#9ca3af', fontSize: '12px' }}>{count} user{count !== 1 ? 's' : ''}</p>
    </div>
  )
}

function AdminCharts({ stats }) {
  const listingData = [
    { name: 'Active', value: stats.activeListings ?? 0 },
    { name: 'Sold', value: stats.soldListings ?? 0 },
  ]

  return (
    <div className="glass-strong rounded-3xl p-6 mb-6">
      <h3 className="text-xl font-black text-white mb-6">Analytics</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Listings Donut */}
        <div className="glass-subtle rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-bold text-gray-300">Listings Breakdown</p>
            <p className="text-2xl font-black text-white">{stats.totalListings ?? 0}</p>
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={listingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {listingData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[0] }} />
              <span className="text-xs text-gray-400">Active ({stats.activeListings ?? 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[1] }} />
              <span className="text-xs text-gray-400">Sold ({stats.soldListings ?? 0})</span>
            </div>
          </div>
        </div>

        {/* Signups Bar Chart */}
        <div className="glass-subtle rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-bold text-gray-300">New Users (7 days)</p>
            <p className="text-2xl font-black text-teal-400">+{stats.newSignupsThisWeek ?? 0}</p>
          </div>
          {stats.signupsByDay?.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.signupsByDay} barCategoryGap="20%">
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip {...darkTooltipStyle} />
                <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-500 text-sm">No signup data</div>
          )}
        </div>
      </div>

      {/* University Distribution */}
      {stats.universityBreakdown?.length > 0 && (
        <div className="glass-subtle rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-bold text-gray-300">University Distribution</p>
            <p className="text-sm text-gray-400">{stats.totalUsers ?? 0} total users</p>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(160, stats.universityBreakdown.length * 40)}>
            <BarChart data={stats.universityBreakdown} layout="vertical" barCategoryGap="16%">
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v.length > 18 ? v.slice(0, 18) + '...' : v}
              />
              <XAxis type="number" allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<UniversityTooltip />} cursor={false} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} label={{ position: 'right', fill: '#d1d5db', fontSize: 12, fontWeight: 700 }}>
                {(stats.universityBreakdown || []).map((_, i) => (
                  <Cell key={i} fill={UNIV_COLORS[i % UNIV_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

/* ─── Expiring Listings Alert ─── */
function AdminExpiringListings({ listings }) {
  return (
    <div className="glass-strong rounded-3xl p-6 mb-6" style={{ borderLeft: '4px solid rgba(245,158,11,0.5)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-black text-white">Expiring Soon</h3>
          <p className="text-xs text-gray-400">{listings.length} listing{listings.length !== 1 ? 's' : ''} expiring within 7 days</p>
        </div>
      </div>
      <div className="space-y-2">
        {listings.map((listing) => (
          <div key={listing.id} className="flex items-center justify-between glass-subtle rounded-xl p-3 glass-card">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white font-bold truncate">{listing.title}</p>
              <p className="text-xs text-gray-400">{listing.seller_name}</p>
            </div>
            <span className="text-xs font-black text-amber-400 flex-shrink-0 ml-3 px-2 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.1)' }}>
              {listing.days_remaining}d left
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Recent Activity Feed ─── */
const activityIcons = {
  listing_created: { svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />, bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
  listing_sold: { svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />, bg: 'rgba(20,184,166,0.15)', color: '#14b8a6' },
  user_joined: { svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />, bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  transaction_completed: { svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />, bg: 'rgba(139,92,246,0.15)', color: '#a78bfa' },
}

function AdminRecentActivity({ activity }) {
  return (
    <div className="glass-strong rounded-3xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(20,184,166,0.15)' }}>
          <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-black text-white">Recent Activity</h3>
          <p className="text-xs text-gray-400">Latest platform events</p>
        </div>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {activity.map((event, i) => {
          const icon = activityIcons[event.type] || activityIcons.listing_created
          return (
            <div key={i} className="flex items-center gap-3 glass-subtle rounded-xl p-3 glass-card">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: icon.bg }}>
                <svg className="w-4 h-4" fill="none" stroke={icon.color} viewBox="0 0 24 24">
                  {icon.svg}
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{event.description}</p>
                <p className="text-xs text-gray-500">{formatTimeAgo(event.created_at)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Community Members (User Management) ─── */
function AdminApprovedUsers() {
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchAllUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/approved-users?includeAll=true')
      const result = await response.json()
      if (response.ok && result.success) {
        setAllUsers(result.data || [])
      } else {
        setError(result.error || 'Failed to fetch users')
      }
    } catch (err) {
      setError('Error fetching users')
    } finally {
      setLoading(false)
    }
  }

  const handleGrantBadge = async (userId, grant) => {
    try {
      setError(null)
      setSuccess(null)
      const response = await fetch('/api/admin/grant-badge', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, grant }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setSuccess(`Badge ${grant ? 'granted' : 'revoked'} successfully`)
        await fetchAllUsers()
      } else {
        setError(data.error || 'Failed to update badge')
      }
    } catch (err) {
      setError('Error updating badge')
    }
  }

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Delete ${userEmail}? This is permanent and cannot be undone.`)) return
    try {
      setError(null)
      setSuccess(null)
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setSuccess(`${userEmail} deleted successfully`)
        await fetchAllUsers()
      } else {
        setError(data.error || 'Failed to delete user')
      }
    } catch (err) {
      setError('Error deleting user')
    }
  }

  useEffect(() => { fetchAllUsers() }, [])

  const filteredUsers = allUsers.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const verifiedCount = allUsers.filter(u => u.university_email_verified).length
  const totalCount = allUsers.length

  return (
    <div className="glass-strong rounded-3xl p-6 mb-6">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Community Members</h3>
            <p className="text-sm text-gray-400">Monitor & manage all users</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="text-center px-4 py-2 rounded-xl" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <p className="text-xl font-black text-emerald-400">{verifiedCount}</p>
            <p className="text-xs text-gray-400">Verified</p>
          </div>
          <div className="text-center px-4 py-2 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <p className="text-xl font-black text-blue-400">{totalCount}</p>
            <p className="text-xs text-gray-400">Total</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl p-4 text-red-400 text-sm mb-4 flex items-start gap-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="rounded-2xl p-4 text-emerald-400 text-sm mb-4 flex items-start gap-2" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <span className="text-base">&check;</span>
          <span>{success}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-teal-500 focus:bg-white/8 text-white placeholder-gray-500 text-sm transition"
        />
      </div>

      {/* User List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded-full w-1/3" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="h-3 rounded-full w-1/4" style={{ background: 'rgba(255,255,255,0.04)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="text-gray-400 font-medium">{searchTerm ? 'No users found' : 'No users yet'}</p>
          <p className="text-gray-500 text-xs mt-1">{searchTerm && 'Try adjusting your search'}</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="p-4 rounded-2xl glass-subtle glass-card transition-all duration-200"
            >
              <div className="flex flex-col gap-3">
                {/* Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-white font-bold text-base truncate">{user.full_name || 'User'}</h4>
                      {user.university_email_verified && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.2)', color: '#10b981' }}>
                          <img loading="lazy" src="/BadgeIcon.svg" alt="" className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                      {user.trust_score > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)', color: '#a855f7' }}>
                          {user.trust_score} pts
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-2 truncate">{user.email}</p>
                    {user.university && (
                      <p className="text-teal-400 text-xs mt-1 font-medium">{UNIVERSITIES.find(u => u.id === user.university)?.name || user.university}</p>
                    )}
                  </div>
                  {user.trust_score > 0 && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-black text-amber-400">{user.trust_score}</p>
                      <p className="text-xs text-gray-500">LabCred</p>
                    </div>
                  )}
                </div>

                {/* Middle Row */}
                <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
                  {user.created_at && (
                    <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap pt-2 border-t border-white/5">
                  <button
                    onClick={() => handleGrantBadge(user.id, !user.university_email_verified)}
                    className={`px-3 py-2 rounded-xl font-bold text-xs transition-all duration-200 flex items-center gap-1.5 ${
                      user.university_email_verified
                        ? 'text-red-400 hover:bg-red-500/15'
                        : 'text-emerald-400 hover:bg-emerald-500/15'
                    }`}
                    style={user.university_email_verified
                      ? { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }
                      : { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }
                    }
                    title={user.university_email_verified ? 'Revoke verification badge' : 'Grant verification badge'}
                  >
                    <img loading="lazy" src="/BadgeIcon.svg" alt="" className="w-3.5 h-3.5" />
                    {user.university_email_verified ? 'Revoke Badge' : 'Grant Badge'}
                  </button>

                  <button
                    onClick={() => window.location.href = `/profile/${user.id}`}
                    className="px-3 py-2 rounded-xl font-bold text-xs transition-all duration-200 flex items-center gap-1.5 text-blue-400 hover:bg-blue-500/15"
                    style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
                    title="View user profile"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Profile
                  </button>

                  <button
                    onClick={() => handleDeleteUser(user.id, user.email)}
                    className="px-3 py-2 rounded-xl font-bold text-xs transition-all duration-200 flex items-center gap-1.5 text-red-400 hover:bg-red-500/15 ml-auto"
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}
                    title="Permanently delete this user"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {!loading && filteredUsers.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/5 text-xs text-gray-500 text-center">
          Showing {filteredUsers.length} of {totalCount} users
        </div>
      )}
    </div>
  )
}

/* ─── Listing Management ─── */
function AdminListings() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  const fetchListings = () => {
    setLoading(true)
    fetch('/api/admin/listings')
      .then((r) => r.json())
      .then((d) => { if (d.success) setListings(d.data || []) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchListings() }, [])

  const toggleSold = async (listing) => {
    setActionLoading(listing.id + '-sold')
    await fetch('/api/admin/listings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: listing.id, isSold: !listing.is_sold }),
    })
    setListings((prev) => prev.map((l) => l.id === listing.id ? { ...l, is_sold: !l.is_sold } : l))
    setActionLoading(null)
  }

  const deleteListing = async (listingId) => {
    if (!confirm('Permanently delete this listing?')) return
    setActionLoading(listingId + '-delete')
    await fetch('/api/admin/listings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId }),
    })
    setListings((prev) => prev.filter((l) => l.id !== listingId))
    setActionLoading(null)
  }

  return (
    <div className="glass-strong rounded-3xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-white">Listing Management</h3>
        </div>
        <button
          onClick={fetchListings}
          className="text-xs text-gray-400 hover:text-teal-400 transition font-bold px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/8"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading listings...</p>
      ) : listings.length === 0 ? (
        <p className="text-gray-500 text-sm">No listings found.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {listings.map((listing) => (
            <div key={listing.id} className="flex items-center gap-3 glass-subtle rounded-xl p-3 glass-card">
              {listing.image_urls?.[0] ? (
                <Image src={listing.image_urls[0]} alt="" width={40} height={40} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold truncate">{listing.title}</p>
                <p className="text-gray-400 text-xs truncate">
                  {listing.profiles?.full_name || 'Unknown'} &middot; &#8361;{Number(listing.price).toLocaleString()}
                </p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                listing.is_sold ? 'text-gray-400' : 'text-emerald-400'
              }`} style={listing.is_sold ? { background: 'rgba(107,114,128,0.15)' } : { background: 'rgba(16,185,129,0.12)' }}>
                {listing.is_sold ? 'Sold' : 'Active'}
              </span>
              <button
                onClick={() => toggleSold(listing)}
                disabled={!!actionLoading}
                className="text-xs font-bold px-2.5 py-1.5 rounded-xl text-blue-400 hover:bg-blue-500/15 transition disabled:opacity-40 flex-shrink-0"
                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
              >
                {actionLoading === listing.id + '-sold' ? '...' : listing.is_sold ? 'Unmark' : 'Mark Sold'}
              </button>
              <button
                onClick={() => deleteListing(listing.id)}
                disabled={!!actionLoading}
                className="text-xs font-bold px-2.5 py-1.5 rounded-xl text-red-400 hover:bg-red-500/15 transition disabled:opacity-40 flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}
              >
                {actionLoading === listing.id + '-delete' ? '...' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
