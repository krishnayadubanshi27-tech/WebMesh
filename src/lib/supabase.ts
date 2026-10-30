import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fallback credentials provided by the user for dbtdczvlwhpjjqxilsdf
const DEFAULT_SUPABASE_URL = 'https://dbtdczvlwhpjjqxilsdf.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRidGRjenZsd2hwampxeGlsc2RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NDA3OTMsImV4cCI6MjEwODQxNjc5M30.JqLDxHKErU32XyPxevJLIiuPuyqu5gn9OrMSOC7GfK0';

const clean = (val: string | undefined): string => {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
};

/**
 * Reads Supabase URL and Anon Key.
 * Uses explicit dot property access (process.env.NEXT_PUBLIC_*) so that
 * Next.js / Turbopack inlines the environment variables into the client bundle at build/dev time.
 */
export const getSupabaseCredentials = () => {
  // MUST use literal process.env.NEXT_PUBLIC_* for Next.js client-side inlining
  const rawUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const rawKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // If set to placeholder or empty, fall back to the active project credentials
  const url =
    rawUrl && !rawUrl.includes('PASTE_YOUR_') ? rawUrl : DEFAULT_SUPABASE_URL;
  const key =
    rawKey && !rawKey.includes('PASTE_YOUR_') ? rawKey : DEFAULT_SUPABASE_ANON_KEY;

  const isConfigured = Boolean(
    url &&
    key &&
    !url.includes('PASTE_YOUR_') &&
    !key.includes('PASTE_YOUR_')
  );

  return { url, key, isConfigured };
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseCredentials().isConfigured;
};

let clientInstance: SupabaseClient | null = null;

/**
 * Returns the single shared Supabase client instance.
 */
export const getSupabase = (): SupabaseClient => {
  const { url, key, isConfigured } = getSupabaseCredentials();

  if (!isConfigured) {
    throw new Error('Add your Supabase URL and anon key to .env.local and restart the dev server');
  }

  if (!clientInstance) {
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return clientInstance;
};

/**
 * Single shared Supabase client proxy.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof val === 'function') {
      return (val as (...args: unknown[]) => unknown).bind(client);
    }
    return val;
  },
});
