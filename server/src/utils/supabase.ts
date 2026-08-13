import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAPI = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

console.log("Environment check:", {
  hasSupabaseUrl: Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL),
  hasPublishableKey: Boolean(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  hasSecretKey: Boolean(process.env.SUPABASE_SECRET_KEY),
});

export default function createUserSupabaseClient(accessToken: string) {
  return createClient(supabaseUrl, supabaseAPI, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
