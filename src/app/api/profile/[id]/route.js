import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') // 'seller' or 'buyer'

    // Fetch profile
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (profileError) {
      return Response.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Build parallel queries
    const queries = []

    // Fetch reviews with reviewer info
    const isSeller = role === 'seller'
    queries.push(
      supabaseServer
        .from('reviews')
        .select('*, reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url)')
        .eq('reviewee_id', id)
        .eq('is_seller_review', isSeller)
        .order('created_at', { ascending: false })
    )

    // Fetch listings if viewing seller profile
    if (role === 'seller') {
      queries.push(
        supabaseServer
          .from('listings')
          .select('*')
          .eq('seller_id', id)
          .order('created_at', { ascending: false })
      )
    }

    const results = await Promise.all(queries)

    const reviews = results[0].data || []
    const listings = role === 'seller' ? (results[1].data || []) : []

    return Response.json({
      success: true,
      profile,
      reviews,
      listings,
    })
  } catch (error) {
    console.error('GET profile error:', error)
    return Response.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}
