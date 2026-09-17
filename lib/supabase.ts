export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return { url, anonKey };
}

export function createSupabaseRestHeaders(accessToken?: string) {
  const { anonKey } = getSupabaseConfig();

  return {
    apikey: anonKey,
    authorization: `Bearer ${accessToken ?? anonKey}`,
    "content-type": "application/json",
  };
}
