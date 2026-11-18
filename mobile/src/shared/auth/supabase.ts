import { AppState, Platform } from "react-native";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { appEnvironment, isAppConfigured } from "../config/env";
import { secureSessionStorage } from "./secureSessionStorage";

export const supabase: SupabaseClient | null = isAppConfigured
  ? createClient(
      appEnvironment.supabaseUrl!,
      appEnvironment.supabasePublishableKey!,
      {
        auth: {
          storage: secureSessionStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      },
    )
  : null;

if (supabase && Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
