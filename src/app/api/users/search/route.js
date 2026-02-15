import { supabaseServer } from '@/services/supabaseServer'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')?.trim()

  if (!name || name.length < 2) {
    return Response.json({ users: [] })
  }

  const { data, error } = await supabaseServer
    .from('profiles')
    .select('id, full_name, avatar_url, university')
    .ilike('full_name', `%${name}%`)
    .limit(5)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ users: data || [] })
}
