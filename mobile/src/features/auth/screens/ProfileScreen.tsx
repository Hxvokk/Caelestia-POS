import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../shared/auth/supabase";
import { colors, spacing } from "../../../shared/config/theme";
import { BrandHeader } from "../../inventory/components/HomeDashboardUI";
import { useSessionStore } from "../store/sessionStore";

export function ProfileScreen({ showBack = true }: { showBack?: boolean } = {}) {
  const currentUser = useSessionStore((state) => state.currentUser);
  const email = useSessionStore((state) => state.session?.user.email);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const roleLabel =
    currentUser?.role === "administrador"
      ? "Administrador"
      : currentUser?.role === "vendedor"
        ? "Vendedor"
        : "Usuario autenticado";

  const signOut = async () => {
    if (!supabase) {
      setError("Falta configurar la conexión con Supabase.");
      return;
    }

    setIsSigningOut(true);
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      if (signOutError) {
        setError("No se pudo cerrar la sesión. Inténtalo de nuevo.");
        setIsSigningOut(false);
      }
    } catch {
      setError("No se pudo cerrar la sesión. Inténtalo de nuevo.");
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <BrandHeader
        action={null}
        onBack={showBack ? () => router.back() : undefined}
        title="Perfil"
      />
      <View style={styles.body}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatar}>
            <Ionicons name="person" size={56} color={colors.primary} />
          </View>
          <Text style={styles.title}>Mi cuenta</Text>
          <Text style={styles.subtitle}>Gestiona la información de tu cuenta en Caelestia POS.</Text>

          <Text style={styles.sectionTitle}>Datos de la cuenta</Text>
          <View style={styles.infoCard}>
            {email ? (
              <>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={26} color={colors.primary} />
                  <View style={styles.infoCopy}>
                    <Text style={styles.infoLabel}>Correo electrónico</Text>
                    <Text style={styles.infoValue}>{email}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
              </>
            ) : null}
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark-outline" size={26} color={colors.primary} />
              <View style={styles.infoCopy}>
                <Text style={styles.infoLabel}>Rol</Text>
                <Text style={styles.infoValue}>{roleLabel}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Seguridad</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/change-password")}
            style={({ pressed }) => [styles.securityRow, pressed && styles.pressed]}
          >
            <Ionicons name="lock-closed-outline" size={26} color={colors.primary} />
            <Text style={styles.securityText}>Cambiar contraseña</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        </ScrollView>

        <View style={styles.footer}>
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={isSigningOut}
            onPress={() => void signOut()}
            style={({ pressed }) => [
              styles.signOutButton,
              isSigningOut && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.danger} />
            <Text style={styles.signOutText}>
              {isSigningOut ? "Cerrando sesión…" : "Cerrar sesión"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy },
  body: {
    flex: 1,
    overflow: "hidden",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.surface,
  },
  content: { gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm },
  avatar: {
    alignSelf: "center",
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 48,
    backgroundColor: colors.blueBackground,
  },
  title: { color: colors.text, fontSize: 26, fontWeight: "800", textAlign: "center" },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center" },
  sectionTitle: { marginTop: spacing.sm, color: colors.text, fontSize: 18, fontWeight: "800" },
  infoCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.blueBackground,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  infoCopy: { flex: 1, gap: 2 },
  infoLabel: { color: colors.muted, fontSize: 13 },
  infoValue: { color: colors.text, fontSize: 16, fontWeight: "800" },
  divider: { height: 1, backgroundColor: colors.border },
  securityRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.indigoBackground,
  },
  securityText: { flex: 1, color: colors.text, fontSize: 16, fontWeight: "800" },
  footer: {
    gap: spacing.xs,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  error: { color: colors.danger, fontSize: 13 },
  signOutButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    backgroundColor: colors.dangerBackground,
  },
  signOutText: { color: colors.danger, fontSize: 16, fontWeight: "800" },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.75 },
});
