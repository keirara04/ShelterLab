import { supabaseServer } from '@/lib/supabaseServer';

export default async function sitemap() {
  const supabase = supabaseServer;
  
  // Base URLs
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shelter-lab.vercel.app';
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/help-center`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
  
  try {
    // Fetch active listings
    const { data: listings = [] } = await supabase
      .from('listings')
      .select('id, created_at, updated_at')
      .eq('status', 'active')
      .limit(50000);
    
    const listingPages = (listings || []).map((listing) => ({
      url: `${baseUrl}/listing/${listing.id}`,
      lastModified: new Date(listing.updated_at || listing.created_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
    
    // Fetch seller profiles
    const { data: profiles = [] } = await supabase
      .from('profiles')
      .select('id, updated_at')
      .limit(10000);
    
    const profilePages = (profiles || []).map((profile) => ({
      url: `${baseUrl}/profile/${profile.id}`,
      lastModified: new Date(profile.updated_at),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
    
    return [...staticPages, ...listingPages, ...profilePages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticPages;
  }
}
