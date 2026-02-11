'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import AuthModal from '@/components/AuthModal'

export default function BottomNav() {
  const pathname = usePathname()
  const { isAuthenticated, profile } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingHref, setPendingHref] = useState(null)

  const navItems = [
    {
      name: 'Home',
      href: '/',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      requiresAuth: false,
    },
    {
      name: 'Sell',
      href: '/sell',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      requiresAuth: true,
    },
    {
      name: 'My Items',
      href: '/my-listings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      requiresAuth: true,
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      requiresAuth: true,
    },
  ]

  const handleLockedTap = (href) => {
    setPendingHref(href)
    setShowAuthModal(true)
  }

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t backdrop-blur-2xl"
        style={{
          background: 'rgba(17, 24, 39, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center justify-around h-16 px-2 max-w-screen-sm mx-auto">
          {navItems.map((item) => {
            const isLocked = item.requiresAuth && !isAuthenticated
            const isActive = pathname === item.href

            if (isLocked) {
              return (
                <button
                  key={item.name}
                  onClick={() => handleLockedTap(item.href)}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg touch-manipulation min-h-[60px] min-w-[64px] text-gray-600"
                >
                  <div className="relative">
                    {item.icon}
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
                      <svg className="w-2 h-2 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-xs font-bold">{item.name}</span>
                </button>
              )
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 touch-manipulation min-h-[60px] min-w-[64px] ${
                  isActive
                    ? 'text-blue-400'
                    : 'text-gray-400 hover:text-white active:text-blue-300'
                }`}
                style={{
                  background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                }}
              >
                {item.name === 'Profile' && profile ? (
                  <div className={`${isActive ? 'scale-110' : ''} transition-transform`}>
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || 'Profile'}
                        className="w-6 h-6 rounded-full object-cover border-2 border-current"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-current">
                        {profile.full_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={isActive ? 'scale-110' : ''}>{item.icon}</div>
                )}
                <span className="text-xs font-bold">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        redirectPath={pendingHref}
      />
    </>
  )
}
