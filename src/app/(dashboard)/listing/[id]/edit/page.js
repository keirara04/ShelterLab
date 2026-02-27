'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/shared/context/AuthContext'
import { supabase } from '@/services/supabase'
import { CATEGORIES, CONDITIONS, SERVICE_PRICING_TYPES, GIG_TYPES, isServiceListing } from '@/services/utils/constants'
import LogoHome from '@/shared/components/LogoHome'

export default function EditListingPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    categories: [],
    condition: 'good',
    kakaoLink: '',
    pricingType: 'flat',
    visibleToAll: false,
    gigType: 'offering',
  })

  useEffect(() => {
    if (params.id) fetchListing()
  }, [params.id])

  const fetchListing = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', params.id)
        .single()
      if (fetchError) throw fetchError
      if (data.seller_id !== user?.id) {
        setError('You do not have permission to edit this listing')
        return
      }
      setListing(data)
      setFormData({
        title: data.title,
        description: data.description || '',
        price: data.price.toString(),
        categories: data.categories || [],
        condition: data.condition || 'good',
        kakaoLink: data.kakao_link || '',
        pricingType: data.pricing_type || 'flat',
        visibleToAll: data.visible_to_all || false,
        gigType: data.gig_type || 'offering',
      })
    } catch (err) {
      setError('Failed to load listing')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    const isServiceEdit = formData.categories.includes('services')
    const priceVal = parseFloat(formData.price) || 0
    const allowZeroPrice = isServiceEdit && (formData.pricingType === 'negotiable' || formData.gigType === 'looking_for')

    const errors = []
    if (!formData.title.trim() || formData.title.trim().length < 3) errors.push('Title must be at least 3 characters')
    if (!allowZeroPrice && (!formData.price || priceVal <= 0)) errors.push('Price must be greater than 0')
    if (priceVal > 9_999_999) errors.push('Price cannot exceed ₩9,999,999')
    if (formData.categories.length === 0) errors.push('Select at least one category')

    if (errors.length > 0) {
      setError(errors)
      setSaving(false)
      return
    }

    try {
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          title: formData.title.trim(),
          description: formData.description,
          price: priceVal,
          categories: formData.categories,
          condition: isServiceEdit ? 'good' : formData.condition,
          kakao_link: formData.kakaoLink.trim() || null,
          ...(isServiceEdit && {
            pricing_type: formData.pricingType,
            visible_to_all: formData.visibleToAll,
            gig_type: formData.gigType,
          }),
        })
        .eq('id', params.id)
        .eq('seller_id', user?.id)
      if (updateError) throw updateError
      setSaved(true)
      setTimeout(() => router.push(`/listing/${params.id}`), 900)
    } catch (err) {
      setError(err.message || 'Failed to save listing')
    } finally {
      setSaving(false)
    }
  }

  const handleCategoryChange = (categoryId) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId) ? [] : [categoryId],
    }))
  }

  const isService = formData.categories.includes('services')
  const titleLen = formData.title.length
  const descLen = formData.description.length
  const descColor = descLen >= 950 ? 'text-red-400' : descLen >= 800 ? 'text-amber-400' : 'text-gray-500'

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-gray-400 text-sm font-medium">Loading listing…</p>
        </div>
      </div>
    )
  }

  // ── Permission error ─────────────────────────────────────────────────────────
  if (error && !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#000000' }}>
        <div className="glass-strong rounded-3xl p-10 text-center max-w-sm w-full">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white mb-2">Can't Edit</h2>
          <p className="text-gray-400 text-sm mb-6">{Array.isArray(error) ? error[0] : error}</p>
          <Link
            href="/my-listings"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition"
            style={{ background: 'linear-gradient(135deg, #14b8a6, #06b6d4)' }}
          >
            ← Back to My Listings
          </Link>
        </div>
      </div>
    )
  }

  // ── Main form ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Logo */}
        <div className="mb-6">
          <LogoHome />
        </div>

        {/* Back + page title */}
        <div className="flex items-center gap-3 mb-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-white transition touch-manipulation shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-black text-white">{isService ? 'Edit LabGig' : 'Edit Listing'}</h1>
        </div>
        <p className="text-gray-500 text-sm mb-8 pl-12">{isService ? 'Update your gig details below' : 'Update your item details below'}</p>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl p-4 text-sm"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <div className="text-red-400 font-medium">
              {Array.isArray(error) ? (
                <ul className="space-y-0.5 list-disc list-inside">
                  {error.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              ) : error}
            </div>
          </div>
        )}

        {/* Success banner */}
        {saved && (
          <div
            role="status"
            className="mb-6 rounded-2xl p-4 text-sm flex items-center gap-2"
            style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.25)' }}
          >
            <svg className="w-4 h-4 text-teal-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-teal-400 font-medium">Saved! Redirecting…</span>
          </div>
        )}

        <form onSubmit={handleSave} noValidate className="space-y-4">

          {/* ── Item Details ─────────────────────────────────────────────────── */}
          <section aria-labelledby="section-details" className="glass-strong rounded-3xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-teal-500/5 rounded-3xl pointer-events-none" />
            <div className="relative space-y-5">

              <h2 id="section-details" className="font-bold text-white text-base">{isService ? 'Gig Details' : 'Item Details'}</h2>

              {/* Title */}
              <div>
                <label htmlFor="edit-title" className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Title <span className="text-teal-400" aria-hidden="true">*</span>
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., MacBook Pro M2, Zara jacket size M…"
                  className="sell-input w-full px-4 py-3.5 rounded-xl text-white outline-none placeholder-gray-600 text-base"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  maxLength={100}
                  required
                  aria-required="true"
                  aria-describedby="title-hint"
                />
                <div id="title-hint" className="flex justify-between mt-1.5">
                  <span className="text-[11px] text-gray-600">3–100 characters</span>
                  {titleLen > 0 && (
                    <span className={`text-[11px] font-medium ${titleLen >= 90 ? 'text-amber-400' : 'text-gray-600'}`}>
                      {titleLen}/100
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="edit-desc" className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Description
                </label>
                <textarea
                  id="edit-desc"
                  value={formData.description}
                  onChange={(e) => {
                    if (e.target.value.length <= 1000) setFormData({ ...formData, description: e.target.value })
                  }}
                  placeholder="Describe the condition, features, size, any defects… More detail = faster sale."
                  rows={5}
                  className="sell-input w-full px-4 py-3.5 rounded-xl text-white outline-none placeholder-gray-600 resize-none text-base"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  aria-describedby="desc-hint"
                />
                <div id="desc-hint" className="flex justify-between mt-1.5">
                  <span className="text-[11px] text-gray-600">Up to 1,000 characters</span>
                  {descLen > 0 && (
                    <span className={`text-[11px] font-medium ${descColor}`}>
                      {descLen}/1000{descLen >= 950 ? ' — almost full!' : descLen >= 800 ? ' — getting long' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div>
                <label htmlFor="edit-price" className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Price <span className="text-teal-400" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-base select-none pointer-events-none" aria-hidden="true">₩</span>
                  <input
                    id="edit-price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                    min="1"
                    max="9999999"
                    step="1"
                    className="sell-input w-full pl-9 pr-4 py-3.5 rounded-xl text-white outline-none placeholder-gray-600 text-base"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    required
                    aria-required="true"
                    aria-label="Price in Korean Won"
                  />
                </div>
              </div>

            </div>
          </section>

          {/* ── Condition (physical items) / Gig settings (services) ─────────── */}
          <section aria-labelledby="section-condition" className="glass-strong rounded-3xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-teal-500/5 rounded-3xl pointer-events-none" />
            <div className="relative space-y-5">
              {isService ? (
                <>
                  {/* Gig Type */}
                  <div>
                    <h2 id="section-condition" className="font-bold text-white text-base mb-4">Gig Type</h2>
                    <div className="grid grid-cols-2 gap-2.5">
                      {GIG_TYPES.map((gt) => {
                        const selected = formData.gigType === gt.id
                        return (
                          <button
                            key={gt.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, gigType: gt.id })}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer touch-manipulation"
                            style={{
                              background: selected ? gt.bg : 'rgba(255,255,255,0.04)',
                              border: selected ? `1.5px solid ${gt.color}60` : '1px solid rgba(255,255,255,0.1)',
                              color: selected ? gt.color : '#9ca3af',
                            }}
                          >
                            {gt.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  {/* Pricing Type */}
                  <div>
                    <h2 className="font-bold text-white text-base mb-4">Pricing Type</h2>
                    <div className="grid grid-cols-2 gap-2.5">
                      {SERVICE_PRICING_TYPES.map((pt) => {
                        const selected = formData.pricingType === pt.id
                        return (
                          <button
                            key={pt.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, pricingType: pt.id })}
                            className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer touch-manipulation"
                            style={{
                              background: selected ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.04)',
                              border: selected ? '1.5px solid rgba(20,184,166,0.45)' : '1px solid rgba(255,255,255,0.1)',
                              color: selected ? 'white' : '#9ca3af',
                            }}
                          >
                            <span>{pt.name}</span>
                            <span className="text-[10px] text-gray-500">{pt.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  {/* Visibility toggle */}
                  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white mb-0.5">Show to all universities</p>
                        <p className="text-[10px] text-gray-500">
                          {formData.visibleToAll ? 'Visible to students across all universities' : 'Only students from your university can see this gig'}
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
                </>
              ) : (
                <>
                  <h2 id="section-condition" className="font-bold text-white text-base mb-4">
                    Condition <span className="text-teal-400" aria-hidden="true">*</span>
                  </h2>
                  <fieldset>
                    <legend className="sr-only">Select item condition</legend>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {CONDITIONS.map((cond) => {
                        const isSelected = formData.condition === cond.id
                        return (
                          <label
                            key={cond.id}
                            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border cursor-pointer transition-all touch-manipulation ${
                              isSelected ? 'border-teal-500/60 text-white' : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'
                            }`}
                            style={isSelected ? { background: 'rgba(20,184,166,0.12)' } : { background: 'rgba(255,255,255,0.04)' }}
                          >
                            <input type="radio" name="condition" value={cond.id} checked={isSelected} onChange={() => setFormData({ ...formData, condition: cond.id })} className="sr-only" />
                            <span className="text-base leading-none" aria-hidden="true">{cond.icon}</span>
                            <span className="text-sm font-bold">{cond.name}</span>
                            {isSelected && (
                              <svg className="w-3.5 h-3.5 text-teal-400 ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  </fieldset>
                </>
              )}
            </div>
          </section>

          {/* ── Category ─────────────────────────────────────────────────────── */}
          <section aria-labelledby="section-category" className="glass-strong rounded-3xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-teal-500/5 rounded-3xl pointer-events-none" />
            <div className="relative">
              <h2 id="section-category" className="font-bold text-white text-base mb-1">
                Category <span className="text-teal-400" aria-hidden="true">*</span>
              </h2>
              <p className="text-[11px] text-gray-500 mb-4">Pick one that best fits your item</p>
              <fieldset>
                <legend className="sr-only">Select item category</legend>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {CATEGORIES.filter((cat) => cat.id !== 'all').map((cat) => {
                    const isSelected = formData.categories.includes(cat.id)
                    return (
                      <label
                        key={cat.id}
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border cursor-pointer transition-all touch-manipulation ${
                          isSelected
                            ? 'border-teal-500/60 text-white'
                            : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'
                        }`}
                        style={isSelected
                          ? { background: 'rgba(20,184,166,0.12)' }
                          : { background: 'rgba(255,255,255,0.04)' }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCategoryChange(cat.id)}
                          className="sr-only"
                        />
                        <span className="text-sm font-bold">{cat.name}</span>
                        {isSelected && (
                          <svg className="w-3.5 h-3.5 text-teal-400 ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            </div>
          </section>

          {/* ── Contact ──────────────────────────────────────────────────────── */}
          <section aria-labelledby="section-contact" className="glass-strong rounded-3xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-teal-500/5 rounded-3xl pointer-events-none" />
            <div className="relative space-y-4">
              <div>
                <h2 id="section-contact" className="font-bold text-white text-base mb-0.5">Contact Info</h2>
                <p className="text-[11px] text-gray-500">How buyers can reach you</p>
              </div>
              <div>
                <label htmlFor="edit-kakao" className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Kakao Open Chat Link
                </label>
                <input
                  id="edit-kakao"
                  type="url"
                  value={formData.kakaoLink}
                  onChange={(e) => setFormData({ ...formData, kakaoLink: e.target.value })}
                  placeholder="https://open.kakao.com/o/..."
                  className="sell-input w-full px-4 py-3.5 rounded-xl text-white outline-none placeholder-gray-600 text-base"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  aria-describedby="kakao-hint"
                />
                <p id="kakao-hint" className="text-[11px] text-gray-600 mt-1.5">Optional — leave blank to keep it unchanged</p>
              </div>
            </div>
          </section>

          {/* ── Actions ──────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || saved}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-base text-white transition-all touch-manipulation disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: saving || saved
                  ? 'rgba(20,184,166,0.4)'
                  : 'linear-gradient(135deg, #14b8a6, #06b6d4)',
              }}
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : saved ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved!
                </>
              ) : (
                'Save Changes'
              )}
            </button>
            <Link
              href="/my-listings"
              className="flex-1 flex items-center justify-center py-4 rounded-2xl font-bold text-base text-gray-400 hover:text-white transition touch-manipulation"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Cancel
            </Link>
          </div>

        </form>
      </div>
    </div>
  )
}
