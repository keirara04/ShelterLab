'use client'

import { useEffect, useState } from 'react'

export default function ServiceWorkerRegistrar() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.warn)
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Hide button when app is installed
    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setShowInstallButton(false)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('PWA installed successfully')
    }

    setDeferredPrompt(null)
    setShowInstallButton(false)
  }

  // Export state for use in other components
  useEffect(() => {
    window.__pwaInstallReady = {
      show: showInstallButton,
      prompt: deferredPrompt,
      install: handleInstallClick,
    }
    console.log('PWA Install Ready state updated:', { show: showInstallButton, hasPrompt: !!deferredPrompt })
  }, [showInstallButton, deferredPrompt])

  return null
}
