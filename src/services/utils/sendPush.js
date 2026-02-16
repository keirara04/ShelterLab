import webpush from 'web-push'
import { supabaseServer } from '@/services/supabaseServer'

// Only configure VAPID if all required env vars are present
const vapidSubject = process.env.VAPID_SUBJECT
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

let pushEnabled = false
if (vapidSubject && vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
  pushEnabled = true
} else {
  console.warn('Push notifications disabled: Missing VAPID environment variables')
}

/**
 * Send a push notification to all subscribers.
 * @param {{ title: string, body: string, tag?: string, url?: string }} payload
 */
export async function sendPushToAll(payload) {
  if (!pushEnabled) {
    console.log('Push notifications not configured, skipping')
    return
  }
  
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
