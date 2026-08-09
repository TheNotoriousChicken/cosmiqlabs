import { createClient } from '@supabase/supabase-js';

// Support both Vite (frontend) and Node.js (Vercel Serverless Functions)
const supabaseUrl = (typeof process !== 'undefined' && process.env.VITE_SUPABASE_URL) 
  || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL);

const supabaseAnonKey = (typeof process !== 'undefined' && process.env.VITE_SUPABASE_ANON_KEY) 
  || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
