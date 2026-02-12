import { supabaseServer } from '@/lib/supabaseServer'

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
