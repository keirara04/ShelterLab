// src/app/api/upload/route.js
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    console.log('Upload route called')

    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('files')
    const userId = formData.get('userId')

    console.log('Files:', files.length, 'UserId:', userId)

    if (!files || files.length === 0) {
      return Response.json({ error: 'No files provided' }, { status: 400 })
    }

    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 })
    }

    if (files.length > 5) {
      return Response.json(
        { error: 'Maximum 5 images allowed' },
        { status: 400 }
      )
    }

    const uploadedUrls = []

    // Upload each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      console.log(`Uploading file ${i + 1}: ${file.name}, size: ${file.size}`)

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        return Response.json(
          { error: `File exceeds 5MB limit` },
          { status: 400 }
        )
      }

      // Generate file path
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(7)
      const fileExt = file.name.split('.').pop()
      const fileName = `listings/${userId}/${timestamp}-${randomStr}.${fileExt}`

      console.log('Uploading to path:', fileName)

      try {
        // Read file buffer
        const buffer = await file.arrayBuffer()

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabaseAdmin.storage
          .from('listings')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: false,
          })

        console.log('Upload response:', data, uploadError)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          return Response.json(
            { error: `Failed to upload image: ${uploadError.message}` },
            { status: 500 }
          )
        }

        // Build public URL
        const { data: publicUrlData } = supabaseAdmin.storage
          .from('listings')
          .getPublicUrl(fileName)

        console.log('Public URL:', publicUrlData.publicUrl)

        uploadedUrls.push(publicUrlData.publicUrl)
      } catch (fileError) {
        console.error('File upload error:', fileError)
        return Response.json(
          { error: `Failed to process file: ${fileError.message}` },
          { status: 500 }
        )
      }
    }

    console.log('All files uploaded:', uploadedUrls)

    return Response.json({
      success: true,
      urls: uploadedUrls,
      count: uploadedUrls.length,
    })
  } catch (error) {
    console.error('Upload route error:', error)
    return Response.json(
      { error: error.message || 'Failed to process upload' },
      { status: 500 }
    )
  }
}