import { createClient } from '@supabase/supabase-js';

// Backend client - uses SERVICE_KEY (keep secret, backend only)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
