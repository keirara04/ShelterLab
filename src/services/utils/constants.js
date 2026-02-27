// src/lib/constants.js
// Global constants for KODAE Shelter

export const CATEGORIES = [
  { id: 'all', name: 'All', icon: '' },
  { id: 'tech', name: 'Electronics', icon: '' },
  { id: 'books', name: 'Textbooks', icon: '' },
  { id: 'clothing', name: 'Fashion', icon: '' },
  { id: 'dorm', name: 'Dorm Essentials', icon: '' },
  { id: 'services', name: 'LabGigs', icon: '' },
  { id: 'other', name: 'Miscellaneous', icon: '' },
]

export const SERVICE_PRICING_TYPES = [
  { id: 'flat', name: 'Flat Rate', label: '₩' },
  { id: 'per_hour', name: 'Per Hour', label: '₩/hr' },
  { id: 'per_session', name: 'Per Session', label: '₩/session' },
  { id: 'negotiable', name: 'Negotiable', label: 'Negotiable' },
]

export const GIG_TYPES = [
  { id: 'offering', name: 'Offering', color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  { id: 'looking_for', name: 'Looking For', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
]

export const isServiceListing = (categories) =>
  Array.isArray(categories) && categories.includes('services')

export const CONDITIONS = [
  { id: 'new', name: 'New', icon: '', color: 'bg-green-500' },
  { id: 'like-new', name: 'Like New', icon: '', color: 'bg-blue-500' },
  { id: 'good', name: 'Good', icon: '', color: 'bg-yellow-500' },
  { id: 'fair', name: 'Fair', icon: '', color: 'bg-orange-500' },
  { id: 'poor', name: 'Poor', icon: '', color: 'bg-red-500' },
]

export const UNIVERSITIES = [
  { id: 'Korea University', name: 'Korea University', icon: '' },
  { id: 'Yonsei University', name: 'Yonsei University', icon: '' },
  { id: 'Hanyang University', name: 'Hanyang University', icon: '' },
  { id: 'Sungkyunkwan University', name: 'Sungkyunkwan University', icon: '' },
  { id: 'Kyung Hee University', name: 'Kyung Hee University', icon: '' },
  { id: 'Ewha Womans University', name: 'Ewha Womans University', icon: '' },
  { id: 'Sejong University', name: 'Sejong University', icon: '' },
  { id: 'Konkuk University', name: 'Konkuk University', icon: '' },
  { id: 'Seoultech', name: 'Seoultech', icon: '' },
]

export const UNIVERSITY_LOGOS = {
  'Korea University': '/KoreaUniversityLogo.png',
  'Yonsei University': '/YonseiUniversityLogo.png',
  'Hanyang University': '/HanyangUniversityLogo.png',
  'Sungkyunkwan University': '/SungkyunkwanUniversityLogo.png',
  'Kyung Hee University': '/KyungHeeUniversityLogo.png',
  'Ewha Womans University': '/EwhaWomansUniversityLogo.png',
  'Sejong University': '/SejongUniversityLogo.png',
  'Konkuk University': '/KonkukUniversityLogo.png',
  'Seoultech': '/SeoultechLogo.png',
}

export const REPORT_REASONS = [
  'Inappropriate Content',
  'Spam or Scam',
  'Offensive Language',
  'Suspicious Activity',
  'Wrong Category',
  'Other',
]

export const REPORT_STATUS = ['Pending', 'Reviewed', 'Resolved', 'Dismissed']

export const LISTING_EXPIRY_DAYS = 90

export const TRUST_SCORE_THRESHOLDS = {
  NEW_USER: 0,
  TRUSTED: 10,
  VERY_TRUSTED: 25,
  POWER_USER: 50,
}

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const PAGINATION_LIMIT = 12

export const RATING_COLORS = {
  5: 'text-green-500',
  4: 'text-blue-500',
  3: 'text-yellow-500',
  2: 'text-orange-500',
  1: 'text-red-500',
}

export const DEFAULT_LISTING_ID = 'test-user-id' // For development/testing

// Allowed university email domains for the Verified Student badge.
// Add new domains here to extend verification eligibility.
export const ALLOWED_UNIVERSITY_EMAIL_DOMAINS = [
  '.ac.kr', // Standard Korean university domain
  // '.edu',    // Uncomment to allow US university emails
  // '.edu.sg', // Uncomment to allow Singapore university emails
]

// API Response Status
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  LOADING: 'loading',
}

// Toast Types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
}