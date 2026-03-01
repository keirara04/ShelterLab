// src/app/api/reports/route.js
// User report submission + admin moderation queue
//
// Required DB migration (run once in Supabase SQL editor):
// CREATE TABLE reports (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   reporter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
//   reported_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
//   listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
//   reason text NOT NULL,
//   description text NOT NULL,
//   status text NOT NULL DEFAULT 'Pending',
//   resolved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
//   resolved_at timestamptz,
//   created_at timestamptz NOT NULL DEFAULT now()
// );
// NOTE: All FKs must point to public.profiles — not auth.users — so PostgREST
// can resolve embedded joins (.select('reporter:reporter_id(full_name)'))
// ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Admin full access" ON reports USING (true) WITH CHECK (true);

import { supabaseServer } from '@/services/supabaseServer'
import { reportSchema } from '@/services/utils/validation'

async function getAuthUser(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseServer.auth.getUser(token)
  if (error || !user) return null
  return user
}

// POST /api/reports — authenticated user submits a report
export async function POST(request) {
  try {
    const user = await getAuthUser(request)
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = reportSchema.safeParse(body)
    if (!result.success) {
      const message = result.error.errors.map((e) => e.message).join(', ')
      return Response.json({ error: message }, { status: 400 })
    }
    const { reason, description, listingId, userId: reportedUserId } = result.data

    const { data, error } = await supabaseServer
      .from('reports')
      .insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId || null,
        listing_id: listingId || null,
        reason,
        description,
        status: 'Pending',
      })
      .select()
      .single()

    if (error) throw error
    return Response.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('POST report error:', error)
    return Response.json({ error: 'Failed to submit report' }, { status: 500 })
  }
}

// GET /api/reports?status=Pending — admin fetches moderation queue
export async function GET(request) {
  try {
    const user = await getAuthUser(request)
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    if (user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'Pending'

    let query = supabaseServer
      .from('reports')
      .select(`
        *,
        reporter:reporter_id ( full_name ),
        reported_user:reported_user_id ( full_name ),
        listing:listing_id ( title )
      `)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error

    return Response.json({ success: true, data })
  } catch (error) {
    console.error('GET reports error:', error)
    return Response.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}

// PATCH /api/reports — admin resolves or dismisses a report
export async function PATCH(request) {
  try {
    const user = await getAuthUser(request)
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    if (user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, status } = await request.json()
    if (!id || !['Reviewed', 'Resolved', 'Dismissed'].includes(status)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('reports')
      .update({ status, resolved_by: user.id, resolved_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return Response.json({ success: true, data })
  } catch (error) {
    console.error('PATCH report error:', error)
    return Response.json({ error: 'Failed to update report' }, { status: 500 })
  }
}
