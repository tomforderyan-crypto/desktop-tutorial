import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined

/** null until the Supabase project's URL and key are configured at build time. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

export const BUCKET = 'photos'
