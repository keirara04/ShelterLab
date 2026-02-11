'use client'

import BottomNav from './BottomNav'

export default function LayoutWrapper({ children }) {
  return (
    <>
      <div className="pb-16 lg:pb-0">
        {children}
      </div>
      <BottomNav />
    </>
  )
}
