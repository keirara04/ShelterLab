'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/shared/context/AuthContext'
import { supabase } from '@/services/supabase'
import { GIG_TYPES, UNIVERSITIES } from '@/services/utils/constants'
import { formatTimeAgo, formatGigPrice } from '@/services/utils/helpers'

export default function LabGigDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id
  const { user, isAuthenticated } = useAuth()

  const [listing, setListing] = useState(null)
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const [comments, setComments] = useState([])
  const [commentContent, setCommentContent] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [commentError, setCommentError] = useState(null)

  useEffect(() => {
    if (id) fetchGig()
  }, [id])

  useEffect(() => {
    if (listing) fetchComments()
  }, [listing?.id])

  const fetchGig = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/listings/${id}`)
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Not found')
      setListing(data.listing)
      setSeller(data.seller || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/gig-comments?listing_id=${id}`)
      const data = await res.json()
      if (data.success) setComments(data.data || [])
    } catch { /* silent */ }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!commentContent.trim()) return
    setSubmittingComment(true)
    setCommentError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/gig-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ listingId: id, content: commentContent.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setComments(prev => [...prev, data.data])
      setCommentContent('')
    } catch (err) {
      setCommentError(err.message)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await fetch('/api/gig-comments', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ commentId }),
      })
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch { /* silent */ }
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: listing?.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch { /* cancelled */ }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500" />
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#000000' }}>
        <div className="text-center">
          <p className="text-gray-400 mb-4">{error || 'Gig not found'}</p>
          <Link href="/labgigs" className="text-teal-400 font-bold hover:underline">← Back to LabGigs</Link>
        </div>
      </div>
    )
  }

  const gtInfo = GIG_TYPES.find(g => g.id === listing.gig_type) || GIG_TYPES[0]
  const isOwner = user?.id === listing.seller_id
  const isAmberPrice = listing.pricing_type === 'negotiable' || listing.gig_type === 'looking_for'
  const uniName = UNIVERSITIES.find(u => u.id === seller?.university)?.shortName || seller?.university || ''

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-10">

        {/* Back nav */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-400 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            LabGigs
          </button>
        </div>

        {/* Post card */}
        <div className="rounded-2xl p-5 sm:p-6 mb-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>

          {/* Author row */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {seller?.avatar_url ? (
              <img src={seller.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-black shrink-0"
                style={{ background: 'linear-gradient(135deg, #14b8a6, #5eead4)' }}>
                {seller?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <Link
              href={`/profile/${listing.seller_id}`}
              className="text-sm font-bold text-teal-400 hover:underline underline-offset-2"
            >
              {seller?.full_name || 'Unknown'}
            </Link>
            {uniName && (
              <>
                <span className="text-gray-700 text-xs">·</span>
                <span className="text-xs text-gray-500">{uniName}</span>
              </>
            )}
            <span className="text-gray-700 text-xs">·</span>
            <span className="text-xs text-gray-600">{formatTimeAgo(listing.created_at)}</span>
            {!listing.visible_to_all && (
              <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#6b7280' }}>
                Campus Only
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3">{listing.title}</h1>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span
              className="px-2.5 py-1 rounded-lg text-xs font-black"
              style={{ background: gtInfo.bg, color: gtInfo.color, border: `1px solid ${gtInfo.color}30` }}
            >
              {gtInfo.name}
            </span>
            <span className="text-lg font-black" style={{ color: isAmberPrice ? '#fbbf24' : '#34d399' }}>
              {formatGigPrice(listing)}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mb-6">
            {listing.description || <span className="text-gray-600 italic">No description provided.</span>}
          </p>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} className="mb-4" />

          {/* Actions row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Kakao contact */}
            {isAuthenticated ? (
              listing.kakao_link ? (
                <a
                  href={listing.kakao_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all hover:scale-105"
                  style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.48 3 2 6.82 2 11.5c0 2.93 1.74 5.52 4.38 7.09L5.2 21.6c-.1.35.27.64.57.44l3.82-2.55A12.7 12.7 0 0012 20c5.52 0 10-3.82 10-8.5S17.52 3 12 3z"/>
                  </svg>
                  {listing.gig_type === 'looking_for' ? 'Reach Out on Kakao' : 'Book on Kakao'}
                </a>
              ) : (
                <span className="text-xs text-gray-500">No contact info provided</span>
              )
            ) : (
              <Link
                href={`/login?redirect=/labgigs/${id}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all hover:scale-105"
                style={{ background: 'rgba(20,184,166,0.12)', color: '#14b8a6', border: '1px solid rgba(20,184,166,0.25)' }}
              >
                Sign in to contact
              </Link>
            )}

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {copied ? (
                <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              )}
              {copied ? 'Copied!' : 'Share'}
            </button>

            {/* Edit — owner only */}
            {isOwner && (
              <Link
                href={`/listing/${listing.id}/edit`}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-teal-400 transition-colors ml-auto"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Link>
            )}
          </div>
        </div>

        {/* Discussion */}
        <div className="rounded-2xl p-5 sm:p-6 mt-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Header */}
          <div className="flex items-center gap-2 mb-5">
            <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm font-black text-white">Discussion</span>
            <span className="text-xs text-gray-600">({comments.length})</span>
          </div>

          {/* Comment input — top, like Reddit */}
          {isAuthenticated ? (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-black shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #14b8a6, #5eead4)' }}>
                  {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 space-y-2">
                  <textarea
                    value={commentContent}
                    onChange={e => setCommentContent(e.target.value)}
                    placeholder="Ask a question or leave a comment…"
                    maxLength={500}
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white outline-none placeholder-gray-600 resize-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  {commentError && <p className="text-red-400 text-xs">{commentError}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-600">{commentContent.length}/500</span>
                    <button
                      type="submit"
                      disabled={submittingComment || !commentContent.trim()}
                      className="px-4 py-1.5 rounded-lg text-xs font-black text-black transition-all disabled:opacity-40 hover:scale-105 cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #14b8a6, #5eead4)' }}
                    >
                      {submittingComment ? 'Posting…' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-3 py-3 px-4 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-xs text-gray-500 flex-1">Sign in to join the discussion</p>
              <Link href={`/login?redirect=/labgigs/${id}`} className="text-xs font-bold text-teal-400 hover:underline">
                Sign in
              </Link>
            </div>
          )}

          {/* Comments list */}
          {comments.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-4">No comments yet — be the first!</p>
          ) : (
            <div className="space-y-5">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <div className="shrink-0">
                    {comment.profiles?.avatar_url ? (
                      <img src={comment.profiles.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-black shrink-0"
                        style={{ background: 'linear-gradient(135deg, #14b8a6, #5eead4)' }}>
                        {comment.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Link href={`/profile/${comment.user_id}`} className="text-xs font-bold text-teal-400 hover:underline underline-offset-2">
                        {comment.profiles?.full_name || 'User'}
                      </Link>
                      <span className="text-[10px] text-gray-600">{formatTimeAgo(comment.created_at)}</span>
                      {user?.id === comment.user_id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="ml-auto text-[10px] text-gray-600 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          delete
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
