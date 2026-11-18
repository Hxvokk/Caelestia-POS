const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

export const appEnvironment = {
  supabaseUrl,
  supabasePublishableKey,
  apiUrl,
  missing: [
    !supabaseUrl && "EXPO_PUBLIC_SUPABASE_URL",
    !supabasePublishableKey && "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    !apiUrl && "EXPO_PUBLIC_API_URL",
  ].filter((value): value is string => Boolean(value)),
};

export const isAppConfigured = appEnvironment.missing.length === 0;
