import { supabaseServer } from '@/services/supabaseServer'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listing_id')
    const listingIds = searchParams.get('listing_ids') // comma-separated, for counts

    if (listingIds) {
      const ids = listingIds.split(',').filter(Boolean).slice(0, 50) // max 50
      if (ids.length === 0) return Response.json({ success: true, data: {} })

      const { data, error } = await supabaseServer
        .from('gig_comments')
        .select('listing_id')
        .in('listing_id', ids)

      if (error) return Response.json({ error: error.message }, { status: 500 })

      const counts = {}
      ids.forEach(id => { counts[id] = 0 })
      ;(data || []).forEach(({ listing_id }) => { counts[listing_id] = (counts[listing_id] || 0) + 1 })
      return Response.json({ success: true, data: counts })
    }

    if (!listingId) return Response.json({ error: 'listing_id required' }, { status: 400 })

    const { data, error } = await supabaseServer
      .from('gig_comments')
      .select('*, profiles(id, full_name, avatar_url, university)')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: true })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true, data: data || [] })
  } catch (err) {
    return Response.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { listingId, content } = await request.json()
    if (!listingId || !content?.trim()) return Response.json({ error: 'Missing fields' }, { status: 400 })
    if (content.trim().length > 500) return Response.json({ error: 'Comment too long (max 500 chars)' }, { status: 400 })

    const { data, error } = await supabaseServer
      .from('gig_comments')
      .insert({ listing_id: listingId, user_id: user.id, content: content.trim() })
      .select('*, profiles(id, full_name, avatar_url, university)')
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true, data })
  } catch (err) {
    return Response.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { commentId } = await request.json()
    if (!commentId) return Response.json({ error: 'Missing commentId' }, { status: 400 })

    const { error } = await supabaseServer
      .from('gig_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: 'An error occurred' }, { status: 500 })
  }
}
