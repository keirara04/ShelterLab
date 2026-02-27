import { supabaseServer } from '@/services/supabaseServer'
import { verifyAdmin } from '@/services/utils/verifyAdmin'

export async function GET(request) {
  const admin = await verifyAdmin(request)
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = supabaseServer
      .from('listings')
      .select('id, title, price, is_sold, created_at, image_urls, categories, gig_type, pricing_type, visible_to_all, profiles!listings_seller_id_fkey(full_name, university)')
      .order('created_at', { ascending: false })
      .limit(200)

    if (category === 'services') {
      // LabGigs section: only service listings
      query = query.contains('categories', ['services'])
    } else if (category && category !== 'all') {
      // Specific non-service category
      query = query.contains('categories', [category]).not('categories', 'cs', '{"services"}')
    } else {
      // Default (all): exclude service listings — they're managed in LabGigs section
      query = query.not('categories', 'cs', '{"services"}')
    }

    const { data, error } = await query
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true, data })
  } catch (err) {
    return Response.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function PATCH(request) {
  const admin = await verifyAdmin(request)
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { listingId, isSold } = await request.json()
    if (!listingId) return Response.json({ error: 'Missing listingId' }, { status: 400 })

    const { error } = await supabaseServer
      .from('listings')
      .update({ is_sold: isSold })
      .eq('id', listingId)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function DELETE(request) {
  const admin = await verifyAdmin(request)
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { listingId } = await request.json()
    if (!listingId) return Response.json({ error: 'Missing listingId' }, { status: 400 })

    const { error } = await supabaseServer
      .from('listings')
      .delete()
      .eq('id', listingId)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: 'An error occurred' }, { status: 500 })
  }
}
