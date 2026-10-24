import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dbtdczvlwhpjjqxilsdf.supabase.co';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRidGRjenZsd2hwampxeGlsc2RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NDA3OTMsImV4cCI6MjEwODQxNjc5M30.JqLDxHKErU32XyPxevJLIiuPuyqu5gn9OrMSOC7GfK0';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Re-export Brand Guidelines and Submissions Supabase helpers
export * from './lib/brandGuidelines';
export * from './lib/submissions';

