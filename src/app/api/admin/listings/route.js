import { supabaseServer } from '@/services/supabaseServer'
import { verifyAdmin } from '@/services/utils/verifyAdmin'

export async function GET(request) {
  const admin = await verifyAdmin(request)
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { data, error } = await supabaseServer
      .from('listings')
      .select('id, title, price, is_sold, created_at, image_urls, profiles!listings_seller_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(100)

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
