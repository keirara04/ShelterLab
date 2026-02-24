import { supabaseServer } from '@/services/supabaseServer'
import { getSessionUser } from '@/services/utils/getSessionUser'

const SELLER_BASE = 3     // base points per completed sale
const BUYER_BONUS = 2     // points per confirmed purchase
const MAX_TRUST_SCORE = 100

function getRatingBonus(rating) {
  if (rating === 5) return 2   // seller total: +5
  if (rating === 4) return 1   // seller total: +4
  if (rating === 3) return 0   // seller total: +3
  if (rating <= 2) return -1   // seller total: +2
  return 0
}

export async function POST(request, { params }) {
  try {
    // Get the authenticated user from session — never trust userId from the body
    const sessionUser = await getSessionUser(request)
    if (!sessionUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = sessionUser.id

    const { id } = await params
    const { rating, comment } = await request.json()

    if (!id || !rating) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return Response.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
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
      return Response.json({ error: 'Only the buyer can confirm this transaction' }, { status: 403 })
    }

    if (transaction.status !== 'pending') {
      return Response.json({ error: 'Transaction is no longer pending' }, { status: 400 })
    }

    // 1. Confirm transaction
    const { error: txUpdateError } = await supabaseServer
      .from('transactions')
      .update({ status: 'confirmed' })
      .eq('id', id)

    if (txUpdateError) throw txUpdateError

    // 2. Insert review
    const { error: reviewError } = await supabaseServer
      .from('reviews')
      .insert({
        reviewer_id: userId,
        reviewee_id: transaction.seller_id,
        rating,
        comment: comment || '',
        listing_id: transaction.listing_id,
        is_seller_review: true,
      })

    if (reviewError) throw reviewError

    // 3. Update seller trust score (capped at MAX_TRUST_SCORE)
    const { data: seller } = await supabaseServer
      .from('profiles')
      .select('trust_score')
      .eq('id', transaction.seller_id)
      .single()

    const sellerBonus = SELLER_BASE + getRatingBonus(rating)
    const newSellerScore = Math.min((seller?.trust_score || 0) + sellerBonus, MAX_TRUST_SCORE)
    await supabaseServer
      .from('profiles')
      .update({ trust_score: newSellerScore })
      .eq('id', transaction.seller_id)

    // 4. Update buyer trust score (capped at MAX_TRUST_SCORE)
    const { data: buyer } = await supabaseServer
      .from('profiles')
      .select('trust_score')
      .eq('id', userId)
      .single()

    const newBuyerScore = Math.min((buyer?.trust_score || 0) + BUYER_BONUS, MAX_TRUST_SCORE)
    await supabaseServer
      .from('profiles')
      .update({ trust_score: newBuyerScore })
      .eq('id', userId)

    return Response.json({ success: true, message: 'Transaction confirmed and review submitted' })
  } catch (error) {
    return Response.json({ error: 'Failed to confirm transaction' }, { status: 500 })
  }
}
