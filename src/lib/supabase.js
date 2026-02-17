// src/lib/supabase.js
// CLIENT-SIDE SUPABASE CLIENT
// Use this for client components (with "use client")

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials in .env.local')
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export default supabase