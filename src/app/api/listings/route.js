// src/app/api/listings/route.js
import { supabaseServer } from '@/services/supabaseServer'
import { sendPushToAll } from '@/services/utils/sendPush'
import { applyRateLimit, createListingLimiter, getClientIp, userSearchLimiter } from '@/services/utils/rateLimit'

export async function GET(request) {
  try {
    // Rate limit: 120 requests per minute per IP
    const rl = await applyRateLimit(userSearchLimiter, getClientIp(request))
    if (rl) return rl

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const searchTerm = searchParams.get('search')
    const university = searchParams.get('university')
    const viewerUniversity = searchParams.get('viewer_university')
    const gigTypeFilter = searchParams.get('gig_type')
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '12')

    // If filtering by university, get matching seller IDs first
    let sellerIds = null
    if (university && university !== 'all') {
      const { data: profileData } = await supabaseServer
        .from('profiles')
        .select('id')
        .eq('university', university)
      sellerIds = (profileData || []).map(p => p.id)
      if (sellerIds.length === 0) {
        return Response.json({ success: true, data: [], pagination: { total: 0, page, limit, pages: 0 } })
      }
    }

    let query = supabaseServer
      .from('listings')
      .select('*, profiles!listings_seller_id_fkey(full_name, university, university_email_verified)', { count: 'exact' })

    if (sellerIds !== null) {
      query = query.in('seller_id', sellerIds)
    }

    if (category && category !== 'all') {
      query = query.contains('categories', [category])
    } else {
      // Exclude LabGigs (service listings) from the general feed — they live on /labgigs only
      query = query.not('categories', 'cs', '{"services"}')
    }

    // Hide fulfilled/closed gigs from the LabGigs feed
    if (category === 'services') {
      query = query.eq('is_sold', false)
    }

    // Filter by gig type (offering / looking_for) for LabGigs
    if (gigTypeFilter && gigTypeFilter !== 'all') {
      query = query.eq('gig_type', gigTypeFilter)
    }

    if (searchTerm) {
      // Also search by seller name
      const { data: matchingProfiles } = await supabaseServer
        .from('profiles')
        .select('id')
        .ilike('full_name', `%${searchTerm}%`)
      const matchingIds = (matchingProfiles || []).map(p => p.id)

      if (matchingIds.length > 0) {
        query = query.or(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,seller_id.in.(${matchingIds.join(',')})`
        )
      } else {
        query = query.or(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
        )
      }
    }

    const from = page * limit
    const to = from + limit - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    // University-scoped filtering for service listings
    // Physical items: always visible. Services: respect visible_to_all flag.
    let filteredData = data
    if (data && data.length > 0) {
      filteredData = data.filter(listing => {
        const isService = Array.isArray(listing.categories) && listing.categories.includes('services')
        if (!isService) return true // physical items always visible
        if (listing.visible_to_all) return true // opted-in to all universities
        if (!viewerUniversity) return false // unauthenticated — hide uni-restricted services
        return listing.profiles?.university === viewerUniversity
      })
    }

    return Response.json({
      success: true,
      data: filteredData,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    console.error('GET listings error:', error)
    return Response.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    // Verify auth — derive userId from session token, never trust client-supplied id
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    // Rate limit: 10 new listings per hour per user
    const rl = await applyRateLimit(createListingLimiter, userId)
    if (rl) return rl

    // Parse request body
    const body = await request.json()
    const { title, description, price, categories, condition, kakaoLink, imageUrls, pricingType, visibleToAll, gigType } = body
    const isService = Array.isArray(categories) && categories.includes('services')

    // Server-side validation
    const errors = []
    const trimmedTitle = (title || '').trim()
    if (!trimmedTitle || trimmedTitle.length < 3) errors.push('Title must be at least 3 characters')
    if (trimmedTitle.length > 100) errors.push('Title must be 100 characters or less')
    const parsedPrice = parseFloat(price) || 0
    if (isService) {
      // Services: price can be 0 for negotiable or looking_for
      const allowZeroPrice = pricingType === 'negotiable' || gigType === 'looking_for'
      if (!allowZeroPrice && parsedPrice <= 0) errors.push('Rate must be greater than 0')
      if (parsedPrice > 9999999) errors.push('Rate cannot exceed 9,999,999')
      if (!gigType || !['offering', 'looking_for'].includes(gigType)) errors.push('Gig type is required')
    } else {
      if (!price || parsedPrice <= 0) errors.push('Price must be greater than 0')
      if (parsedPrice > 9999999) errors.push('Price cannot exceed 9,999,999')
    }
    if (!categories || categories.length === 0) errors.push('At least one category is required')
    if (!isService && (!imageUrls || imageUrls.length === 0)) errors.push('At least one image is required')
    if (kakaoLink && !kakaoLink.trim().startsWith('https://open.kakao.com/o/')) {
      errors.push('Kakao link must start with https://open.kakao.com/o/')
    }
    if (errors.length > 0) {
      return Response.json({ error: errors.join(', ') }, { status: 400 })
    }

    // Calculate expiry date (90 days from now)
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 90)

    // Create listing
    const { data, error: insertError } = await supabaseServer
      .from('listings')
      .insert({
        seller_id: userId,
        title,
        description: description || '',
        price: parsedPrice,
        categories,
        condition: isService ? 'good' : (condition || 'good'),
        image_urls: imageUrls || [],
        kakao_link: kakaoLink || null,
        expires_at: expiryDate.toISOString(),
        pricing_type: isService ? (pricingType || 'flat') : null,
        visible_to_all: isService ? (visibleToAll || false) : null,
        gig_type: isService ? (gigType || 'offering') : null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      throw insertError
    }

    // Return immediately — push runs fully detached so it never blocks the response
    supabaseServer
      .from('profiles')
      .select('full_name, university')
      .eq('id', userId)
      .single()
      .then(({ data: sellerProfile }) => {
        const sellerName = sellerProfile?.full_name || 'Someone'
        const uni = sellerProfile?.university || ''
        let formattedPrice
        if (isService) {
          if (data.pricing_type === 'negotiable' || data.gig_type === 'looking_for') {
            formattedPrice = data.gig_type === 'looking_for' ? 'Looking For' : 'Negotiable'
          } else {
            const suffix = data.pricing_type === 'per_hour' ? '/hr' : data.pricing_type === 'per_session' ? '/session' : ''
            formattedPrice = `₩${parseFloat(data.price).toLocaleString()}${suffix}`
          }
        } else {
          formattedPrice = `₩${parseFloat(data.price).toLocaleString()}`
        }
        const tag = isService ? 'new-labgig' : 'new-listing'
        const prefix = isService ? 'New LabGig' : 'New listing'
        return sendPushToAll({
          title: `${prefix}: ${data.title} — ${formattedPrice}`,
          body: `Posted by ${sellerName}${uni ? ` (${uni})` : ''}`,
          tag,
          url: isService ? `/labgigs` : `/listing/${data.id}`,
        })
      })
      .catch((err) => console.error('Push notification failed:', err))

    return Response.json({
      success: true,
      data,
      message: 'Listing created successfully',
    })
  } catch (error) {
    console.error('POST listing error:', error)
    return Response.json(
      { error: error.message || 'Failed to create listing' },
      { status: 500 }
    )
  }
}