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
    console.log('Listings POST called')
    
    // Parse request body
    const body = await request.json()
    console.log('Request body:', body)
    
    const {
      title,
      description,
      price,
      categories,
      condition,
      kakaoLink,
      imageUrls,
      userId,
    } = body

    console.log('Creating listing with:', { title, price, categories, imageUrls, userId })

    // Validate required fields
    if (!title || !price || !categories || categories.length === 0 || !imageUrls || imageUrls.length === 0) {
      const details = {
        title: !!title,
        price: !!price,
        categories: categories?.length > 0,
        imageUrls: imageUrls?.length > 0
      }
      console.log('Validation failed:', details)
      return Response.json(
        { 
          error: 'Missing required fields',
          details
        },
        { status: 400 }
      )
    }

    if (!userId) {
      return Response.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Ensure the user profile exists (create if missing)
    const { data: existingProfile } = await supabaseServer
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (!existingProfile) {
      console.log('Profile not found for userId:', userId, 'Creating profile...')
      const { error: profileError } = await supabaseServer
        .from('profiles')
        .insert({
          id: userId,
          full_name: 'User',
          email: 'user@example.com',
        })

      if (profileError) {
        console.error('Failed to create profile:', profileError)
        return Response.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        )
      }
    }

    console.log('All validations passed, inserting into database...')

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

    console.log('Listing created successfully:', data)

    // Send push notification to all subscribers about the new listing
    try {
      // Fetch seller profile for notification details
      const { data: sellerProfile } = await supabaseServer
        .from('profiles')
        .select('full_name, university')
        .eq('id', userId)
        .single()

      const sellerName = sellerProfile?.full_name || 'Someone'
      const university = sellerProfile?.university || ''
      const formattedPrice = `₩${parseFloat(data.price).toLocaleString()}`

      await sendPushToAll({
        title: `🛒 ${data.title} — ${formattedPrice}`,
        body: `Listed by ${sellerName}${university ? ` (${university})` : ''}`,
        tag: 'new-listing',
        url: `/buyer/${data.id}`,
      })
      console.log('Push notification sent for new listing')
    } catch (pushError) {
      console.error('Failed to send push notification:', pushError)
      // Don't fail the listing creation if push fails
    }

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