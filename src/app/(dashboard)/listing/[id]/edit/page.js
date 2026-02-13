'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { CATEGORIES, CONDITIONS } from '@/lib/constants'

export default function EditListingPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    categories: [],
    condition: 'good',
    kakaoLink: '',
  })

  useEffect(() => {
    if (params.id) {
      fetchListing()
    }
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

      // Check if user is the owner
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
      })
    } catch (err) {
      console.error('Error fetching listing:', err)
      setError('Failed to load listing')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (!formData.title.trim()) {
        setError('Title is required')
        setSaving(false)
        return
      }

      if (!formData.price || parseFloat(formData.price) <= 0) {
        setError('Price must be greater than 0')
        setSaving(false)
        return
      }

      if (formData.categories.length === 0) {
        setError('Select at least one category')
        setSaving(false)
        return
      }

      const { error: updateError } = await supabase
        .from('listings')
        .update({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          categories: formData.categories,
          condition: formData.condition,
          kakao_link: formData.kakaoLink || null,
        })
        .eq('id', params.id)
        .eq('seller_id', user?.id)

      if (updateError) throw updateError

      // Redirect to listing detail page
      router.push(`/listing/${params.id}`)
    } catch (err) {
      console.error('Error saving listing:', err)
      setError(err.message || 'Failed to save listing')
    } finally {
      setSaving(false)
    }
  }

  const handleCategoryChange = (category) => {
    setFormData((prev) => {
      const categories = prev.categories.includes(category) ? [] : [category]
      return { ...prev, categories }
    })
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: '#000000'
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-300 font-semibold">Loading listing...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
        </div>
      </div>
    )
  }

  if (error && !listing) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundColor: '#000000'
        }}
      >
        <div className="text-center">
          <h1 className="text-3xl font-black text-white mb-4">Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/my-listings"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
          >
            Back to My Listings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen py-12"
      style={{
        backgroundColor: '#000000'
      }}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="text-blue-400 hover:text-blue-300 active:text-blue-200 font-bold mb-6 inline-block cursor-pointer py-2 touch-manipulation text-base min-h-[44px]"
        >
          ← Back
        </button>

        <h1 className="text-4xl font-black text-white mb-2">Edit Listing</h1>
        <p className="text-gray-400 mb-8">Update your item details</p>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form - Liquidglass effect */}
        <form onSubmit={handleSave} className="bg-white/8 border border-white/15 rounded-2xl p-8 space-y-6 backdrop-blur-xl shadow-xl">
          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:bg-white/10 transition text-base"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              className="w-full px-4 py-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:bg-white/10 transition resize-none text-base"
              maxLength={2000}
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Price (₩)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              step="0.01"
              min="0"
              className="w-full px-4 py-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:bg-white/10 transition text-base"
            />
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Condition</label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              className="w-full px-4 py-4 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500 focus:bg-white/10 transition text-base"
            >
              {CONDITIONS.map((cond) => (
                <option key={cond.id} value={cond.id}>
                  {cond.name}
                </option>
              ))}
            </select>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-3">Categories</label>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.filter((cat) => cat.id !== 'all').map((cat) => (
                <label
                  key={cat.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition touch-manipulation min-h-[56px] ${
                    formData.categories.includes(cat.id)
                      ? 'bg-blue-500/20 border-blue-500'
                      : 'bg-white/5 border-white/10 hover:border-white/20 active:border-white/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(cat.id)}
                    onChange={() => handleCategoryChange(cat.id)}
                    className="w-4 h-4 rounded bg-white/10 border-white/20 text-blue-500 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-white font-bold text-sm">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Contact Methods */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <label className="block text-sm font-bold text-gray-300">Contact Information</label>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">Kakao Open Chat Link</label>
              <input
                type="url"
                placeholder="https://open.kakao.com/o/..."
                value={formData.kakaoLink}
                onChange={(e) => setFormData({ ...formData, kakaoLink: e.target.value })}
                className="w-full px-4 py-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:bg-white/10 transition text-base"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-4 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition touch-manipulation min-h-[48px] text-base"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/my-listings"
              className="flex-1 py-4 px-4 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold rounded-lg transition text-center touch-manipulation min-h-[48px] text-base"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}