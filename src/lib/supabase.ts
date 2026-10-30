import { createClient, SupabaseClient } from '@supabase/supabase-js';

const PLACEHOLDER_PREFIX = 'PASTE_YOUR_';

const getCleanEnv = (name: string): string => {
  const val = (process.env[name] || '').trim();
  // Strip surrounding quotes if present
  return val.replace(/^["']|["']$/g, '').trim();
};

export const getSupabaseCredentials = () => {
  const url = getCleanEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key =
    getCleanEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    getCleanEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');

  const isConfigured = Boolean(
    url &&
    key &&
    !url.includes(PLACEHOLDER_PREFIX) &&
    !key.includes(PLACEHOLDER_PREFIX)
  );

  return { url, key, isConfigured };
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseCredentials().isConfigured;
};

let clientInstance: SupabaseClient | null = null;

/**
 * Returns the single shared Supabase client instance.
 * Throws a clear readable error if credentials are missing or still placeholder values.
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
 * Evaluates lazily on first access so static imports won't break if env vars are unset at build time,
 * and throws the required readable error if credentials are placeholder or missing.
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
