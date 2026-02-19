'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/shared/context/AuthContext'

export default function MobileNav() {
  const { profile, logout, isAuthenticated } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="md:hidden">
      {/* Trigger Button - Positioned exactly where your profile pic is in the screenshot */}
      <button
        onClick={() => setShowMenu(true)}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full overflow-hidden border border-white/20"
      >
        {isAuthenticated && profile?.avatar_url ? (
          <Image src={profile.avatar_url} alt="Profile" width={40} height={40} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {isAuthenticated ? profile?.full_name?.charAt(0) : '☰'}
          </div>
        )}
      </button>

      {/* Full Screen Overlay Menu */}
      {showMenu && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-2xl flex flex-col p-8">
          <button 
            onClick={() => setShowMenu(false)}
            className="self-end text-white text-2xl p-2"
          >
            ✕
          </button>

          <nav className="flex flex-col gap-6 mt-12 text-center">
            <Link href="/" onClick={() => setShowMenu(false)} className="text-2xl font-black text-white">Home</Link>
            {isAuthenticated ? (
              <>
                <Link href="/profile" onClick={() => setShowMenu(false)} className="text-2xl font-black text-white">Profile</Link>
                <Link href="/sell" onClick={() => setShowMenu(false)} className="text-2xl font-black text-blue-400">Sell Item</Link>
                <button 
                  onClick={() => { logout(); setShowMenu(false); }}
                  className="text-2xl font-black text-red-400"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setShowMenu(false)} className="text-2xl font-black text-blue-400">Login</Link>
            )}
          </nav>
        </div>
      )}
    </div>
  )
}