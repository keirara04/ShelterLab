import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Helper: apply rate limit and return 429 Response if exceeded, null if OK
export async function applyRateLimit(limiter, identifier) {
  try {
    const { success } = await limiter.limit(identifier)
    if (!success) {
      return Response.json({ error: 'Too many requests. Please slow down and try again.' }, { status: 429 })
    }
  } catch {
    // Redis unavailable — fail open (don't block the request)
  }
  return null
}

// Helper: get IP from request headers
export function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

// 3 OTP emails per 10 minutes per user
export const emailVerificationLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '10 m'),
  prefix: 'rl:email-verify',
})

// 10 new listings per hour per user
export const createListingLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'rl:create-listing',
})

// 10 reviews per hour per user
export const createReviewLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'rl:create-review',
})

// 30 image uploads per hour per user
export const uploadLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 h'),
  prefix: 'rl:upload',
})

// 5 signups per hour per IP
export const signupLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'rl:signup',
})

// 60 user searches per minute per IP
export const userSearchLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  prefix: 'rl:user-search',
})

// 10 push subscriptions per hour per user
export const pushSubscribeLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'rl:push-subscribe',
})

// 30 profile updates per hour per user
export const profileUpdateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 h'),
  prefix: 'rl:profile-update',
})
