import { supabaseServer } from '@/services/supabaseServer'
import { applyRateLimit, pushSubscribeLimiter } from '@/services/utils/rateLimit'

async function getUserFromRequest(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabaseServer.auth.getUser(token)
  return user || null
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: 10 subscribe calls per hour per user
    const rl = await applyRateLimit(pushSubscribeLimiter, user.id)
    if (rl) return rl

    const { endpoint, keys } = await request.json()

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return Response.json({ error: 'Invalid subscription object' }, { status: 400 })
    }

    const { error } = await supabaseServer
      .from('push_subscriptions')
      .upsert(
        { user_id: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
        { onConflict: 'endpoint' }
      )

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    console.error('Push subscribe error:', error)
    return Response.json({ error: 'Failed to save subscription' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { endpoint } = await request.json()

    if (!endpoint) {
      return Response.json({ error: 'Endpoint required' }, { status: 400 })
    }

    const { error } = await supabaseServer
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('user_id', user.id)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    console.error('Push unsubscribe error:', error)
    return Response.json({ error: 'Failed to remove subscription' }, { status: 500 })
  }
}
