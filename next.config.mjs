/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['web-push'],
  turbopack: {
    root: new URL('.', import.meta.url).pathname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 31536000, // 1 year
  },
};

export default nextConfig;
