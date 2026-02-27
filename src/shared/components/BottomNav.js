'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/shared/context/AuthContext'
import AuthModal from '@/shared/components/AuthModal'
import { supabase } from '@/services/supabase'

export default function BottomNav() {
  const pathname = usePathname()
  const { isAuthenticated, profile } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingHref, setPendingHref] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!isAuthenticated || !profile?.id) return
    supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('buyer_id', profile.id)
      .eq('status', 'pending')
      .then(({ count }) => setPendingCount(count || 0))
  }, [isAuthenticated, profile?.id, pathname])

  const navItems = [
    {
      name: 'Sell',
      href: '/sell',
      icon: (
        <svg width="24" height="24" viewBox="0 0 1024 1024" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M704 288h131.072a32 32 0 0 1 31.808 28.8L886.4 512h-64.384l-16-160H704v96a32 32 0 1 1-64 0v-96H384v96a32 32 0 0 1-64 0v-96H217.92l-51.2 512H512v64H131.328a32 32 0 0 1-31.808-35.2l57.6-576a32 32 0 0 1 31.808-28.8H320v-22.336C320 154.688 405.504 64 512 64s192 90.688 192 201.664v22.4zm-64 0v-22.336C640 189.248 582.272 128 512 128c-70.272 0-128 61.248-128 137.664v22.4h256zm201.408 483.84L768 698.496V928a32 32 0 1 1-64 0V698.496l-73.344 73.344a32 32 0 1 1-45.248-45.248l128-128a32 32 0 0 1 45.248 0l128 128a32 32 0 1 1-45.248 45.248z" />
        </svg>
      ),
      requiresAuth: true,
    },
    {
      name: 'LabGigs',
      href: '/labgigs',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Lightbulb with wrench — service + idea */}
          <path d="M9 21h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 3a6 6 0 0 1 6 6c0 2.5-1.5 4.5-3 5.5V17H9v-2.5C7.5 13.5 6 11.5 6 9a6 6 0 0 1 6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      requiresAuth: false,
    },
    {
      name: 'Home',
      href: '/',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_4039_12377)">
            <path d="M18.8751 11.9916L10.0001 18.4416L1.12512 11.9916C1.00614 11.9041 0.917886 11.7812 0.872982 11.6405C0.828079 11.4998 0.828827 11.3485 0.87512 11.2083L1.89179 8.0583L3.92512 1.79997C3.94484 1.74897 3.97624 1.70331 4.01679 1.66663C4.08282 1.60632 4.16902 1.57288 4.25845 1.57288C4.34789 1.57288 4.43409 1.60632 4.50012 1.66663C4.54294 1.70802 4.57449 1.75965 4.59179 1.81663L6.62512 8.0583H13.3751L15.4085 1.79997C15.4282 1.74897 15.4596 1.70331 15.5001 1.66663C15.5662 1.60632 15.6524 1.57288 15.7418 1.57288C15.8312 1.57288 15.9174 1.60632 15.9835 1.66663C16.0263 1.70802 16.0578 1.75965 16.0751 1.81663L18.1085 8.07497L19.1668 11.2083C19.2089 11.3529 19.2032 11.5072 19.1507 11.6483C19.0982 11.7894 19.0015 11.9098 18.8751 11.9916Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <defs>
            <clipPath id="clip0_4039_12377">
              <rect width="20" height="20" fill="white" />
            </clipPath>
          </defs>
        </svg>
      ),
      requiresAuth: false,
    },
    {
      name: 'PasarMalam',
      href: '/pasarmalam',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
          {/* Steam */}
          <path d="M8 7 Q7 5.5 8 4" />
          <path d="M12 7 Q11 5.5 12 4" />
          {/* Awning with scalloped bottom */}
          <path d="M2 7 L22 7 L22 11 Q19.5 13 17 11 Q14.5 13 12 11 Q9.5 13 7 11 Q4.5 13 2 11 Z" />
          {/* Cart body */}
          <rect x="3" y="11" width="18" height="8" rx="1" />
          {/* Wheel */}
          <circle cx="17" cy="21" r="1.5" />
          {/* Handle */}
          <path d="M4 14 L1 9" />
        </svg>
      ),
      requiresAuth: false,
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
          background: 'rgba(18, 24, 39, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center justify-around h-16 px-1 max-w-screen-sm mx-auto">
          {navItems.map((item) => {
            const isLocked = item.requiresAuth && !isAuthenticated
            const isActive = pathname === item.href

            if (isLocked) {
              return (
                <button
                  key={item.name}
                  onClick={() => handleLockedTap(item.href)}
                  className="flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg touch-manipulation min-h-[60px] min-w-[52px] text-gray-400"
                >
                  <div className="relative">
                    {item.icon}
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
                      <svg className="w-2 h-2 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold">{item.name}</span>
                </button>
              )
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-all duration-200 touch-manipulation min-h-[60px] min-w-[52px] ${
                  isActive ? 'text-blue-400' : 'text-gray-400 hover:text-white active:text-blue-300'
                }`}
                style={{
                  background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                }}
              >
                {item.name === 'Profile' && profile ? (
                  <div className="relative transition-colors">
                    {pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900 z-10" />
                    )}
                    {profile.avatar_url ? (
                      <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center">
                        <img
                          src={profile.avatar_url}
                          alt={profile.full_name || 'Profile'}
                          className="w-full h-full object-cover border-2 border-current"
                        />
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-current">
                        {profile.full_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>{item.icon}</div>
                )}
                <span className="text-[10px] font-bold">{item.name}</span>
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
