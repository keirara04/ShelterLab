import { AuthProvider } from '@/context/AuthContext'
import LayoutWrapper from '@/components/LayoutWrapper'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata = {
  title: 'ShelterLab - Your Campus Marketplace',
  description: 'Buy and sell items with your campus community',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
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