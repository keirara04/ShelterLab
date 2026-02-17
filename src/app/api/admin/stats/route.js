import { supabaseServer } from '@/services/supabaseServer'
import { verifyAdmin } from '@/services/utils/verifyAdmin'

export async function GET(request) {
  const admin = await verifyAdmin(request)
  if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [
      { count: totalListings },
      { count: activeListings },
      { count: soldListings },
      { count: totalUsers },
      { count: newSignupsThisWeek },
      { data: universityData },
    ] = await Promise.all([
      supabaseServer.from('listings').select('*', { count: 'exact', head: true }),
      supabaseServer.from('listings').select('*', { count: 'exact', head: true }).eq('is_sold', false),
      supabaseServer.from('listings').select('*', { count: 'exact', head: true }).eq('is_sold', true),
      supabaseServer.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseServer.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo),
      supabaseServer.from('profiles').select('university').not('university', 'is', null),
    ])

    // Tally listings per university
    const tally = {}
    ;(universityData || []).forEach(({ university }) => {
      if (university) tally[university] = (tally[university] || 0) + 1
    })
    const topUniversity = Object.entries(tally).sort((a, b) => b[1] - a[1])[0] || null

    return Response.json({
      success: true,
      data: {
        totalListings,
        activeListings,
        soldListings,
        totalUsers,
        newSignupsThisWeek,
        topUniversity: topUniversity ? { name: topUniversity[0], count: topUniversity[1] } : null,
      },
    })
  } catch (err) {
    return Response.json({ error: 'An error occurred' }, { status: 500 })
  }
}
