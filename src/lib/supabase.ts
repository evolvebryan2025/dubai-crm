import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

// Note: Not using Database generic here because @supabase/supabase-js@2.98.0
// requires auto-generated types (via `supabase gen types typescript`).
// Our manual Database type definitions in types/database.ts are used by
// typeAdapters.ts for UI-level type safety instead.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
