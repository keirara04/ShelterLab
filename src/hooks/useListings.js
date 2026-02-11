// src/hooks/useListings.js
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export const useListings = (filters = {}) => {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 12,
    total: 0,
  })

  const fetchListings = async (page = 0) => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('listings')
        .select('*', { count: 'exact' })
        .eq('is_sold', false)
        .gt('expires_at', new Date().toISOString())

      // Apply filters
      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }

      if (filters.searchTerm) {
        query = query.ilike('title', `%${filters.searchTerm}%`)
      }

      if (filters.condition) {
        query = query.eq('condition', filters.condition)
      }

      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice)
      }

      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice)
      }

      // Pagination
      const from = page * pagination.pageSize
      const to = from + pagination.pageSize - 1

      query = query
        .order('created_at', { ascending: false })
        .range(from, to)

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      setListings(data || [])
      setPagination((prev) => ({
        ...prev,
        page,
        total: count || 0,
      }))
    } catch (err) {
      setError(err.message)
      console.error('Error fetching listings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings(0)
  }, [filters])

  const nextPage = () => {
    const maxPage = Math.ceil(pagination.total / pagination.pageSize) - 1
    if (pagination.page < maxPage) {
      fetchListings(pagination.page + 1)
    }
  }

  const prevPage = () => {
    if (pagination.page > 0) {
      fetchListings(pagination.page - 1)
    }
  }

  const refetch = () => fetchListings(pagination.page)

  return {
    listings,
    loading,
    error,
    pagination,
    fetchListings,
    nextPage,
    prevPage,
    refetch,
    hasNextPage: pagination.page < Math.ceil(pagination.total / pagination.pageSize) - 1,
    hasPrevPage: pagination.page > 0,
  }
}

export default useListings