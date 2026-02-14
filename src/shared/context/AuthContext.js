// src/context/AuthContext.js
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/services/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true)

        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        setUser(session?.user || null)

        // Fetch user profile if authenticated
        if (session?.user) {
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)

          if (data && data.length > 0) {
            setProfile(data[0])
          } else if (profileError) {
            console.warn('Profile fetch error:', profileError)
          }
        }

        // Listen for auth state changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          setUser(session?.user || null)

          if (session?.user) {
            // Check if user is still approved
            const { data: approvedUser } = await supabase
              .from('approved_users')
              .select('*')
              .eq('email', session.user.email.toLowerCase())
              .eq('status', 'approved')
              .single()

            if (!approvedUser) {
              // User is no longer approved - sign them out
              await supabase.auth.signOut()
              setUser(null)
              setProfile(null)
              return
            }

            const { data, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)

            if (data && data.length > 0) {
              setProfile(data[0])
            } else if (profileError) {
              console.warn('Profile fetch error:', profileError)
            }
          } else {
            setProfile(null)
          }
        })

        return () => subscription.unsubscribe()
      } catch (err) {
        console.error('Auth error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const signup = async (email, password, fullName, university) => {
    try {
      setError(null)

      // Sign up via Supabase client
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/email-confirmation`,
          data: {
            full_name: fullName,
            university: university,
          }
        },
      })

      if (signUpError) throw signUpError

      // Check if email is already registered (Supabase returns empty identities)
      if (signUpData.user && signUpData.user.identities?.length === 0) {
        throw new Error('This email is already registered. Please sign in instead.')
      }

      if (!signUpData.user) {
        throw new Error('Signup failed. Please try again.')
      }

      // Create profile via server API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: signUpData.user.id,
          email,
          full_name: fullName,
          university,
        }),
      })

      const profileData = await response.json()

      if (!response.ok) {
        throw new Error(profileData.error || 'Failed to create profile')
      }

      // Pending admin approval
      return { success: true, pending: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  const login = async (email, password) => {
    try {
      setError(null)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check if email is approved
      const { data: approvedUser, error: approvalError } = await supabase
        .from('approved_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('status', 'approved')
        .single()

      if (!approvedUser || approvalError?.code === 'PGRST116') {
        // Email not approved - sign them out
        await supabase.auth.signOut()
        throw new Error('Your account has been revoked. Please contact the administrator.')
      }

      // Set user first
      if (data.user) {
        setUser(data.user)

        // Fetch profile - it's okay if it fails for now
        // The onAuthStateChange listener will pick it up
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (profileData && !profileError) {
            setProfile(profileData)
          }
        } catch (profileErr) {
          console.warn('Profile fetch warning:', profileErr)
          // Don't fail login if profile fetch fails
        }
      }

      return { success: true, user: data.user }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  const logout = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setProfile(null)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  const updateProfile = async (updates) => {
    try {
      setError(null)

      if (!user) throw new Error('Not authenticated')

      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Call API route with auth token
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      // Update local profile state
      setProfile(data.profile)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  const value = {
    user,
    profile,
    loading,
    error,
    signup,
    login,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: profile?.is_admin || false,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export default AuthContext