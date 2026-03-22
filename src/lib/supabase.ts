import { createClient } from '@supabase/supabase-js';

// These variables pull from the .env.local file we created in Task 1
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * GGN AI Gem Note:
 * We use the '!' after the variables to tell TypeScript: 
 * "I promise these keys exist." 
 * If you didn't add your keys to .env.local, this will throw an error, 
 * which is exactly what we want for security.
 */