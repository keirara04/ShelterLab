import supabaseServer from '@/services/supabaseServer'

export async function generateMetadata({ params }) {
  try {
    const { id } = await params
    const { data } = await supabaseServer
      .from('listings')
      .select('title, description, price, image_urls, categories')
      .eq('id', id)
      .single()

    if (!data) return { title: 'Listing | ShelterLab' }

    const desc = data.description
      ? `${data.description.slice(0, 140)}… — ₩${Number(data.price).toLocaleString()}`
      : `₩${Number(data.price).toLocaleString()} — Available on ShelterLab`

    return {
      title: data.title,
      description: desc,
      openGraph: {
        title: `${data.title} | ShelterLab`,
        description: desc,
        images: data.image_urls?.[0] ? [{ url: data.image_urls[0], alt: data.title }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${data.title} | ShelterLab`,
        description: desc,
        images: data.image_urls?.[0] ? [data.image_urls[0]] : [],
      },
    }
  } catch {
    return { title: 'Listing | ShelterLab' }
  }
}

export default function ListingLayout({ children }) {
  return children
}
