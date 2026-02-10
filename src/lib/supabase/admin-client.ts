import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Only create if we have valid-looking credentials
    if (url && key && url.includes('supabase')) {
      try {
        supabaseAdmin = createClient(url, key);
      } catch {
        console.warn('Failed to create Supabase admin client');
        return null;
      }
    }
  }
  return supabaseAdmin;
}

// For backwards compatibility - returns a mock that returns empty results
export function getSupabaseAdminOrMock(): SupabaseClient {
  const client = getSupabaseAdmin();
  if (client) return client;
  
  // Return a mock that does nothing
  return {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null, count: 0 }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      upsert: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    }),
  } as unknown as SupabaseClient;
}
