import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    // Verify auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return Response.json({ error: 'Missing authorization' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('avatar')

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: 'Only JPEG, PNG, and WebP images are allowed' }, { status: 400 })
    }

    // Validate size (2MB max for avatars)
    if (file.size > 2 * 1024 * 1024) {
      return Response.json({ error: 'File must be under 2MB' }, { status: 400 })
    }

    // Generate file path — overwrite previous avatar by using a fixed name per user
    const fileExt = file.name.split('.').pop()
    const fileName = `avatars/${user.id}/avatar.${fileExt}`

    const buffer = await file.arrayBuffer()

    // Upload to Supabase Storage (upsert to overwrite old avatar)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('listings')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      return Response.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    // Get public URL with cache-bust
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('listings')
      .getPublicUrl(fileName)

    const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`

    // Update profile with new avatar URL
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id)

    if (updateError) {
      return Response.json({ error: `Profile update failed: ${updateError.message}` }, { status: 500 })
    }

    return Response.json({ success: true, avatar_url: avatarUrl })
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to upload avatar' }, { status: 500 })
  }
}
