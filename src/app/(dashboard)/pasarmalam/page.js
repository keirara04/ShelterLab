'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/shared/context/AuthContext'
import AuthModal from '@/shared/components/AuthModal'
import LogoHome from '@/shared/components/LogoHome'

export default function PasarMalamPage() {
  const { isAuthenticated } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <div className="min-h-screen pt-20 pb-24 relative" style={{ backgroundColor: '#000000' }}>

      {/* Blurred background content (placeholder skeleton) */}
      <div className="max-w-4xl mx-auto px-4 select-none pointer-events-none" aria-hidden="true">
        <div className="mb-6">
          <div className="h-8 w-48 rounded-xl bg-white/5 mb-2" />
          <div className="h-4 w-72 rounded-lg bg-white/5" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="h-36 bg-white/5" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-3/4 rounded bg-white/5" />
                <div className="h-3 w-1/2 rounded bg-white/5" />
                <div className="h-5 w-1/3 rounded-lg bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WIP overlay */}
      <div
        className="fixed inset-0 z-40 flex flex-col items-center justify-center text-center px-6"
        style={{ backdropFilter: 'blur(16px)', background: 'rgba(0,0,0,0.65)' }}
      >
        <div className="absolute top-6 left-5">
          <LogoHome />
        </div>

        {/* ShelterLab tagline */}
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400 mb-8">
          ShelterLab · Upcoming Feature
        </p>

        {/* Lantern icon */}
        <div
          className="mb-6 rounded-full p-5"
          style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 2h6" />
            <path d="M12 2v3" />
            <path d="M6 7a6 6 0 0 0 6 10 6 6 0 0 0 6-10H6z" />
            <path d="M9 17v2a3 3 0 0 0 6 0v-2" />
          </svg>
        </div>

        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase tracking-widest"
          style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          Work in Progress
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Pasar Malam
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-sm leading-relaxed">
          A dedicated space for flash deals, bundles, and limited-time offers from students around campus.
        </p>

        {isAuthenticated ? (
          <p className="text-gray-400 text-xs mt-6">Coming soon — check back later!</p>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-gray-400 text-xs">Sign in to get notified when this launches.</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-5 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 font-bold text-sm hover:bg-yellow-400/20 transition-all duration-200"
            >
              Sign in
            </button>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  )
}
