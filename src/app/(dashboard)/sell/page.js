'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { CATEGORIES, CONDITIONS } from '@/lib/constants'
import { validateImageFile } from '@/lib/helpers'
import Link from 'next/link'

// Image compression function
const compressImage = async (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (event) => {
            const img = new Image()
            img.src = event.target.result
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height

                // Resize if larger than 1920px
                if (width > 1920) {
                    height = (height * 1920) / width
                    width = 1920
                }

                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, width, height)

                canvas.toBlob(
                    (blob) => {
                        resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }))
                    },
                    'image/jpeg',
                    0.8
                )
            }
        }
    })
}

export default function SellPage() {
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [uploadingImages, setUploadingImages] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [pricingSuggestion, setPricingSuggestion] = useState(null)
    const [loadingPriceSuggestion, setLoadingPriceSuggestion] = useState(false)
    const fileInputRef = useRef(null)

    // Store files + their previews together to keep them in sync
    const [imageFiles, setImageFiles] = useState([])

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        categories: [],
        condition: 'good',
        kakaoLink: '',
    })

    if (!isAuthenticated) {
        return (
            <div
                className="min-h-screen flex items-center justify-center p-4"
                style={{
                    backgroundColor: '#000000',
                }}
            >
                <div className="glass-strong rounded-3xl p-8 text-center">
                    <h1 className="text-3xl font-black mb-4 text-white">Access Denied</h1>
                    <p className="text-gray-400 mb-6">You must be logged in to sell items.</p>
                    <Link
                        href="/login"
                        className="text-white px-8 py-3 rounded-xl font-bold inline-block"
                        style={{ background: 'linear-gradient(135deg, #14b8a6, #06b6d4)' }}
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        )
    }

    const handleImageSelect = async (e) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        if (imageFiles.length + files.length > 5) {
            setError('Maximum 5 images allowed')
            return
        }

        const newEntries = []
        for (const file of files) {
            const validation = validateImageFile(file)
            if (!validation.valid) {
                setError(validation.error)
                continue
            }

            // Compress image
            try {
                const compressedFile = await compressImage(file)
                newEntries.push({
                    file: compressedFile,
                    preview: URL.createObjectURL(compressedFile),
                })
            } catch (err) {
                setError(`Failed to compress image: ${file.name}`)
            }
        }

        if (newEntries.length > 0) {
            setImageFiles((prev) => [...prev, ...newEntries])
            setError(null)
        }

        // Reset input so the same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const removeImage = (index) => {
        setImageFiles((prev) => {
            const updated = [...prev]
            URL.revokeObjectURL(updated[index].preview)
            updated.splice(index, 1)
            return updated
        })
    }

    const uploadImages = async () => {
        setUploadProgress(0)
        setError(null)
        setUploadingImages(true)

        try {
            const body = new FormData()
            for (const entry of imageFiles) {
                body.append('files', entry.file)
            }
            body.append('userId', user.id)

            // Use XMLHttpRequest to track upload progress
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest()

                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100
                        setUploadProgress(Math.round(percentComplete))
                    }
                })

                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        const data = JSON.parse(xhr.responseText)
                        resolve(data.urls || [])
                    } else {
                        const data = JSON.parse(xhr.responseText)
                        reject(new Error(data.error || 'Upload failed'))
                    }
                })

                xhr.addEventListener('error', () => {
                    reject(new Error('Upload failed'))
                })

                xhr.open('POST', '/api/upload')
                xhr.send(body)
            })
        } catch (err) {
            setError(`Upload failed: ${err.message}`)
            return null
        } finally {
            setUploadingImages(false)
            setUploadProgress(0)
        }
    }

    // Get pricing suggestions from AI
    const fetchPricingSuggestion = async () => {
        if (formData.categories.length === 0) {
            setPricingSuggestion(null)
            return
        }

        setLoadingPriceSuggestion(true)
        try {
            const response = await fetch('/api/pricing-suggestion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    category: formData.categories[0],
                    condition: formData.condition,
                }),
            })

            if (response.ok) {
                const data = await response.json()
                setPricingSuggestion(data)
            }
        } catch (err) {
            console.error('Error fetching price suggestion:', err)
        } finally {
            setLoadingPriceSuggestion(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            if (!formData.title.trim()) {
                setError('Title is required')
                setLoading(false)
                return
            }
            if (!formData.price || parseFloat(formData.price) <= 0) {
                setError('Price must be greater than 0')
                setLoading(false)
                return
            }
            if (formData.categories.length === 0) {
                setError('Select at least one category')
                setLoading(false)
                return
            }
            if (imageFiles.length === 0) {
                setError('Please add at least one image')
                setLoading(false)
                return
            }
            if (!formData.kakaoLink.trim()) {
                setError('Kakao Open Chat link is required')
                setLoading(false)
                return
            }

            // Upload all images
            const uploadedUrls = await uploadImages()
            if (!uploadedUrls || uploadedUrls.length === 0) {
                setLoading(false)
                return
            }

            // Create listing
            const response = await fetch('/api/listings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    categories: formData.categories,
                    condition: formData.condition,
                    kakaoLink: formData.kakaoLink,
                    imageUrls: uploadedUrls,
                    userId: user?.id,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to create listing')
            }

            await response.json()
            router.push('/')
        } catch (err) {
            setError(err.message || 'Failed to create listing')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="min-h-screen p-4 md:p-12 pb-32"
            style={{
                backgroundColor: '#000000',
            }}
        >
            <div className="max-w-2xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="text-teal-400 hover:text-teal-300 active:text-teal-200 font-bold mb-6 inline-block cursor-pointer py-2 touch-manipulation text-base min-h-[44px]"
                >
                    ← Return
                </button>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
                        Sell an Item
                    </h1>
                    <p className="text-gray-400">Share what you don't need with the community</p>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="glass-strong rounded-3xl p-8 space-y-6 relative overflow-hidden"
                >
                    {/* Inner shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-teal-500/5 rounded-3xl pointer-events-none" />

                    <div className="relative space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="glass rounded-xl p-4 text-red-400 font-medium text-sm" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                                {error}
                            </div>
                        )}

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">
                                Item Title *
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., MacBook Pro 2023"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-4 rounded-xl text-white outline-none transition-all duration-200 placeholder-gray-500 focus:ring-2 focus:ring-teal-500/50 text-base"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">3-100 characters</p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">
                                Description *
                            </label>
                            <textarea
                                placeholder="Describe the condition, features, and any defects..."
                                value={formData.description}
                                onChange={(e) => {
                                    const value = e.target.value
                                    if (value.length <= 1000) {
                                        setFormData({ ...formData, description: value })
                                    }
                                }}
                                className="w-full px-4 py-4 rounded-xl text-white outline-none transition-all duration-200 placeholder-gray-500 h-40 resize-none focus:ring-2 focus:ring-teal-500/50 text-base"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1000 characters</p>
                        </div>

                        {/* Categories */}
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-3">
                                Category *
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {CATEGORIES.filter((cat) => cat.id !== 'all').map((cat) => (
                                    <label
                                        key={cat.id}
                                        className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 touch-manipulation min-h-[56px] ${
                                            formData.categories?.[0] === cat.id
                                                ? 'text-white'
                                                : 'text-gray-300 hover:text-white active:text-white'
                                        }`}
                                        style={{
                                            background: formData.categories?.[0] === cat.id
                                                ? 'rgba(20, 184, 166, 0.15)'
                                                : 'rgba(255,255,255,0.04)',
                                            border: formData.categories?.[0] === cat.id
                                                ? '2px solid rgba(20, 184, 166, 0.4)'
                                                : '1px solid rgba(255,255,255,0.08)',
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="category"
                                            checked={formData.categories?.[0] === cat.id || false}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData({
                                                        ...formData,
                                                        categories: [cat.id],
                                                    })
                                                    setTimeout(fetchPricingSuggestion, 100)
                                                }
                                            }}
                                            className="w-4 h-4 cursor-pointer accent-teal-500"
                                        />
                                        <span className="text-lg">{cat.icon}</span>
                                        <span className="font-bold text-sm">{cat.name}</span>
                                    </label>
                                ))}
                            </div>
                            {formData.categories?.length > 0 && (
                                <p className="text-xs text-gray-500 mt-2">
                                    Selected: {formData.categories[0]}
                                </p>
                            )}
                        </div>

                        {/* Condition */}
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">
                                Condition *
                            </label>
                            <select
                                value={formData.condition}
                                onChange={(e) => {
                                    setFormData({ ...formData, condition: e.target.value })
                                    setTimeout(fetchPricingSuggestion, 100)
                                }}
                                className="w-full px-4 py-4 rounded-xl text-white outline-none transition-all duration-200 focus:ring-2 focus:ring-teal-500/50 text-base"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                {CONDITIONS.map((cond) => (
                                    <option key={cond.id} value={cond.id} className="bg-gray-900">
                                        {cond.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Images */}
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">
                                Images * (Max 5)
                            </label>
                            {/* Upload Progress */}
                            {uploadingImages && uploadProgress > 0 && (
                                <div className="mb-4 glass rounded-xl p-4" style={{ borderColor: 'rgba(20,184,166,0.2)' }}>
                                    <p className="text-sm text-teal-300 font-semibold mb-2">Uploading Images...</p>
                                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-teal-400 to-cyan-400 h-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">{uploadProgress}% complete</p>
                                </div>
                            )}

                            {/* Image Previews */}
                            {imageFiles.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                    {imageFiles.map((entry, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={entry.preview}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-xl ring-1 ring-white/10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-2 right-2 w-10 h-10 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-base sm:text-xs font-bold opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer touch-manipulation"
                                                style={{ background: 'rgba(239,68,68,0.85)' }}
                                            >
                                                {'\u2715'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Upload Box */}
                            {imageFiles.length < 5 && (
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleImageSelect}
                                        className="hidden"
                                        id="image-upload"
                                        disabled={uploadingImages}
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className="block rounded-xl p-8 text-center cursor-pointer transition-all duration-200 hover:border-teal-500/50"
                                        style={{
                                            border: '2px dashed rgba(255,255,255,0.15)',
                                            background: 'rgba(255,255,255,0.02)',
                                        }}
                                    >
                                        <p className="text-white font-bold mb-1">Click to upload images</p>
                                        <p className="text-sm text-gray-500">
                                            {uploadingImages ? 'Uploading...' : 'JPG, PNG, WebP up to 5MB each'}
                                        </p>
                                    </label>
                                </div>
                            )}

                            <p className="text-xs text-gray-500 mt-2">
                                {imageFiles.length}/5 images selected
                            </p>
                        </div>

                        {/* Contact Methods */}
                        <div className="space-y-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            {/* Price */}
                            <div>
                                <label className="block text-sm font-bold text-gray-300 mb-2">
                                    Price ({'\u20A9'}) *
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    max="9999999"
                                    value={formData.price}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        if (value.length <= 7) {
                                            setFormData({ ...formData, price: value })
                                        }
                                    }}
                                    className="w-full px-4 py-4 rounded-xl text-white outline-none transition-all duration-200 placeholder-gray-500 focus:ring-2 focus:ring-teal-500/50 text-base"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">(Max. ₩9,999,999)</p>
                            </div>

                            {/* Pricing Suggestion */}
                            {pricingSuggestion && (
                                <div className="glass rounded-xl p-4" style={{ borderColor: 'rgba(20,184,166,0.3)' }}>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs text-teal-300 font-semibold">
                                            {loadingPriceSuggestion ? '⏳ Analyzing price...' : 'Price Suggestion'}
                                        </p>
                                        {pricingSuggestion.source === 'ai' && <span className="text-xs text-cyan-300 bg-cyan-500/20 px-2 py-1 rounded">AI Powered</span>}
                                    </div>
                                    <p className="text-sm text-gray-200 mb-2">
                                        Suggested range: <span className="text-teal-300 font-bold">₩{pricingSuggestion.minPrice?.toLocaleString()} - ₩{pricingSuggestion.maxPrice?.toLocaleString()}</span>
                                    </p>
                                    <p className="text-xs text-amber-400" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                                        ⚠️ This is an estimate and may not be 100% accurate. Please verify based on item condition and market prices.
                                    </p>
                                </div>
                            )}

                            <label className="block text-sm font-bold text-gray-300 mb-4 pt-2">
                                How should people contact you?
                            </label>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2">
                                    Kakao Open Chat Link <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://open.kakao.com/o/..."
                                    value={formData.kakaoLink}
                                    onChange={(e) => setFormData({ ...formData, kakaoLink: e.target.value })}
                                    className="w-full px-4 py-4 rounded-xl text-white outline-none transition-all duration-200 placeholder-gray-500 focus:ring-2 focus:ring-teal-500/50 text-base"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                />
                                <details className="mt-2 cursor-pointer">
                                    <summary className="text-xs text-teal-400 hover:text-teal-300">
                                        How to get your Kakao Open Chat link?
                                    </summary>
                                    <div className="mt-3 glass rounded-xl p-4 text-xs text-gray-300 space-y-3">
                                        <div>
                                            <p className="font-bold text-teal-400 mb-1">Step 1: Open Kakao Talk</p>
                                            <p className="text-gray-400">Open the Kakao Talk app (or web at kakao.com)</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-teal-400 mb-1">Step 2: Create Open Chat</p>
                                            <p className="text-gray-400">Click the <span className="bg-white/10 px-1 rounded">+</span> button {'\u2192'} <span className="bg-white/10 px-1 rounded">Create Open Chat</span></p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-teal-400 mb-1">Step 3: Get the Link</p>
                                            <p className="text-gray-400">In the chat, click <span className="bg-white/10 px-1 rounded">{'\u22EF'} Menu</span> {'\u2192'} <span className="bg-white/10 px-1 rounded">Invite</span></p>
                                            <p className="text-gray-400 mt-1">Copy the link starting with <span className="bg-amber-500/20 text-amber-300 px-1 rounded">https://open.kakao.com/o/</span></p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-teal-400 mb-1">Step 4: Paste Here</p>
                                            <p className="text-gray-400">Paste the full link in the field above</p>
                                        </div>
                                    </div>
                                </details>
                            </div>

                            <p className="text-xs text-gray-500 mt-4">
                                Buyers will use this to contact you about your item
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || uploadingImages}
                            className="w-full py-5 rounded-xl font-black text-lg text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer touch-manipulation min-h-[56px] active:scale-[0.98]"
                            style={{ background: 'linear-gradient(135deg, #14b8a6, #06b6d4)' }}
                        >
                            {loading ? 'Creating Listing...' : uploadingImages ? 'Uploading Images...' : 'Create Listing'}
                        </button>

                        {/* Info */}
                        <div className="glass rounded-xl p-4" style={{ borderColor: 'rgba(20,184,166,0.2)' }}>
                            <p className="text-sm text-teal-300">
                                Your listing will expire in 90 days. Make sure to mark it as sold when someone buys your item!
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
