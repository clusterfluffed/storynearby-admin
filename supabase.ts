import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types based on your schema
export type Tenant = {
  id: string
  name: string
  slug: string
  domain?: string
  branding?: any
  active: boolean
  created_at: string
}

export type Profile = {
  id: string
  tenant_id?: string
  role: 'super_admin' | 'county_admin' | 'editor' | 'viewer'
  full_name?: string
  created_at: string
}

export type Location = {
  id: string
  tenant_id?: string
  name: string
  description?: string
  address?: string
  lat: number
  lng: number
  audio_url?: string
  image_urls?: string[]
  featured: boolean
  active: boolean
  created_at: string
}

export type Bookmark = {
  id: string
  user_id: string
  location_id: string
  created_at: string
}

// Auth helpers
export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password })
}

export const signUp = async (email: string, password: string) => {
  return await supabase.auth.signUp({ email, password })
}

export const signOut = async () => {
  return await supabase.auth.signOut()
}

export const getSession = async () => {
  return await supabase.auth.getSession()
}

export const getUser = async () => {
  return await supabase.auth.getUser()
}
