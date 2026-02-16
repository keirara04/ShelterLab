import webpush from 'web-push'
import { supabaseServer } from '@/services/supabaseServer'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

/**
 * Send a push notification to all subscribers.
 * @param {{ title: string, body: string, tag?: string, url?: string }} payload
 */
export async function sendPushToAll(payload) {
  try {
    const { data: subs } = await supabaseServer
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')

    if (!subs?.length) return

    await Promise.allSettled(
      subs.map((sub) =>
        webpush
          .sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload)
          )
          .catch((err) => {
            if (err.statusCode === 410) {
              // Subscription expired — remove it
              supabaseServer
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', sub.endpoint)
            }
          })
      )
    )
  } catch (err) {
    console.error('sendPushToAll error:', err)
  }
}
