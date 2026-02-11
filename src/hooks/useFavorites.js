// src/hooks/useFavorites.js
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export const useFavorites = () => {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch user's favorites
  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([])
      setFavoriteIds(new Set())
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('favorites')
        .select('listing_id, listings(*)')
        .eq('user_id', user.id)

      if (fetchError) throw fetchError

      const listingIds = new Set(data.map((fav) => fav.listing_id))
      setFavoriteIds(listingIds)
      setFavorites(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching favorites:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFavorites()
  }, [user])

  // Add to favorites
  const addFavorite = async (listingId) => {
    if (!user) {
      setError('You must be logged in to save favorites')
      return false
    }

    try {
      setError(null)

      const { error: insertError } = await supabase.from('favorites').insert({
        user_id: user.id,
        listing_id: listingId,
      })

      if (insertError) throw insertError

      setFavoriteIds((prev) => new Set([...prev, listingId]))
      return true
    } catch (err) {
      setError(err.message)
      console.error('Error adding favorite:', err)
      return false
    }
  }

  // Remove from favorites
  const removeFavorite = async (listingId) => {
    if (!user) {
      setError('You must be logged in')
      return false
    }

    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listingId)

      if (deleteError) throw deleteError

      setFavoriteIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(listingId)
        return newSet
      })

      return true
    } catch (err) {
      setError(err.message)
      console.error('Error removing favorite:', err)
      return false
    }
  }

  // Toggle favorite
  const toggleFavorite = async (listingId) => {
    if (favoriteIds.has(listingId)) {
      return removeFavorite(listingId)
    } else {
      return addFavorite(listingId)
    }
  }

  const isFavorited = (listingId) => favoriteIds.has(listingId)

  return {
    favorites,
    favoriteIds,
    loading,
    error,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorited,
    refetch: fetchFavorites,
  }
}

export default useFavorites