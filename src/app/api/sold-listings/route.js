import { supabaseServer } from '@/services/supabaseServer'

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('listings')
      .select('id, title, description, price, image_urls, categories, condition, is_sold, created_at, updated_at, seller_id')
      .eq('seller_id', userId)
      .eq('is_sold', true)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return Response.json({
      success: true,
      listings: data || []
    })
  } catch (error) {
    console.error('Error fetching sold listings:', error)
    return Response.json(
      { error: error.message || 'Failed to fetch sold listings' },
      { status: 500 }
    )
  }
}
