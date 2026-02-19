import { AuthProvider } from '@/shared/context/AuthContext'
import LayoutWrapper from '@/shared/components/LayoutWrapper'
import ServiceWorkerRegistrar from '@/shared/components/ServiceWorkerRegistrar'
import { Analytics } from '@vercel/analytics/next'
import { Geist, Geist_Mono } from "next/font/google";
import './globals.css'

export const metadata = {
  title: {
    default: 'ShelterLab - Your Campus Marketplace',
    template: '%s | ShelterLab',
  },
  description: 'Buy and sell items with your campus community on ShelterLab — the trusted marketplace for university students.',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    type: 'website',
    siteName: 'ShelterLab',
    title: 'ShelterLab - Your Campus Marketplace',
    description: 'Buy and sell items with your campus community on ShelterLab.',
    images: [{ url: '/logo.svg', width: 512, height: 512, alt: 'ShelterLab Logo' }],
  },
  twitter: {
    card: 'summary',
    title: 'ShelterLab - Your Campus Marketplace',
    description: 'Buy and sell items with your campus community on ShelterLab.',
    images: ['/logo.svg'],
  },
}

const geistSans = Geist({
  variable: "--font-geist-sans", // This matches your CSS variable!
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
        <Analytics />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}