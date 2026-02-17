import { supabaseServer } from '@/services/supabaseServer'
import { getSessionUser } from '@/services/utils/getSessionUser'

export async function POST(request, { params }) {
  try {
    // Get the authenticated user from session — never trust userId from the body
    const sessionUser = await getSessionUser(request)
    if (!sessionUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = sessionUser.id

    const { id } = await params

    if (!id) {
      return Response.json({ error: 'Missing transaction id' }, { status: 400 })
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
    return Response.json({ error: 'Failed to reject transaction' }, { status: 500 })
  }
}
