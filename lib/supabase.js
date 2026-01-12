import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;

export function getSupabase() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      console.error('Missing Supabase environment variables:');
      console.error('NEXT_PUBLIC_SUPABASE_URL:', url ? '✓' : '✗');
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', anonKey ? '✓' : '✗');
      return null;
    }

    supabaseClient = createClient(url, anonKey);
  }

  return supabaseClient;
}



