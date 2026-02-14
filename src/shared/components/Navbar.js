'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/shared/context/AuthContext'
import { CATEGORIES } from '@/services/utils/constants'

export default function Navbar({ selectedCategory, setSelectedCategory }) {
  const { user, profile, logout, isAuthenticated } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    setShowUserMenu(false)
  }

  const categoryList = CATEGORIES.filter((cat) => cat.id !== 'all')

  return (
    <>
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-3xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo - Left */}
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 group flex-shrink-0 hover:opacity-80 transition"
            >
              <Image
                src="/logo.png"
                alt="ShelterLab"
                width={40}
                height={40}
                priority
                className="group-hover:brightness-110 transition"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-black text-white group-hover:text-blue-400 transition">
                  ShelterLab
                </h1>
                <p className="text-xs text-gray-400">Student Marketplace</p>
              </div>
            </button>

            {/* Desktop Categories - Center */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                All
              </button>
              {categoryList.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </nav>

            {/* Right Side - User & Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Sell Button - Removed */}

              {/* User Avatar - Desktop */}
              {isAuthenticated && (
                <div className="hidden sm:block relative" ref={menuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition"
                    title="Open profile menu"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile?.full_name || 'User'}
                        className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-blue-500">
                        {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-72 bg-white/10 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-xl top-12 z-50 overflow-hidden">
                      {/* Profile Card */}
                      <div className="px-6 py-6 border-b border-white/10">
                        <div className="flex items-center gap-4">
                          {profile?.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt={profile?.full_name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-black border-2 border-blue-500">
                              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-black text-white">{profile?.full_name || 'User'}</p>
                            <p className="text-xs text-gray-400">{user?.email}</p>
                            <p className="text-xs text-blue-400 font-bold mt-1">Trust Score: {profile?.trust_score || 0}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-3">
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-6 py-3 text-sm text-white hover:bg-white/10 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span className="text-base">P</span>
                          <span>My Profile</span>
                        </Link>
                        <Link
                          href="/my-listings"
                          className="flex items-center gap-3 px-6 py-3 text-sm text-white hover:bg-white/10 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span className="text-base">L</span>
                          <span>My Listings</span>
                        </Link>
                        <Link
                          href="/sell"
                          className="flex items-center gap-3 px-6 py-3 text-sm text-white hover:bg-white/10 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span className="text-base">S</span>
                          <span>Sell Item</span>
                        </Link>
                        <Link
                          href="/favorites"
                          className="flex items-center gap-3 px-6 py-3 text-sm text-white hover:bg-white/10 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span className="text-base">F</span>
                          <span>Favorites</span>
                        </Link>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-white/10"></div>

                      {/* Settings Section */}
                      <div className="py-3">
                        <button
                          className="w-full flex items-center gap-3 px-6 py-3 text-sm text-white hover:bg-white/10 transition text-left"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span className="text-base">C</span>
                          <span>Settings</span>
                        </button>
                        <button
                          onClick={() => {
                            handleLogout()
                            setShowUserMenu(false)
                          }}
                          className="w-full flex items-center gap-3 px-6 py-3 text-sm text-red-400 hover:bg-red-500/20 transition text-left"
                        >
                          <span className="text-base">L</span>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Auth Links */}
              {!isAuthenticated && (
                <div className="hidden sm:flex gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-white text-sm font-bold hover:bg-white/10 rounded-lg transition"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="sm:hidden p-2 rounded-lg hover:bg-white/10 transition text-white"
              >
                {showMobileMenu ? 'Close' : 'Menu'}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="sm:hidden border-t border-white/20 py-4 space-y-3">
              {/* Categories */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase px-4 mb-2">Categories</p>
                <div className="flex flex-wrap gap-2 px-4 mb-3">
                  <button
                    onClick={() => {
                      setSelectedCategory('all')
                      setShowMobileMenu(false)
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedCategory === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/5 text-gray-300'
                    }`}
                  >
                    All
                  </button>
                  {categoryList.slice(0, 5).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id)
                        setShowMobileMenu(false)
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        selectedCategory === cat.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 text-gray-300'
                      }`}
                    >
                      {cat.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auth or User Menu */}
              {isAuthenticated ? (
                <div className="px-4 space-y-2 border-t border-white/10 pt-3">
                  <Link
                    href="/sell"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold text-center transition"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Sell Item
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-white hover:bg-white/10 rounded-lg transition"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/my-listings"
                    className="block px-4 py-2 text-white hover:bg-white/10 rounded-lg transition"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    My Listings
                  </Link>
                  <Link
                    href="/favorites"
                    className="block px-4 py-2 text-white hover:bg-white/10 rounded-lg transition"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Favorites
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setShowMobileMenu(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="px-4 space-y-2 border-t border-white/10 pt-3">
                  <Link
                    href="/login"
                    className="block w-full px-4 py-2 text-white text-center hover:bg-white/10 rounded-lg transition"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold text-center transition"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Spacer to push content below header */}
      <div className="h-16" />
    </>
  )
}