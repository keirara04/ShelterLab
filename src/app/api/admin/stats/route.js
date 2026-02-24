import { supabaseServer } from '@/services/supabaseServer'
import { verifyAdmin } from '@/services/utils/verifyAdmin'

export async function GET(request) {
  const admin = await verifyAdmin(request)
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const now = new Date().toISOString()

    const [
      { count: totalListings },
      { count: activeListings },
      { count: soldListings },
      { count: totalUsers },
      { count: newSignupsThisWeek },
      { data: universityData },
      { data: recentSignups },
      { data: reviewsData },
      { data: soldListingsData },
      { data: recentListings },
      { data: recentUsers },
      { data: recentTransactions },
      { data: expiringListings },
    ] = await Promise.all([
      supabaseServer.from('listings').select('*', { count: 'exact', head: true }),
      supabaseServer.from('listings').select('*', { count: 'exact', head: true }).eq('is_sold', false),
      supabaseServer.from('listings').select('*', { count: 'exact', head: true }).eq('is_sold', true),
      supabaseServer.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseServer.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo),
      supabaseServer.from('profiles').select('university').not('university', 'is', null),
      // Signups by day (last 7 days)
      supabaseServer.from('profiles').select('created_at').gte('created_at', oneWeekAgo),
      // Reviews for avg rating
      supabaseServer.from('reviews').select('rating'),
      // Sold listings for GMV
      supabaseServer.from('listings').select('price').eq('is_sold', true),
      // Recent activity: listings
      supabaseServer.from('listings').select('id, title, is_sold, created_at, seller:profiles!seller_id(full_name)').order('created_at', { ascending: false }).limit(10),
      // Recent activity: users
      supabaseServer.from('profiles').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(10),
      // Recent activity: transactions
      supabaseServer.from('transactions').select('id, status, created_at, listing:listings!listing_id(title), buyer:profiles!buyer_id(full_name)').eq('status', 'confirmed').order('created_at', { ascending: false }).limit(10),
      // Expiring soon
      supabaseServer.from('listings').select('id, title, expires_at, seller:profiles!seller_id(full_name)').eq('is_sold', false).lte('expires_at', sevenDaysFromNow).gte('expires_at', now).order('expires_at', { ascending: true }).limit(10),
    ])

    // University breakdown (full sorted array)
    const tally = {}
    ;(universityData || []).forEach(({ university }) => {
      if (university) tally[university] = (tally[university] || 0) + 1
    })
    const universityBreakdown = Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))
    const topUniversity = universityBreakdown[0] || null

    // Signups by day
    const dayBuckets = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      dayBuckets[d.toISOString().slice(0, 10)] = 0
    }
    ;(recentSignups || []).forEach((p) => {
      const day = new Date(p.created_at).toISOString().slice(0, 10)
      if (dayBuckets[day] !== undefined) dayBuckets[day]++
    })
    const signupsByDay = Object.entries(dayBuckets).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
      count,
    }))

    // Review stats
    const totalReviews = (reviewsData || []).length
    const averageRating = totalReviews > 0
      ? (reviewsData.reduce((sum, r) => sum + r.rating, 0) / totalReviews)
      : 0

    // Total GMV
    const totalGMV = (soldListingsData || []).reduce((sum, l) => sum + (Number(l.price) || 0), 0)

    // Recent activity feed (merge + sort + take 15)
    const activity = []
    ;(recentListings || []).forEach((l) => {
      activity.push({
        type: l.is_sold ? 'listing_sold' : 'listing_created',
        description: l.is_sold
          ? `${l.seller?.full_name || 'Someone'} sold "${l.title}"`
          : `${l.seller?.full_name || 'Someone'} listed "${l.title}"`,
        created_at: l.created_at,
      })
    })
    ;(recentUsers || []).forEach((u) => {
      activity.push({
        type: 'user_joined',
        description: `${u.full_name || 'New user'} joined the platform`,
        created_at: u.created_at,
      })
    })
    ;(recentTransactions || []).forEach((t) => {
      activity.push({
        type: 'transaction_completed',
        description: `${t.buyer?.full_name || 'Buyer'} completed purchase of "${t.listing?.title || 'item'}"`,
        created_at: t.created_at,
      })
    })
    activity.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    const recentActivity = activity.slice(0, 15)

    // Expiring soon
    const expiringSoon = (expiringListings || []).map((l) => ({
      id: l.id,
      title: l.title,
      seller_name: l.seller?.full_name || 'Unknown',
      expires_at: l.expires_at,
      days_remaining: Math.ceil((new Date(l.expires_at) - Date.now()) / (1000 * 60 * 60 * 24)),
    }))

    return Response.json({
      success: true,
      data: {
        totalListings,
        activeListings,
        soldListings,
        totalUsers,
        newSignupsThisWeek,
        topUniversity,
        universityBreakdown,
        signupsByDay,
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        totalGMV,
        recentActivity,
        expiringSoon,
      },
    })
  } catch (err) {
    return Response.json({ error: 'An error occurred' }, { status: 500 })
  }
}
