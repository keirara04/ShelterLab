"use client"
import Link from 'next/link'

export default function FloatingSellButton() {
  return (
    <Link 
      href="/sell" 
      className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-[70] bg-blue-600 hover:bg-blue-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
    >
      <span className="text-3xl font-light">+</span>
    </Link>
  )
}