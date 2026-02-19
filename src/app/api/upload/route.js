// src/app/api/upload/route.js
import { createClient } from '@supabase/supabase-js'
import { getSessionUser } from '@/services/utils/getSessionUser'
import { applyRateLimit, uploadLimiter } from '@/services/utils/rateLimit'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    // Verify the caller is authenticated and get their real userId from the session
    const sessionUser = await getSessionUser(request)
    if (!sessionUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = sessionUser.id

    // Rate limit: 30 uploads per hour per user
    const rl = await applyRateLimit(uploadLimiter, userId)
    if (rl) return rl

    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('files')

    if (!files || files.length === 0) {
      return Response.json({ error: 'No files provided' }, { status: 400 })
    }

    if (files.length > 5) {
      return Response.json({ error: 'Maximum 5 images allowed' }, { status: 400 })
    }

    const uploadedUrls = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      if (file.size > 5 * 1024 * 1024) {
        return Response.json({ error: 'File exceeds 5MB limit' }, { status: 400 })
      }

      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(7)
      const fileExt = file.name.split('.').pop()
      const fileName = `listings/${userId}/${timestamp}-${randomStr}.${fileExt}`

      try {
        const buffer = await file.arrayBuffer()

        const { error: uploadError } = await supabaseAdmin.storage
          .from('listings')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: false,
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          return Response.json({ error: 'Failed to upload image' }, { status: 500 })
        }

        const { data: publicUrlData } = supabaseAdmin.storage
          .from('listings')
          .getPublicUrl(fileName)

        uploadedUrls.push(publicUrlData.publicUrl)
      } catch (fileError) {
        console.error('File upload error:', fileError)
        return Response.json({ error: 'Failed to process file' }, { status: 500 })
      }
    }

    return Response.json({
      success: true,
      urls: uploadedUrls,
      count: uploadedUrls.length,
    })
  } catch (error) {
    console.error('Upload route error:', error)
    return Response.json({ error: 'Failed to process upload' }, { status: 500 })
  }
}
