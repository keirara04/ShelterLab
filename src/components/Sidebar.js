'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { CATEGORIES } from '@/lib/constants'

export default function Sidebar({ selectedCategory, setSelectedCategory }) {
  const { user, profile, logout, isAuthenticated } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = async () => {
    await logout()
    setShowUserMenu(false)
  }

  const categoryList = CATEGORIES.filter((cat) => cat.id !== 'all')

  const menuItems = [
    { id: 'home', label: 'Home', icon: '🏠', href: '/' },
    { id: 'profile', label: 'Profile', icon: '👤', href: '/profile' },
    { id: 'listings', label: 'My Listings', icon: '📦', href: '/my-listings' },
    { id: 'favorites', label: 'Favorites', icon: '❤️', href: '/favorites' },
    { id: 'sell', label: 'Sell Item', icon: '➕', href: '/sell', highlight: true },
  ]

  return (
    // Sidebar only on desktop
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        setIsExpanded(false)
        setShowUserMenu(false)
      }}
      className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen bg-gradient-to-b from-white/10 via-white/5 to-white/10 backdrop-blur-3xl border-r border-white/20 z-40 transition-all duration-300"
      style={{ width: isExpanded ? '280px' : '90px' }}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-center p-6 border-b border-white/10">
        <div className="text-3xl flex-shrink-0">🏠</div>
        {isExpanded && (
          <div className="ml-3 overflow-hidden">
            <p className="text-xs text-gray-400 font-bold">KODAE</p>
            <p className="text-lg font-black text-white">Shelter</p>
          </div>
        )}
      </div>

      {/* User Section */}
      {isAuthenticated && profile && isExpanded && (
        <div className="p-6 border-b border-white/10">
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              {profile.avatar_url ? (
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {profile.full_name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {profile.full_name}
                </p>
                <p className="text-xs text-gray-400">
                  Trust: {profile.trust_score || 0}
                </p>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-xs font-bold text-gray-300">Listings</p>
                  <p className="text-xs font-black text-blue-400">{profile.total_listings || 0}</p>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                    style={{ width: `${Math.min((profile.total_listings || 0) * 10, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-xs font-bold text-gray-300">Trust</p>
                  <p className="text-xs font-black text-green-400">{profile.trust_score || 0}</p>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400"
                    style={{ width: `${Math.min(profile.trust_score || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Links */}
      {!isAuthenticated && isExpanded && (
        <div className="p-6 border-b border-white/10 space-y-2">
          <Link
            href="/login"
            className="block px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-center transition text-sm"
          >
            🔓 Login
          </Link>
          <Link
            href="/signup"
            className="block px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-center transition text-sm"
          >
            ✨ Sign Up
          </Link>
        </div>
      )}

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              item.highlight
                ? isExpanded
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30'
                  : 'text-white hover:brightness-110'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className={`text-lg flex-shrink-0 transition-all ${item.highlight && !isExpanded ? 'brightness-125' : ''}`}>
              {item.icon}
            </span>
            {isExpanded && (
              <span className="font-bold text-sm">{item.label}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Categories Section */}
      {isExpanded && (
        <div className="p-4 border-t border-white/10">
          <p className="text-xs font-bold text-gray-500 uppercase mb-3 px-4">Categories</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {/* All Categories */}
            <button
              onClick={() => setSelectedCategory('all')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                selectedCategory === 'all'
                  ? 'bg-white/20 text-white font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>🏠</span>
              <span>All</span>
            </button>

            {/* Filter Divider */}
            <div className="h-px bg-white/10 my-2"></div>

            {/* Filter by Type */}
            {categoryList.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                  selectedCategory === cat.id
                    ? 'bg-white/20 text-white font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Logout Button */}
      {isAuthenticated && isExpanded && (
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold transition text-sm"
          >
            🚪 Logout
          </button>
        </div>
      )}

      {/* Collapsed State - Icon Column */}
      {!isExpanded && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-4">
          {menuItems.slice(0, 4).map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`text-2xl transition-all hover:brightness-110 ${
                item.highlight ? 'opacity-100' : 'opacity-60 hover:opacity-100'
              }`}
              title={item.label}
            >
              {item.icon}
            </Link>
          ))}
        </div>
      )}
    </aside>
  )
}