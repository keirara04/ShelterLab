import { supabaseServer } from '@/services/supabaseServer'

// Helper: verify auth from Bearer token and return user
async function getAuthUser(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseServer.auth.getUser(token)
  if (error || !user) return null
  return user
}

export async function GET(request, { params }) {
  try {
    const { id } = await params

    // Fetch listing
    const { data: listing, error: listingError } = await supabaseServer
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()

    if (listingError) {
      return Response.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Fetch seller profile and reviews in parallel
    const [sellerResult, reviewsResult] = await Promise.all([
      supabaseServer
        .from('profiles')
        .select('*')
        .eq('id', listing.seller_id)
        .single(),
      supabaseServer
        .from('reviews')
        .select('*')
        .eq('seller_id', listing.seller_id)
        .order('created_at', { ascending: false }),
    ])

    return Response.json({
      success: true,
      listing,
      seller: sellerResult.data || null,
      reviews: reviewsResult.data || [],
    })
  } catch (error) {
    console.error('GET listing error:', error)
    return Response.json({ error: 'Failed to fetch listing' }, { status: 500 })
  }
}

// PATCH /api/listings/[id] — seller updates their own listing
export async function PATCH(request, { params }) {
  const { id } = await params
  if (!id) return Response.json({ error: 'Missing listing ID' }, { status: 400 })

  const user = await getAuthUser(request)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: listing, error: fetchError } = await supabaseServer
      .from('listings')
      .select('seller_id')
      .eq('id', id)
      .single()

    if (fetchError || !listing) return Response.json({ error: 'Listing not found' }, { status: 404 })
    if (listing.seller_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { title, description, price, kakaoLink, pricingType, visibleToAll, gigType } = body

    const errors = []
    const trimmedTitle = title?.trim()
    if (trimmedTitle !== undefined) {
      if (!trimmedTitle || trimmedTitle.length < 3) errors.push('Title must be at least 3 characters')
      if (trimmedTitle.length > 100) errors.push('Title must be 100 characters or less')
    }
    if (price !== undefined) {
      const p = parseFloat(price)
      if (isNaN(p) || p < 0) errors.push('Price must be a non-negative number')
      if (p > 9999999) errors.push('Price cannot exceed ₩9,999,999')
    }
    if (kakaoLink && !kakaoLink.trim().startsWith('https://open.kakao.com/o/')) {
      errors.push('Kakao link must start with https://open.kakao.com/o/')
    }
    if (pricingType && !['flat', 'per_hour', 'per_session', 'negotiable'].includes(pricingType)) {
      errors.push('Invalid pricing type')
    }
    if (gigType && !['offering', 'looking_for'].includes(gigType)) {
      errors.push('Invalid gig type')
    }
    if (errors.length > 0) return Response.json({ error: errors }, { status: 400 })

    const updates = {}
    if (trimmedTitle !== undefined) updates.title = trimmedTitle
    if (description !== undefined) updates.description = description
    if (price !== undefined) updates.price = parseFloat(price)
    if (kakaoLink !== undefined) updates.kakao_link = kakaoLink.trim()
    if (pricingType !== undefined) updates.pricing_type = pricingType
    if (visibleToAll !== undefined) updates.visible_to_all = visibleToAll
    if (gigType !== undefined) updates.gig_type = gigType

    const { error: updateError } = await supabaseServer
      .from('listings')
      .update(updates)
      .eq('id', id)

    if (updateError) return Response.json({ error: updateError.message }, { status: 500 })
    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// DELETE /api/listings/[id] — seller deletes their own listing
export async function DELETE(request, { params }) {
  const { id } = await params
  if (!id) return Response.json({ error: 'Missing listing ID' }, { status: 400 })

  const user = await getAuthUser(request)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: listing, error: fetchError } = await supabaseServer
      .from('listings')
      .select('seller_id')
      .eq('id', id)
      .single()

    if (fetchError || !listing) return Response.json({ error: 'Listing not found' }, { status: 404 })
    if (listing.seller_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { error: deleteError } = await supabaseServer
      .from('listings')
      .delete()
      .eq('id', id)

    if (deleteError) return Response.json({ error: deleteError.message }, { status: 500 })
    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: 'An error occurred' }, { status: 500 })
  }
}
