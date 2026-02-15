// src/lib/helpers.js
// Helper functions for KODAE Shelter

import { LISTING_EXPIRY_DAYS } from './constants'

/**
 * Calculate expiration date for listing
 */
export const calculateExpiryDate = (createdAt = new Date()) => {
  const expiry = new Date(createdAt)
  expiry.setDate(expiry.getDate() + LISTING_EXPIRY_DAYS)
  return expiry
}

/**
 * Check if listing is expired
 */
export const isListingExpired = (expiresAt) => {
  return new Date(expiresAt) < new Date()
}

/**
 * Format date for display
 */
export const formatDate = (date, format = 'short') => {
  const d = new Date(date)
  if (format === 'short') return d.toLocaleDateString()
  if (format === 'long') return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  if (format === 'time') return d.toLocaleTimeString()
  return d.toLocaleString()
}

/**
 * Calculate days until expiry
 */
export const daysUntilExpiry = (expiresAt) => {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diff = expiry - now
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
}

/**
 * Format price with currency
 */
export const formatPrice = (price, currency = '₩') => {
  return `${currency}${Number(price).toLocaleString()}`
}

/**
 * Get initials from full name
 */
export const getInitials = (fullName) => {
  return fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

/**
 * Calculate average rating
 */
export const calculateAverageRating = (reviews = []) => {
  if (reviews.length === 0) return 0
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  return (sum / reviews.length).toFixed(1)
}

/**
 * Build image URL from Supabase storage
 */
export const buildImageUrl = (bucketName, filePath) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`
}

/**
 * Generate file path for upload
 */
export const generateFilePath = (userId, fileName) => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `listings/${userId}/${timestamp}-${random}-${fileName}`
}

/**
 * Validate image file
 */
export const validateImageFile = (file, maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) => {
  if (file.size > maxSize) {
    return { valid: false, error: 'Image size exceeds 5MB' }
  }
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid image format' }
  }
  return { valid: true }
}

/**
 * Convert file to base64
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

/**
 * Format trust score as badge
 */
export const getTrustBadge = (score) => {
  if (score >= 50) return { label: 'Power User', color: 'bg-purple-500' }
  if (score >= 25) return { label: 'Very Trusted', color: 'bg-green-500' }
  if (score >= 10) return { label: 'Trusted', color: 'bg-blue-500' }
  return { label: 'New User', color: 'bg-gray-500' }
}

/**
 * Build Kakao/WhatsApp contact links
 */
export const buildContactUrl = (platform, identifier) => {
  if (platform === 'kakao') {
    return `https://open.kakao.com/o/${identifier}`
  }
  if (platform === 'whatsapp') {
    return `https://wa.me/${identifier}`
  }
  return null
}

/**
 * Check if user is admin (basic check)
 */
export const isAdmin = (user) => {
  return user?.profile?.is_admin === true
}

/**
 * Generate random ID
 */
export const generateId = () => {
  return Math.random().toString(36).substring(2, 11)
}

/**
 * Compress an image file for web upload
 * Resizes to maxWidth and converts to JPEG at given quality
 */
export const compressImage = (file, maxWidth = 1920, quality = 0.8) => {
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const canvas = document.createElement('canvas')
      let { width, height } = img

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, '.jpg'),
            { type: 'image/jpeg', lastModified: Date.now() }
          )
          resolve(compressedFile)
        },
        'image/jpeg',
        quality
      )
    }

    img.src = objectUrl
  })
}

export default {
  calculateExpiryDate,
  isListingExpired,
  formatDate,
  daysUntilExpiry,
  formatPrice,
  getInitials,
  truncateText,
  calculateAverageRating,
  buildImageUrl,
  generateFilePath,
  validateImageFile,
  fileToBase64,
  getTrustBadge,
  buildContactUrl,
  isAdmin,
  generateId,
  compressImage,
}