import { createClient } from '@supabase/supabase-js';

let supabase = null;

export function getSupabase() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      console.error('Missing Supabase environment variables:');
      console.error('NEXT_PUBLIC_SUPABASE_URL:', url ? '✓' : '✗');
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', anonKey ? '✓' : '✗');
      return null;
    }

    supabase = createClient(url, anonKey);
  }

  return supabase;
}

// For backwards compatibility
export const supabase = null;


