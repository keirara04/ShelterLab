'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/services/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('confirming')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle PKCE flow (code in query params)
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')

        if (code) {
          const { error, data } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('Exchange error:', error)
            setStatus('error')
            return
          }

          // Verify email was confirmed
          if (data.user?.email_confirmed_at) {
            if (process.env.NODE_ENV === 'development') console.log('Email confirmed successfully')
          }
        } else {
          // If no code, check if there's an active session (hash-based flow)
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) {
            setStatus('error')
            return
          }
        }

        setStatus('success')
        setTimeout(() => router.push('/'), 2000)
      } catch (err) {
        console.error('Callback error:', err)
        setStatus('error')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="bg-white/10 border border-white/20 rounded-3xl p-8 backdrop-blur-xl max-w-md w-full text-center">
        {status === 'confirming' && (
          <>
            <div className="text-5xl mb-4">⏳</div>
            <h1 className="text-2xl font-black text-white mb-2">Confirming your email...</h1>
            <p className="text-gray-400">Please wait while ShelterLab does its magic.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-black text-white mb-2">Email Confirmed!</h1>
            <p className="text-gray-400 mb-4">Your account is verified. Welcome to ShelterLab! Redirecting you now...</p>
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-2xl font-black text-white mb-2">Confirmation Failed</h1>
            <p className="text-gray-400 mb-6">The link may have expired. Please try signing up again.</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition"
            >
              Go Home
            </button>
          </>
        )}
      </div>
    </div>
  )
}
