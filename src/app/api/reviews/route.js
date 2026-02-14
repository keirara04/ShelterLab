// src/app/api/reviews/route.js
import { supabaseServer } from '@/services/supabaseServer'
import { requireAuth } from '@/auth'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const revieweeId = searchParams.get('reviewee_id')
    const isSellerReview = searchParams.get('is_seller_review')

    if (!revieweeId) {
      return Response.json(
        { error: 'reviewee_id is required' },
        { status: 400 }
      )
    }

    let query = supabaseServer
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url)
      `)
      .eq('reviewee_id', revieweeId)

    // Filter by review type if specified
    if (isSellerReview !== null) {
      query = query.eq('is_seller_review', isSellerReview === 'true')
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    // Calculate average rating
    const avgRating = data.length > 0
      ? (data.reduce((sum, review) => sum + review.rating, 0) / data.length).toFixed(1)
      : 0

    return Response.json({
      success: true,
      data,
      average_rating: parseFloat(avgRating),
      total_reviews: data.length,
    })
  } catch (error) {
    console.error('GET reviews error:', error)
    return Response.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    // ✅ SERVER-SIDE AUTH CHECK - Cannot be bypassed
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth // Return 401 if not authenticated

    const body = await request.json()
    const { reviewee_id, reviewer_id, comment, rating, listing_id, is_seller_review } = body

    // Verify the authenticated user matches the reviewer_id (prevent impersonation)
    if (auth.user.id !== reviewer_id) {
      return Response.json(
        { error: 'You can only post reviews as yourself' },
        { status: 403 }
      )
    }

    // Validate required fields
    if (!reviewee_id || !reviewer_id || !comment || rating === undefined || is_seller_review === undefined) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return Response.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (!comment.trim() || comment.trim().length < 3) {
      return Response.json(
        { error: 'Review must be at least 3 characters' },
        { status: 400 }
      )
    }

    // Insert review
    const reviewData = {
      reviewee_id,
      reviewer_id,
      comment: comment.trim(),
      rating: parseInt(rating),
      is_seller_review: Boolean(is_seller_review),
    }

    // Add listing_id if provided
    if (listing_id) {
      reviewData.listing_id = listing_id
    }

    const { data, error } = await supabaseServer
      .from('reviews')
      .insert(reviewData)
      .select()
      .single()

    if (error) throw error

    return Response.json({
      success: true,
      data,
      message: 'Review posted successfully',
    })
  } catch (error) {
    console.error('POST review error:', error)
    return Response.json(
      { error: error.message || 'Failed to post review' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    // ✅ SERVER-SIDE AUTH CHECK - Cannot be bypassed
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth // Return 401 if not authenticated

    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get('review_id')
    const revieweeId = searchParams.get('reviewee_id')

    if (!reviewId || !revieweeId) {
      return Response.json(
        { error: 'review_id and reviewee_id are required' },
        { status: 400 }
      )
    }

    // Verify the review belongs to this reviewee before deleting
    const { data: review } = await supabaseServer
      .from('reviews')
      .select('reviewee_id')
      .eq('id', reviewId)
      .single()

    if (!review) {
      return Response.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Only the profile owner (reviewee) can delete reviews
    if (review.reviewee_id !== revieweeId || auth.user.id !== revieweeId) {
      return Response.json(
        { error: 'You can only delete reviews on your own profile' },
        { status: 403 }
      )
    }

    // Delete the review
    const { error } = await supabaseServer
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) throw error

    return Response.json({
      success: true,
      message: 'Review deleted successfully',
    })
  } catch (error) {
    console.error('DELETE review error:', error)
    return Response.json(
      { error: error.message || 'Failed to delete review' },
      { status: 500 }
    )
  }
}
