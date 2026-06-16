import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
export const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

// supabase-js client — used only for reads (SELECT)
// Writes use raw fetch to avoid browser ISO-8859-1 header restriction with sb_publishable_ keys
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const isCloudEnabled = Boolean(supabaseUrl && supabaseKey);
