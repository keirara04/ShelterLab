// src/lib/validation.js
// Zod schemas for data validation

import { z } from 'zod'

// Auth Schemas
export const signupSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(2, 'Full name required'),
})

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password required'),
})

// Listing Schema
export const listingSchema = z.object({
    title: z
        .string()
        .min(3, 'Title must be at least 3 characters')
        .max(100, 'Title must be less than 100 characters'),
    description: z
        .string()
        .min(10, 'Description must be at least 10 characters')
        .max(2000, 'Description must be less than 2000 characters'),
    price: z
        .number()
        .min(0, 'Price must be positive')
        .max(999999, 'Price is too high'),
    categories: z
        .array(z.enum(['tech', 'books', 'clothing', 'dorm', 'other']))
        .min(1, 'Select at least one category'),
    condition: z.enum(['new', 'like-new', 'good', 'fair', 'poor'], {
        errorMap: () => ({ message: 'Invalid condition' }),
    }),
    kakaoLink: z.string().url('Invalid Kakao link').optional().or(z.literal('')),
    whatsappLink: z
        .string()
        .regex(/^\+?[0-9\s\-()]+$/, 'Invalid phone number')
        .optional()
        .or(z.literal('')),
    imageUrls: z
        .array(z.string().url())
        .min(1, 'At least one image is required')
        .max(5, 'Maximum 5 images allowed'),
})

// Review Schema
export const reviewSchema = z.object({
    rating: z.number().min(1, 'Rating required').max(5, 'Rating must be 1-5'),
    comment: z
        .string()
        .max(500, 'Comment must be less than 500 characters')
        .optional(),
    isSellerReview: z.boolean().default(false),
})

// Report Schema
export const reportSchema = z.object({
    reason: z.string().min(3, 'Reason required'),
    description: z.string().min(10, 'Description required').max(1000),
    listingId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
})

// Profile Update Schema
export const profileUpdateSchema = z.object({
    fullName: z
        .string()
        .min(2, 'Name too short')
        .max(100, 'Name too long')
        .optional(),
    avatarUrl: z.string().url().optional(),
})

export default {
    signupSchema,
    loginSchema,
    listingSchema,
    reviewSchema,
    reportSchema,
    profileUpdateSchema,
}