'use client'

import { useAuth } from '@/shared/context/AuthContext'

const UNIVERSITY_LOGOS = {
  'Korea University': '/KoreaUniversityLogo.png',
  'Hanyang University': '/HanyangUniversityLogo.png',
  'Seoultech': '/Seoultech.png',
}

export default function LoadingScreen() {
  const { profile } = useAuth()
  const logoSrc = UNIVERSITY_LOGOS[profile?.university] || '/logo.png'

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-950 z-50">
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex items-center justify-center">
          {/* Glow ring */}
          <div
            className="absolute w-24 h-24 rounded-full animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(45,212,191,0.25) 0%, transparent 70%)',
            }}
          />
          {/* Spinning logo */}
          <img
            src={logoSrc}
            alt="Loading"
            className="w-16 h-16 object-contain animate-spin"
            style={{ animationDuration: '1.4s', animationTimingFunction: 'linear' }}
          />
        </div>
      </div>
    </div>
  )
}
