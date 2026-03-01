'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/shared/context/AuthContext'
import { supabase } from '@/services/supabase'
import { SERVICE_PRICING_TYPES, GIG_TYPES } from '@/services/utils/constants'
import Link from 'next/link'
import LogoHome from '@/shared/components/LogoHome'

export default function EditLabGigPage() {
  const router = useRouter()
  const { id } = useParams()
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    kakaoLink: '',
    pricingType: 'flat',
    visibleToAll: false,
    gigType: 'offering',
  })

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.push(`/login?redirect=/labgigs/${id}/edit`)
      return
    }
    if (!id) return

    const fetchGig = async () => {
      setFetching(true)
      try {
        const res = await fetch(`/api/listings/${id}`)
        if (!res.ok) { setNotFound(true); return }
        const data = await res.json()
        const gig = data.listing
        if (!gig || gig.seller_id !== user?.id) { setNotFound(true); return }
        setFormData({
          title: gig.title || '',
          description: gig.description || '',
          price: gig.price ? String(Math.round(gig.price)) : '',
          kakaoLink: gig.kakao_link || '',
          pricingType: gig.pricing_type || 'flat',
          visibleToAll: gig.visible_to_all || false,
          gigType: gig.gig_type || 'offering',
        })
      } catch {
        setNotFound(true)
      } finally {
        setFetching(false)
      }
    }

    fetchGig()
  }, [authLoading, isAuthenticated, id, user?.id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const errors = []
      const trimmedTitle = formData.title.trim()
      if (!trimmedTitle || trimmedTitle.length < 3) errors.push('Title must be at least 3 characters')
      if (trimmedTitle.length > 100) errors.push('Title must be 100 characters or less')

      const price = parseFloat(formData.price) || 0
      const priceOptional = formData.pricingType === 'negotiable' || formData.gigType === 'looking_for'
      if (!priceOptional && price <= 0) errors.push('Rate must be greater than 0')
      if (price > 9999999) errors.push('Rate cannot exceed ₩9,999,999')

      if (!formData.kakaoLink.trim()) {
        errors.push('Kakao Open Chat link is required')
      } else if (!formData.kakaoLink.startsWith('https://open.kakao.com/o/')) {
        errors.push('Link must start with https://open.kakao.com/o/')
      }
      if (errors.length > 0) { setError(errors); setLoading(false); return }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Session expired — please sign in again'); setLoading(false); return }

      const response = await fetch(`/api/listings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: trimmedTitle,
          description: formData.description,
          price,
          kakaoLink: formData.kakaoLink.trim(),
          pricingType: formData.pricingType,
          visibleToAll: formData.visibleToAll,
          gigType: formData.gigType,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(Array.isArray(data.error) ? data.error.join(', ') : data.error || 'Failed to update LabGig')
      }

      router.push('/labgigs/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to update LabGig')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <div className="w-8 h-8 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#000000' }}>
        <div className="glass-strong rounded-3xl p-10 text-center max-w-sm w-full">
          <h1 className="text-2xl font-black mb-3 text-white">Not Found</h1>
          <p className="text-gray-400 mb-6 text-sm leading-relaxed">This gig doesn&apos;t exist or you don&apos;t have permission to edit it.</p>
          <Link href="/labgigs/dashboard" className="text-white px-8 py-3 rounded-xl font-bold inline-block text-sm transition-opacity hover:opacity-90" style={{ background: 'linear-gradient(135deg, #14b8a6, #06b6d4)' }}>
            My LabGigs
          </Link>
        </div>
      </div>
    )
  }

  const isLookingFor = formData.gigType === 'looking_for'
  const priceOptional = formData.pricingType === 'negotiable' || isLookingFor
  const descLen = formData.description.length
  const descColor = descLen >= 950 ? 'text-red-400' : descLen >= 800 ? 'text-amber-400' : 'text-gray-500'

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 pb-32" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-7">
          <LogoHome />
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/labgigs/dashboard" className="text-gray-500 hover:text-teal-400 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-3xl md:text-4xl font-black text-white">Edit LabGig</h1>
          </div>
          <p className="text-gray-500 text-sm pl-8">Update your gig details</p>
        </div>

        {/* Error banner */}
        {error && (
          <div role="alert" className="glass mb-6 rounded-2xl p-4 text-sm" style={{ borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)' }}>
            <div className="text-red-400 font-medium">
              {Array.isArray(error) ? (
                <ul className="space-y-0.5 list-disc list-inside">{error.map((e, i) => <li key={i}>{e}</li>)}</ul>
              ) : error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Gig Type */}
          <div className="glass-strong rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-teal-500/5 rounded-3xl pointer-events-none" />
            <div className="relative">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                What are you posting? <span className="text-teal-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {GIG_TYPES.map(gt => {
                  const selected = formData.gigType === gt.id
                  return (
                    <button
                      key={gt.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, gigType: gt.id })}
                      className="flex flex-col items-center gap-2 px-4 py-5 rounded-2xl text-sm font-bold transition-all duration-150 cursor-pointer touch-manipulation active:scale-95"
                      style={{
                        background: selected ? gt.bg : 'rgba(255,255,255,0.04)',
                        border: selected ? `2px solid ${gt.color}60` : '1.5px solid rgba(255,255,255,0.08)',
                        color: selected ? gt.color : '#9ca3af',
                      }}
                    >
                      {gt.id === 'offering' ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      )}
                      <div className="text-center">
                        <p className="font-black">{gt.name}</p>
                        <p className="text-[10px] font-medium opacity-70 mt-0.5">
                          {gt.id === 'offering' ? 'I have a service to offer' : "I'm looking for something"}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Gig Details */}
          <div className="glass-strong rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-teal-500/5 rounded-3xl pointer-events-none" />
            <div className="relative space-y-5">
              <h2 className="font-bold text-white text-base">Gig Details</h2>

              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Title <span className="text-teal-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder={isLookingFor ? 'e.g., Need a math tutor, Looking for moving help…' : 'e.g., English tutoring, Furniture assembly, Moving help…'}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl text-white outline-none placeholder-gray-600 text-base"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  minLength={3}
                  maxLength={100}
                  required
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[11px] text-gray-600">3–100 characters</p>
                  {formData.title.length > 0 && (
                    <p className={`text-[11px] font-medium ${formData.title.length >= 90 ? 'text-amber-400' : 'text-gray-600'}`}>
                      {formData.title.length}/100
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Description <span className="text-teal-400">*</span>
                </label>
                <textarea
                  placeholder={isLookingFor
                    ? 'Describe what you need, when, any requirements or budget range…'
                    : 'Describe your service, availability, experience, what you offer…'}
                  value={formData.description}
                  onChange={(e) => {
                    if (e.target.value.length <= 1000) setFormData({ ...formData, description: e.target.value })
                  }}
                  className="w-full px-4 py-3.5 rounded-xl text-white outline-none placeholder-gray-600 h-44 resize-none text-base"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  required
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[11px] text-gray-600">Up to 1,000 characters</p>
                  <p className={`text-[11px] font-medium ${descColor}`}>
                    {descLen}/1000{descLen >= 950 ? ' — almost full!' : descLen >= 800 ? ' — getting long' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Contact */}
          <div className="glass-strong rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-cyan-500/5 rounded-3xl pointer-events-none" />
            <div className="relative space-y-5">
              <h2 className="font-bold text-white text-base">Pricing & Contact</h2>

              {/* Pricing Type */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
                  Pricing Type <span className="text-teal-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICE_PRICING_TYPES.map(pt => {
                    const selected = formData.pricingType === pt.id
                    return (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, pricingType: pt.id })}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer touch-manipulation active:scale-95 ${selected ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        style={{
                          background: selected ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.04)',
                          border: selected ? '1.5px solid rgba(20,184,166,0.45)' : '1px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        <span>{pt.name}</span>
                        <span className="text-[10px] text-gray-500">{pt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Rate / Budget */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
                  {isLookingFor ? 'Budget' : 'Rate'}{' '}
                  {priceOptional
                    ? <span className="text-gray-600 text-[10px] font-medium ml-1">Optional</span>
                    : <span className="text-teal-400">*</span>
                  }
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400 font-black text-base pointer-events-none select-none">₩</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '')
                      if (raw.length <= 7) setFormData({ ...formData, price: raw })
                    }}
                    className="w-full pl-9 pr-4 py-3.5 rounded-xl text-white outline-none placeholder-gray-600 text-base font-semibold"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <p className="text-[11px] text-gray-600 mt-1.5">Max ₩9,999,999</p>
              </div>

              {/* Visibility toggle */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white mb-0.5">Show to all universities</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      {formData.visibleToAll
                        ? 'Visible to students across all universities'
                        : 'Only students from your university can see this gig'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, visibleToAll: !formData.visibleToAll })}
                    className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 cursor-pointer"
                    style={{ background: formData.visibleToAll ? 'rgba(20,184,166,0.5)' : 'rgba(255,255,255,0.15)' }}
                  >
                    <div
                      className="absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-200"
                      style={{
                        background: formData.visibleToAll ? '#14b8a6' : '#6b7280',
                        transform: formData.visibleToAll ? 'translateX(22px)' : 'translateX(2px)',
                      }}
                    />
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

              {/* Kakao */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
                  Kakao Open Chat <span className="text-teal-400">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://open.kakao.com/o/…"
                  value={formData.kakaoLink}
                  onChange={(e) => setFormData({ ...formData, kakaoLink: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl text-white outline-none placeholder-gray-600 text-sm"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-black text-base text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer touch-manipulation min-h-[52px] active:scale-[0.98] hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #14b8a6, #06b6d4)' }}
              >
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
