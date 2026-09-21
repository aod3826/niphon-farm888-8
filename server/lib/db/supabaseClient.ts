import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log('✅ Supabase Client initialized successfully for cloud persistence.');
    } catch (err) {
      console.warn('⚠️ Failed to initialize Supabase client, falling back to local relational store:', err);
      return null;
    }
  }

  return supabaseInstance;
}

export function isSupabaseEnabled(): boolean {
  return getSupabaseClient() !== null;
}
