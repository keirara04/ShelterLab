import { supabaseServer } from '@/services/supabaseServer'

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, buyerId } = body

    if (!id || !userId) {
      return Response.json(
        { error: 'Missing listing ID or user ID' },
        { status: 400 }
      )
    }

    // Verify the listing belongs to this user
    const { data: listing, error: fetchError } = await supabaseServer
      .from('listings')
      .select('seller_id, is_sold')
      .eq('id', id)
      .single()

    if (fetchError) throw new Error('Listing not found')

    if (listing.seller_id !== userId) {
      return Response.json(
        { error: 'You can only mark your own listings as sold' },
        { status: 403 }
      )
    }

    // If a buyerId is provided: set sold=true and create a transaction
    if (buyerId) {
      if (buyerId === userId) {
        return Response.json(
          { error: 'Buyer cannot be the same as the seller' },
          { status: 400 }
        )
      }

      const { data, error: updateError } = await supabaseServer
        .from('listings')
        .update({ is_sold: true })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Create pending transaction
      const { error: txError } = await supabaseServer
        .from('transactions')
        .insert({
          listing_id: id,
          seller_id: userId,
          buyer_id: buyerId,
          status: 'pending',
        })

      if (txError) throw txError

      return Response.json({
        success: true,
        data,
        message: 'Listing marked as sold — awaiting buyer confirmation',
      })
    }

    // No buyer: toggle is_sold (original behaviour)
    const newSoldStatus = !listing.is_sold

    const { data, error: updateError } = await supabaseServer
      .from('listings')
      .update({ is_sold: newSoldStatus })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    return Response.json({
      success: true,
      data,
      message: newSoldStatus ? 'Listing marked as sold' : 'Listing marked as available',
    })
  } catch (error) {
    return Response.json(
      { error: error.message || 'Failed to update listing' },
      { status: 500 }
    )
  }
}
