import { supabaseServer } from '@/services/supabaseServer'
import { getSessionUser } from '@/services/utils/getSessionUser'

export async function GET(request) {
  // Get the authenticated user from session — never trust userId from query params
  const sessionUser = await getSessionUser(request)
  if (!sessionUser) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = sessionUser.id

  const { data, error } = await supabaseServer
    .from('transactions')
    .select(`
      id, status, created_at,
      listing:listings!listing_id (id, title, price, image_urls),
      seller:profiles!seller_id (id, full_name, avatar_url)
    `)
    .eq('buyer_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }

  return Response.json({ transactions: data || [] })
}
