import { AuthProvider } from '@/shared/context/AuthContext'
import LayoutWrapper from '@/shared/components/LayoutWrapper'
import { Analytics } from '@vercel/analytics/next'
import { Geist, Geist_Mono } from "next/font/google";
import './globals.css'

export const metadata = {
  title: 'ShelterLab - Your Campus Marketplace',
  description: 'Buy and sell items with your campus community',
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
      </body>
    </html>
  )
}