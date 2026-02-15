import { supabaseServer } from '@/services/supabaseServer'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return Response.json({ error: 'Missing userId' }, { status: 400 })
  }

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
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ transactions: data || [] })
}
