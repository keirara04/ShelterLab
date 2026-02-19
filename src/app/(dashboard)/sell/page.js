'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/context/AuthContext'
import { supabase } from '@/services/supabase'
import { CATEGORIES, CONDITIONS } from '@/services/utils/constants'
import { validateImageFile, compressImage } from '@/services/utils/helpers'
import Link from 'next/link'
import LogoHome from '@/shared/components/LogoHome'

const INITIAL_FORM = {
    title: '',
    description: '',
    price: '',
    categories: [],
    condition: 'good',
    kakaoLink: '',
}

export default function SellPage() {
    const router = useRouter()
    const { user, profile, isAuthenticated } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [uploadingImages, setUploadingImages] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [pricingSuggestion, setPricingSuggestion] = useState(null)
    const [loadingPriceSuggestion, setLoadingPriceSuggestion] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef(null)
    const priceSuggestionTimerRef = useRef(null)
    const [imageFiles, setImageFiles] = useState([])
    const [formData, setFormData] = useState(INITIAL_FORM)

    useEffect(() => {
        if (profile?.kakao_link && !formData.kakaoLink) {
            setFormData(prev => ({ ...prev, kakaoLink: profile.kakao_link }))
        }
    }, [profile])

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#000000' }}>
                <div className="glass-strong rounded-3xl p-10 text-center max-w-sm w-full">
                    <h1 className="text-2xl font-black mb-3 text-white">Sign in to sell</h1>
                    <p className="text-gray-400 mb-6 text-sm leading-relaxed">Create an account to list your items for the community.</p>
                    <Link
                        href="/login"
                        className="text-white px-8 py-3 rounded-xl font-bold inline-block text-sm transition-opacity hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg, #14b8a6, #06b6d4)' }}
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        )
    }

    // Shared image processing — used by click-upload and drag-and-drop
    const processFiles = async (files) => {
        if (!files.length) return
        if (imageFiles.length + files.length > 5) {
            setError('Maximum 5 images allowed')
            return
        }
        const newEntries = []
        for (const file of files) {
            const validation = validateImageFile(file)
            if (!validation.valid) { setError(validation.error); continue }
            try {
                const compressed = await compressImage(file)
                newEntries.push({ file: compressed, preview: URL.createObjectURL(compressed) })
            } catch {
                setError(`Failed to compress: ${file.name}`)
            }
        }
        if (newEntries.length > 0) {
            setImageFiles(prev => [...prev, ...newEntries])
            setError(null)
        }
    }

    const handleImageSelect = async (e) => {
        await processFiles(Array.from(e.target.files || []))
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleDrop = async (e) => {
        e.preventDefault()
        setIsDragging(false)
        const files = Array.from(e.dataTransfer.files).filter(f =>
            ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
        )
        await processFiles(files)
    }

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
    const handleDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false) }

    const removeImage = (index) => {
        setImageFiles(prev => {
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
            for (const entry of imageFiles) body.append('files', entry.file)
            body.append('userId', user.id)
            // `await` is critical — without it `finally` fires before XHR completes
            return await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest()
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        setUploadProgress(Math.round((event.loaded / event.total) * 100))
                    }
                })
                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        resolve(JSON.parse(xhr.responseText).urls || [])
                    } else {
                        reject(new Error(JSON.parse(xhr.responseText).error || 'Upload failed'))
                    }
                })
                xhr.addEventListener('error', () => reject(new Error('Upload failed')))
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

    const fetchPricingSuggestion = async () => {
        if (formData.categories.length === 0) { setPricingSuggestion(null); return }
        setLoadingPriceSuggestion(true)
        try {
            const res = await fetch('/api/pricing-suggestion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    category: formData.categories[0],
                    condition: formData.condition,
                }),
            })
            if (res.ok) setPricingSuggestion(await res.json())
        } catch (err) {
            console.error('Price suggestion error:', err)
        } finally {
            setLoadingPriceSuggestion(false)
        }
    }

    const triggerPriceSuggestion = () => {
        clearTimeout(priceSuggestionTimerRef.current)
        priceSuggestionTimerRef.current = setTimeout(fetchPricingSuggestion, 500)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            const errors = []
            const trimmedTitle = formData.title.trim()
            if (!trimmedTitle || trimmedTitle.length < 3) errors.push('Title must be at least 3 characters')
            if (trimmedTitle.length > 100) errors.push('Title must be 100 characters or less')
            const price = parseFloat(formData.price)
            if (!formData.price || price <= 0) errors.push('Price must be greater than 0')
            if (price > 9999999) errors.push('Price cannot exceed ₩9,999,999')
            if (formData.categories.length === 0) errors.push('Select at least one category')
            if (imageFiles.length === 0) errors.push('Please add at least one photo')
            if (!formData.kakaoLink.trim()) {
                errors.push('Kakao Open Chat link is required')
            } else if (!formData.kakaoLink.startsWith('https://open.kakao.com/o/')) {
                errors.push('Link must start with https://open.kakao.com/o/')
            }
            if (errors.length > 0) { setError(errors); setLoading(false); return }

            const { data: { session } } = await supabase.auth.getSession()
            if (!session) { setError('Session expired — please sign in again'); setLoading(false); return }

            const uploadedUrls = await uploadImages()
            if (!uploadedUrls || uploadedUrls.length === 0) { setLoading(false); return }

            const response = await fetch('/api/listings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    title: formData.title.trim(),
                    description: formData.description,
                    price: parseFloat(formData.price),
                    categories: formData.categories,
                    condition: formData.condition,
                    kakaoLink: formData.kakaoLink.trim(),
                    imageUrls: uploadedUrls,
                }),
            })
            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to create listing')
            }

            setFormData(INITIAL_FORM)
            setImageFiles([])
            setPricingSuggestion(null)
            router.push('/')
        } catch (err) {
            setError(err.message || 'Failed to create listing')
        } finally {
            setLoading(false)
        }
    }

    const descLen = formData.description.length
    const descColor = descLen >= 950 ? 'text-red-400' : descLen >= 800 ? 'text-amber-400' : 'text-gray-500'
    const isSubmitting = loading || uploadingImages

    return (
        <div className="min-h-screen p-4 md:p-8 lg:p-12 pb-32" style={{ backgroundColor: '#000000' }}>
            <div className="max-w-6xl mx-auto">

                <div className="mb-7">
                    <LogoHome />
                </div>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-1.5">Sell an Item</h1>
                    <p className="text-gray-500 text-sm">List what you don&apos;t need — someone on campus wants it</p>
                </div>

                {/* Error banner */}
                {error && (
                    <div
                        role="alert"
                        className="glass mb-6 rounded-2xl p-4 text-sm"
                        style={{ borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)' }}
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

                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col lg:flex-row gap-6 items-start">

                        {/* ══════════════ LEFT (60%) — Details + Photos ══════════════ */}
                        <div className="w-full lg:w-[60%] space-y-4">

                            {/* Item Details card */}
                            <div className="glass-strong rounded-3xl p-6 md:p-8 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-teal-500/5 rounded-3xl pointer-events-none" />
                                <div className="relative space-y-5">

                                    <div className="flex items-center gap-2.5 mb-1">
                                        <h2 className="font-bold text-white text-base">Item Details</h2>
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                            Title <span className="text-teal-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g., MacBook Pro M2, Zara jacket size M…"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="sell-input w-full px-4 py-3.5 rounded-xl text-white outline-none placeholder-gray-600 text-base"
                                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                            minLength={3}
                                            maxLength={100}
                                            required
                                        />
                                        <div className="flex items-center justify-between mt-1.5">
                                            <p className="text-[11px] text-gray-600">3–100 characters</p>
                                            {formData.title.length > 0 && (
                                                <p className={`text-[11px] char-counter-enter font-medium ${formData.title.length >= 90 ? 'text-amber-400' : 'text-gray-600'}`}>
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
                                            placeholder="Describe the condition, features, size, any defects… More detail = faster sale."
                                            value={formData.description}
                                            onChange={(e) => {
                                                if (e.target.value.length <= 1000) {
                                                    setFormData({ ...formData, description: e.target.value })
                                                }
                                            }}
                                            className="sell-input w-full px-4 py-3.5 rounded-xl text-white outline-none placeholder-gray-600 h-44 resize-none text-base"
                                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                            required
                                        />
                                        <div className="flex items-center justify-between mt-1.5">
                                            <p className="text-[11px] text-gray-600">Up to 1,000 characters</p>
                                            <p className={`text-[11px] font-medium ${descColor} ${descLen > 0 ? 'char-counter-enter' : ''}`}>
                                                {descLen}/1000{descLen >= 950 ? ' — almost full!' : descLen >= 800 ? ' — getting long' : ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Photos card */}
                            <div className="glass-strong rounded-3xl p-6 md:p-8 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-teal-500/5 rounded-3xl pointer-events-none" />
                                <div className="relative space-y-4">

                                    {/* Header row */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <h2 className="font-bold text-white text-base">Photos</h2>
                                            <span className="text-teal-400 text-xs font-bold">*</span>
                                        </div>
                                        {/* Dot progress */}
                                        <div className="flex items-center gap-1.5">
                                            {[...Array(5)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="rounded-full transition-all duration-300"
                                                    style={{
                                                        width: i < imageFiles.length ? '8px' : '6px',
                                                        height: i < imageFiles.length ? '8px' : '6px',
                                                        background: i < imageFiles.length
                                                            ? 'rgba(20,184,166,1)'
                                                            : 'rgba(255,255,255,0.12)',
                                                    }}
                                                />
                                            ))}
                                            <span className="text-[11px] text-gray-600 ml-1 font-medium">{imageFiles.length}/5</span>
                                        </div>
                                    </div>

                                    {/* Upload progress bar */}
                                    {uploadingImages && (
                                        <div className="glass rounded-xl p-3.5" style={{ borderColor: 'rgba(20,184,166,0.2)' }}>
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs text-teal-300 font-semibold">Uploading photos…</p>
                                                <p className="text-xs text-gray-400 font-medium">{uploadProgress}%</p>
                                            </div>
                                            <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-teal-400 to-cyan-400 h-full transition-all duration-300 rounded-full"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Image grid */}
                                    {imageFiles.length > 0 && (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                            {imageFiles.map((entry, index) => (
                                                <div key={index} className="relative group aspect-square">
                                                    <img
                                                        src={entry.preview}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-full object-cover rounded-xl ring-1 ring-white/10"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        aria-label={`Remove image ${index + 1}`}
                                                        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold sm:opacity-0 opacity-100 sm:group-hover:opacity-100 transition-opacity cursor-pointer touch-manipulation active:scale-90"
                                                        style={{ background: 'rgba(220,38,38,0.9)', backdropFilter: 'blur(4px)' }}
                                                    >
                                                        ×
                                                    </button>
                                                    {index === 0 && (
                                                        <span className="absolute bottom-1.5 left-1.5 text-[9px] font-black bg-teal-500 text-white px-1.5 py-0.5 rounded">
                                                            COVER
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Upload zone — pulses when empty, highlights on drag */}
                                    {imageFiles.length < 5 && (
                                        <>
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
                                                className={`block rounded-2xl p-7 text-center cursor-pointer transition-all duration-200 ${imageFiles.length === 0 ? 'upload-zone-pulse' : ''} ${isDragging ? 'upload-zone-drag' : ''}`}
                                                style={{
                                                    border: '2px dashed rgba(255,255,255,0.12)',
                                                    background: isDragging ? 'rgba(20,184,166,0.06)' : 'rgba(255,255,255,0.02)',
                                                }}
                                                onDrop={handleDrop}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                            >
                                                <p className="text-white font-bold text-sm mb-0.5">
                                                    {isDragging
                                                        ? 'Drop to add'
                                                        : imageFiles.length === 0
                                                            ? 'Add your first photo'
                                                            : `Add more (${5 - imageFiles.length} left)`}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    {uploadingImages ? 'Uploading…' : 'Click or drag & drop · JPG, PNG, WebP · max 5MB'}
                                                </p>
                                            </label>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ══════════════ RIGHT (40%) — Settings + Submit ══════════════ */}
                        <div className="w-full lg:w-[40%]">
                            <div className="lg:sticky lg:top-6 space-y-4">
                                <div className="glass-strong rounded-3xl p-6 md:p-7 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-cyan-500/5 rounded-3xl pointer-events-none" />
                                    <div className="relative space-y-5">

                                        <div className="flex items-center gap-2.5 mb-1">
                                            <h2 className="font-bold text-white text-base">Listing Settings</h2>
                                        </div>

                                        {/* Category */}
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
                                                Category <span className="text-teal-400">*</span>
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {CATEGORIES.filter(cat => cat.id !== 'all').map(cat => {
                                                    const selected = formData.categories?.[0] === cat.id
                                                    return (
                                                        <label
                                                            key={cat.id}
                                                            className={`category-card-hover flex items-center gap-2 p-3 rounded-xl cursor-pointer touch-manipulation min-h-[44px] transition-colors ${selected ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                                                            style={{
                                                                background: selected ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.04)',
                                                                border: selected ? '1.5px solid rgba(20,184,166,0.45)' : '1px solid rgba(255,255,255,0.07)',
                                                            }}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="category"
                                                                checked={selected}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setFormData({ ...formData, categories: [cat.id] })
                                                                        triggerPriceSuggestion()
                                                                    }
                                                                }}
                                                                className="sr-only"
                                                            />
                                                            <span className="font-semibold text-xs leading-tight">{cat.name}</span>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Condition — pill buttons */}
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
                                                Condition <span className="text-teal-400">*</span>
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {CONDITIONS.map(cond => {
                                                    const selected = formData.condition === cond.id
                                                    return (
                                                        <button
                                                            key={cond.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({ ...formData, condition: cond.id })
                                                                triggerPriceSuggestion()
                                                            }}
                                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer touch-manipulation active:scale-95 ${selected ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                                                            style={{
                                                                background: selected ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.05)',
                                                                border: selected ? '1.5px solid rgba(20,184,166,0.45)' : '1px solid rgba(255,255,255,0.08)',
                                                            }}
                                                        >
                                                            <span>{cond.name}</span>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
                                                Price <span className="text-teal-400">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400 font-black text-base pointer-events-none select-none">
                                                    ₩
                                                </span>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    placeholder="0"
                                                    value={formData.price}
                                                    onChange={(e) => {
                                                        const raw = e.target.value.replace(/[^0-9]/g, '')
                                                        if (raw.length <= 7) {
                                                            setFormData({ ...formData, price: raw })
                                                        }
                                                    }}
                                                    className="sell-input w-full pl-9 pr-4 py-3.5 rounded-xl text-white outline-none placeholder-gray-600 text-base font-semibold"
                                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                                    required
                                                />
                                            </div>
                                            <p className="text-[11px] text-gray-600 mt-1.5">Max ₩9,999,999</p>
                                        </div>

                                        {/* AI price suggestion */}
                                        {(pricingSuggestion || loadingPriceSuggestion) && (
                                            <div className="glass rounded-2xl p-4" style={{ borderColor: 'rgba(20,184,166,0.2)' }}>
                                                {loadingPriceSuggestion ? (
                                                    <p className="text-xs text-teal-300/70 font-medium animate-pulse">Analyzing market price…</p>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-xs text-teal-300 font-semibold">Suggested Price</p>
                                                            {pricingSuggestion?.source === 'ai' && (
                                                                <span className="text-[10px] text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-full font-bold">AI</span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-white font-black mb-2">
                                                            ₩{pricingSuggestion?.minPrice?.toLocaleString()} – ₩{pricingSuggestion?.maxPrice?.toLocaleString()}
                                                        </p>
                                                        <p className="text-[11px] text-amber-400/80 leading-relaxed" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '8px' }}>
                                                            Estimate only — verify with current market prices.
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* Divider */}
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
                                                className="sell-input w-full px-4 py-3.5 rounded-xl text-white outline-none placeholder-gray-600 text-sm"
                                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                            />
                                            {profile?.kakao_link && (
                                                <p className="text-[11px] text-teal-400/80 mt-1.5">
                                                    Auto-filled from your profile — you can override it.
                                                </p>
                                            )}
                                            <details className="mt-2">
                                                <summary className="text-[11px] text-gray-600 hover:text-teal-400 cursor-pointer transition-colors list-none">
                                                    How to get your Kakao Open Chat link ↓
                                                </summary>
                                                <div className="mt-2.5 glass rounded-xl p-4 text-xs space-y-3">
                                                    <p className="text-gray-400 leading-relaxed">
                                                        An <span className="text-white font-bold">Open Chat</span> lets buyers reach you anonymously — no personal Kakao ID shared.
                                                    </p>
                                                    {[
                                                        ['Open Kakao Talk', 'Open the app and make sure you\'re logged in.'],
                                                        ['Go to Chats', 'Tap Chats at the bottom → compose icon (top right).'],
                                                        ['Create Open Chat', 'Select Open Chat → 1:1 Open Chat, set a name, tap Create.'],
                                                        ['Copy the link', 'Tap the hamburger menu → Share → Copy Link. It starts with open.kakao.com/o/'],
                                                        ['Paste above', 'Paste the full link into the field above.'],
                                                    ].map(([title, desc], i) => (
                                                        <div key={i} className="flex gap-2.5">
                                                            <span className="text-teal-400 font-black shrink-0">{i + 1}.</span>
                                                            <div>
                                                                <p className="font-bold text-teal-400 mb-0.5">{title}</p>
                                                                <p className="text-gray-400 leading-relaxed">{desc}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="rounded-lg p-2.5" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.12)' }}>
                                                        <p className="text-amber-400/80 leading-relaxed">
                                                            <span className="font-bold text-amber-400">Tip:</span> You can reuse the same link across multiple listings.
                                                        </p>
                                                    </div>
                                                </div>
                                            </details>
                                        </div>

                                        {/* Submit */}
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className={`w-full py-4 rounded-xl font-black text-base text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer touch-manipulation min-h-[52px] active:scale-[0.98] ${isSubmitting ? 'btn-shimmer-loading' : 'hover:opacity-90'}`}
                                            style={!isSubmitting ? { background: 'linear-gradient(135deg, #14b8a6, #06b6d4)' } : undefined}
                                        >
                                            {loading
                                                ? 'Creating Listing…'
                                                : uploadingImages
                                                    ? `Uploading${uploadProgress > 0 ? ` ${uploadProgress}%` : '…'}`
                                                    : 'Create Listing'}
                                        </button>
                                    </div>
                                </div>

                                {/* Expiry note */}
                                <div className="glass rounded-2xl p-4" style={{ borderColor: 'rgba(20,184,166,0.12)' }}>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        <span className="text-teal-400 font-bold">Note:</span> Listings expire after 90 days. Remember to mark yours as sold once the item is gone!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
