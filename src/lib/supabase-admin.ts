import { createClient } from '@supabase/supabase-js';

// Server-only Supabase client with admin privileges (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  '';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NODE_ENV === 'production') {
  console.warn(
    '⚠️ [SECURITY WARNING]: SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables. ' +
    'Falling back to ANON key. Privileged server operations and webhooks may fail if RLS is enforced.'
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

