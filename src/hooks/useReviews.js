// src/hooks/useReviews.js
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export const useReviews = (userId = null, listingId = null) => {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [averageRating, setAverageRating] = useState(0)

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('reviews')
        .select('*, reviewer:profiles(id, full_name, avatar_url)')
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('reviewee_id', userId)
      }

      if (listingId) {
        query = query.eq('listing_id', listingId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setReviews(data || [])

      // Calculate average rating
      if (data && data.length > 0) {
        const avgRating =
          data.reduce((sum, review) => sum + review.rating, 0) / data.length
        setAverageRating(parseFloat(avgRating.toFixed(1)))
      }
    } catch (err) {
      setError(err.message)
      console.error('Error fetching reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [userId, listingId])

  // Create review
  const createReview = async (reviewData) => {
    if (!user) {
      setError('You must be logged in to leave a review')
      return false
    }

    try {
      setError(null)

      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          reviewer_id: user.id,
          reviewee_id: reviewData.revieweeId,
          listing_id: reviewData.listingId || null,
          rating: reviewData.rating,
          comment: reviewData.comment,
          is_seller_review: reviewData.isSellerReview || false,
        })

      if (insertError) throw insertError

      await fetchReviews()
      return true
    } catch (err) {
      setError(err.message)
      console.error('Error creating review:', err)
      return false
    }
  }

  // Update review
  const updateReview = async (reviewId, updateData) => {
    if (!user) {
      setError('You must be logged in')
      return false
    }

    try {
      setError(null)

      // Verify ownership
      const review = reviews.find((r) => r.id === reviewId)
      if (!review || review.reviewer_id !== user.id) {
        throw new Error('You can only edit your own reviews')
      }

      const { error: updateError } = await supabase
        .from('reviews')
        .update(updateData)
        .eq('id', reviewId)

      if (updateError) throw updateError

      await fetchReviews()
      return true
    } catch (err) {
      setError(err.message)
      console.error('Error updating review:', err)
      return false
    }
  }

  // Delete review
  const deleteReview = async (reviewId) => {
    if (!user) {
      setError('You must be logged in')
      return false
    }

    try {
      setError(null)

      // Verify ownership
      const review = reviews.find((r) => r.id === reviewId)
      if (!review || review.reviewer_id !== user.id) {
        throw new Error('You can only delete your own reviews')
      }

      const { error: deleteError } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)

      if (deleteError) throw deleteError

      await fetchReviews()
      return true
    } catch (err) {
      setError(err.message)
      console.error('Error deleting review:', err)
      return false
    }
  }

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach((review) => {
      distribution[review.rating]++
    })
    return distribution
  }

  return {
    reviews,
    loading,
    error,
    averageRating,
    ratingCount: reviews.length,
    createReview,
    updateReview,
    deleteReview,
    refetch: fetchReviews,
    getRatingDistribution,
  }
}

export default useReviews