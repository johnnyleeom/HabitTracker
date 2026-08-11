import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAPI = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export default function createUserSupabaseClient(accessToken: string) {
  return createClient(supabaseUrl, supabaseAPI, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

createUserSupabaseClient("hi");
