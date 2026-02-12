// src/app/api/listings/[id]/mark-sold/route.js
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body

    if (!id || !userId) {
      return Response.json(
        { error: 'Missing listing ID or user ID' },
        { status: 400 }
      )
    }

    console.log(`Marking listing ${id} as sold for user ${userId}`)

    // First verify the listing belongs to this user
    const { data: listing, error: fetchError } = await supabaseServer
      .from('listings')
      .select('seller_id, is_sold')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      throw new Error('Listing not found')
    }

    if (listing.seller_id !== userId) {
      return Response.json(
        { error: 'You can only mark your own listings as sold' },
        { status: 403 }
      )
    }

    // Toggle the is_sold field
    const newSoldStatus = !listing.is_sold
    console.log(`Updating listing ${id}: is_sold from ${listing.is_sold} to ${newSoldStatus}`)
    
    const { data, error: updateError } = await supabaseServer
      .from('listings')
      .update({ is_sold: newSoldStatus })
      .eq('id', id)
      .select()
      .single()

    console.log('Update response:', { data, error: updateError })

    if (updateError) {
      console.error('Update error:', updateError)
      throw updateError
    }

    console.log(`Listing ${newSoldStatus ? 'marked as sold' : 'marked as available'} successfully`)

    return Response.json({
      success: true,
      data,
      message: newSoldStatus ? 'Listing marked as sold' : 'Listing marked as available',
    })
  } catch (error) {
    console.error('Mark sold route error:', error)
    return Response.json(
      { error: error.message || 'Failed to mark listing as sold' },
      { status: 500 }
    )
  }
}