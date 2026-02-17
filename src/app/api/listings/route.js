// src/app/api/listings/route.js
import { supabaseServer } from '@/services/supabaseServer'
import { sendPushToAll } from '@/services/utils/sendPush'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const searchTerm = searchParams.get('search') 
    const university = searchParams.get('university')
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
      .select('*, profiles!listings_seller_id_fkey(full_name, university)', { count: 'exact' })

    if (sellerIds !== null) {
      query = query.in('seller_id', sellerIds)
    }

    if (category && category !== 'all') {
      query = query.contains('categories', [category])
    }

    if (searchTerm) {
      query = query.or(
        `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      )
    }

    const from = page * limit
    const to = from + limit - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return Response.json({
      success: true,
      data,
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

    // Parse request body
    const body = await request.json()
    const { title, description, price, categories, condition, kakaoLink, imageUrls } = body

    // Server-side validation
    const errors = []
    const trimmedTitle = (title || '').trim()
    if (!trimmedTitle || trimmedTitle.length < 3) errors.push('Title must be at least 3 characters')
    if (trimmedTitle.length > 100) errors.push('Title must be 100 characters or less')
    const parsedPrice = parseFloat(price)
    if (!price || parsedPrice <= 0) errors.push('Price must be greater than 0')
    if (parsedPrice > 9999999) errors.push('Price cannot exceed 9,999,999')
    if (!categories || categories.length === 0) errors.push('At least one category is required')
    if (!imageUrls || imageUrls.length === 0) errors.push('At least one image is required')
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
        price: parseFloat(price),
        categories,
        condition: condition || 'good',
        image_urls: imageUrls,
        kakao_link: kakaoLink || null,
        expires_at: expiryDate.toISOString(),
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
        const university = sellerProfile?.university || ''
        const formattedPrice = `₩${parseFloat(data.price).toLocaleString()}`
        return sendPushToAll({
          title: `New listing: ${data.title} — ${formattedPrice}`,
          body: `Listed by ${sellerName}${university ? ` (${university})` : ''}`,
          tag: 'new-listing',
          url: `/listing/${data.id}`,
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