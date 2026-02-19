import supabaseServer from '@/services/supabaseServer'

export async function generateMetadata({ params }) {
  try {
    const { data } = await supabaseServer
      .from('profiles')
      .select('full_name, avatar_url, university, trust_score')
      .eq('id', params.id)
      .single()

    if (!data) return { title: 'Seller Profile | ShelterLab' }

    const title = `${data.full_name} | ShelterLab`
    const desc = data.university
      ? `${data.full_name} is a seller at ${data.university} on ShelterLab — campus marketplace.`
      : `View ${data.full_name}'s listings on ShelterLab.`

    return {
      title,
      description: desc,
      openGraph: {
        title,
        description: desc,
        images: data.avatar_url ? [{ url: data.avatar_url, alt: data.full_name }] : [],
        type: 'profile',
      },
      twitter: {
        card: 'summary',
        title,
        description: desc,
        images: data.avatar_url ? [data.avatar_url] : [],
      },
    }
  } catch {
    return { title: 'Seller Profile | ShelterLab' }
  }
}

export default function SellerProfileLayout({ children }) {
  return children
}
