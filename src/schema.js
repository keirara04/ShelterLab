/**
 * JSON-LD Schema Markup generators for SEO
 */

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Shelter Lab - University Marketplace',
    description: 'Buy and sell items within your university community',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://shelter-lab.vercel.app',
    logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://shelter-lab.vercel.app'}/logo.svg`,
    sameAs: [
      'https://www.facebook.com/shelterlab',
      'https://www.twitter.com/shelterlab',
      'https://www.instagram.com/shelterlab',
    ],
  };
}

export function generateProductSchema(listing) {
  if (!listing) return null;
  
  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: listing.title,
    description: listing.description,
    image: listing.images?.[0] || '',
    brand: {
      '@type': 'Brand',
      name: listing.seller?.full_name || 'Seller',
    },
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://shelter-lab.vercel.app'}/listing/${listing.id}`,
      priceCurrency: 'USD',
      price: listing.price,
      availability: listing.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Person',
        name: listing.seller?.full_name || 'Seller',
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://shelter-lab.vercel.app'}/profile/${listing.seller_id}`,
      },
    },
    category: listing.category,
    datePublished: listing.created_at,
  };
}

export function generateProfileSchema(profile, averageRating, reviewCount) {
  if (!profile) return null;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.full_name,
    description: profile.bio || '',
    image: profile.profile_image || '',
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://shelter-lab.vercel.app'}/profile/${profile.id}`,
    aggregateRating: averageRating ? {
      '@type': 'AggregateRating',
      ratingValue: averageRating,
      reviewCount: reviewCount || 0,
      bestRating: '5',
      worstRating: '1',
    } : undefined,
    jobTitle: 'Seller',
    affiliation: {
      '@type': 'Organization',
      name: profile.university || '',
    },
  };
}

export function generateBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://shelter-lab.vercel.app'}${item.url}`,
    })),
  };
}

export function generateFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
