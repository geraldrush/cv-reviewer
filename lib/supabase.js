import { createClient } from '@supabase/supabase-js';

// Frontend client - uses ANON_KEY (safe to expose)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
