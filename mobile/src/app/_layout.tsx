import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { supabase } from "../shared/auth/supabase";
import { isAppConfigured, appEnvironment } from "../shared/config/env";
import { colors, spacing } from "../shared/config/theme";
import { useSessionStore } from "../features/auth/store/sessionStore";

export default function RootLayout() {
  const initialized = useSessionStore((state) => state.initialized);
  const session = useSessionStore((state) => state.session);
  const setSession = useSessionStore((state) => state.setSession);

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  if (!isAppConfigured) {
    return (
      <View style={styles.messageScreen}>
        <Text style={styles.eyebrow}>CAELESTIA POS</Text>
        <Text style={styles.title}>Falta configurar la app</Text>
        <Text style={styles.description}>
          Completa estas variables en `CaelestiaPOS.Mobile/.env.local` y reinicia Expo:
        </Text>
        {appEnvironment.missing.map((name) => (
          <Text key={name} style={styles.variable}>{name}</Text>
        ))}
        <Text style={styles.description}>
          Usa solo la Publishable/anon key de Supabase; nunca una clave secreta.
        </Text>
      </View>
    );
  }

  if (!initialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Restaurando sesión segura…</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={Boolean(session)}>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  messageScreen: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
  },
  description: {
    marginTop: spacing.md,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  variable: {
    marginTop: spacing.sm,
    color: colors.text,
    fontFamily: "monospace",
    fontSize: 14,
    fontWeight: "700",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.muted,
    fontSize: 14,
  },
});
