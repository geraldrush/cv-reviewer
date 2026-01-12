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
      if (typeof window !== 'undefined') {
        console.error('Missing Supabase config:');
        console.error('URL:', url ? '✓ set' : '✗ missing');
        console.error('Key:', anonKey ? '✓ set' : '✗ missing');
      }
      return null;
    }

    try {
      supabaseClient = createClient(url, anonKey);
      console.log('✅ Supabase client created successfully');
    } catch (error) {
      console.error('❌ Failed to create Supabase client:', error);
      return null;
    }
  }

  return supabaseClient;
}




