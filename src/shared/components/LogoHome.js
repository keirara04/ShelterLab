'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function LogoHome({ size = 28, className = '' }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}
      aria-label="Back to Home"
    >
      <Image
        src="/logo.svg"
        alt="ShelterLab"
        width={size}
        height={size}
        className="object-contain"
      />
      <span className="text-sm font-black text-white">ShelterLab</span>
    </Link>
  )
}
