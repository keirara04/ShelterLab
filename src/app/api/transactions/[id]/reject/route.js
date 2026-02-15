import { supabaseServer } from '@/services/supabaseServer'

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body

    if (!id || !userId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch the transaction
    const { data: transaction, error: txFetchError } = await supabaseServer
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single()

    if (txFetchError || !transaction) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (transaction.buyer_id !== userId) {
      return Response.json({ error: 'Only the buyer can reject this transaction' }, { status: 403 })
    }

    if (transaction.status !== 'pending') {
      return Response.json({ error: 'Transaction is no longer pending' }, { status: 400 })
    }

    // Reject transaction
    const { error: txUpdateError } = await supabaseServer
      .from('transactions')
      .update({ status: 'rejected' })
      .eq('id', id)

    if (txUpdateError) throw txUpdateError

    // Revert listing to available
    const { error: listingError } = await supabaseServer
      .from('listings')
      .update({ is_sold: false })
      .eq('id', transaction.listing_id)

    if (listingError) throw listingError

    return Response.json({ success: true, message: 'Transaction rejected — listing is now available again' })
  } catch (error) {
    return Response.json(
      { error: error.message || 'Failed to reject transaction' },
      { status: 500 }
    )
  }
}
