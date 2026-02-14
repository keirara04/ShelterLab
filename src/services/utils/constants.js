// src/lib/constants.js
// Global constants for KODAE Shelter

export const CATEGORIES = [
  { id: 'all', name: 'All', icon: '' },
  { id: 'tech', name: 'Electronics', icon: '' },
  { id: 'books', name: 'Textbooks', icon: '' },
  { id: 'clothing', name: 'Fashion', icon: '' },
  { id: 'dorm', name: 'Dorm Essentials', icon: '' },
  { id: 'other', name: 'Miscellaneous', icon: '' },
]

export const CONDITIONS = [
  { id: 'new', name: 'New', icon: '✨', color: 'bg-green-500' },
  { id: 'like-new', name: 'Like New', icon: '🆕', color: 'bg-blue-500' },
  { id: 'good', name: 'Good', icon: '👍', color: 'bg-yellow-500' },
  { id: 'fair', name: 'Fair', icon: '⚠️', color: 'bg-orange-500' },
  { id: 'poor', name: 'Poor', icon: '🔧', color: 'bg-red-500' },
]

export const UNIVERSITIES = [
  { id: 'Korea University', name: 'Korea University', icon: '🎓' },
  { id: 'Hanyang University', name: 'Hanyang University', icon: '🎓' },
  { id: 'Seoultech', name: 'Seoultech', icon: '🎓' },
]

export const UNIVERSITY_LOGOS = {
  'Korea University': '/KoreaUniversityLogo.png',
  'Hanyang University': '/HanyangUniversityLogo.png',
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