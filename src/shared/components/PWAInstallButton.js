'use client'

import { useState, useEffect } from 'react'

export default function PWAInstallButton() {
  const [showButton, setShowButton] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [isDev, setIsDev] = useState(false)

  useEffect(() => {
    // Ensure we only render after hydration is complete
    setMounted(true)
    
    // Check if we're in dev mode (localhost or 127.0.0.1)
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1')
    setIsDev(isLocalhost)

    // Listen directly for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('[PWAInstallButton] beforeinstallprompt event fired!')
      e.preventDefault()
      setDeferredPrompt(e)
      setShowButton(true)
      console.log('beforeinstallprompt captured, showing install button')
    }

    // Hide button when app is installed
    const handleAppInstalled = () => {
      console.log('App installed, hiding button')
      setShowButton(false)
      setDeferredPrompt(null)
    }

    console.log('[PWAInstallButton] Adding event listeners')
    console.log('[PWAInstallButton] Current hostname:', window.location.hostname)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Always show button on mobile (use event will set it when prompt is available)
    if (!isLocalhost) {
      console.log('[PWAInstallButton] Mobile/production detected - showing button')
      setShowButton(true)
    } else {
      console.log('[PWAInstallButton] Dev mode detected - showing button for testing')
      setShowButton(true)
    }

    // Check if browser supports PWA
    console.log('[PWAInstallButton] Browser PWA support:', {
      serviceWorker: 'serviceWorker' in navigator,
      manifest: document.querySelector('link[rel="manifest"]') ? 'yes' : 'no'
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return null
  }

  // Show disabled state if button not ready yet (and not in dev mode)
  if (!showButton) {
    return (
      <button
        disabled
        type="button"
        className="relative p-3 rounded-lg bg-gray-700/50 text-gray-500 cursor-not-allowed"
        title="Not available on this browser or device"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-50"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-gray-400 text-xs rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          Not available
        </div>
      </button>
    )
  }

  const handleInstall = async () => {
    console.log('Install button clicked')
    console.log('deferredPrompt:', deferredPrompt)
    console.log('User agent:', navigator.userAgent)
    
    // Check if it's iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)
    
    // If we have a native prompt (Android Chrome, Edge, etc.)
    if (deferredPrompt) {
      setInstalling(true)
      try {
        console.log('Showing native install prompt...')
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        console.log('User choice outcome:', outcome)
        if (outcome === 'accepted') {
          console.log('PWA installed successfully')
          alert('✅ App installed successfully!')
        } else {
          console.log('User cancelled installation')
        }

        setDeferredPrompt(null)
        setShowButton(false)
      } catch (error) {
        console.error('Install failed:', error)
        alert('Installation failed: ' + error.message)
      } finally {
        setInstalling(false)
      }
      return
    }
    
    // For iOS - show manual installation instructions
    if (isIOS) {
      alert(
        '📱 Install ShelterLab on iOS:\n\n' +
        '1. Tap the Share button (bottom menu)\n' +
        '2. Scroll down and tap "Add to Home Screen"\n' +
        '3. Tap "Add" to install\n\n' +
        'The app will appear on your home screen!'
      )
      return
    }
    
    // For Android without native prompt
    if (isAndroid) {
      alert(
        '📱 Install ShelterLab on Android:\n\n' +
        'Try these options:\n\n' +
        '1. Look for "Install" banner at bottom of screen\n' +
        '2. Or tap menu ⋮ → "Install app"\n' +
        '3. Or use "Add to Home Screen" option\n\n' +
        'If you don\'t see these options, your browser may not support PWA installation.'
      )
      return
    }
    
    // Generic fallback
    alert(
      '💡 Install ShelterLab:\n\n' +
      'Your browser doesn\'t support app installation.\n\n' +
      'Try:\n' +
      '• Chrome or Edge on Android\n' +
      '• Safari on iOS 16.4+\n' +
      '• Samsung Internet on Android'
    )
  }

  return (
    <button
      onClick={handleInstall}
      onTouchStart={(e) => console.log('Touch started on button')}
      disabled={installing}
      type="button"
      className="relative p-3 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:from-blue-700 active:to-blue-600 text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:shadow-lg hover:shadow-blue-500/30 group touch-manipulation"
      title={isDev && !deferredPrompt ? "Demo mode - Install will work on mobile" : "Install ShelterLab as an app"}
      style={{ pointerEvents: 'auto', WebkitTouchCallout: 'none' }}
    >
      {/* App Grid Icon */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={installing ? 'animate-spin' : ''}
        style={{ pointerEvents: 'none' }}
      >
        {installing ? (
          <>
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <circle cx="9" cy="9" r="1" fill="currentColor" />
            <circle cx="15" cy="9" r="1" fill="currentColor" />
          </>
        ) : (
          <>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </>
        )}
      </svg>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block">
        {isDev && !deferredPrompt ? 'Demo Mode' : installing ? 'Installing...' : 'Install App'}
      </div>
    </button>
  )
}
