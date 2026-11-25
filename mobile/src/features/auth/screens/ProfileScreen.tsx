import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { supabase } from "../../../shared/auth/supabase";
import { colors, spacing } from "../../../shared/config/theme";
import { useSessionStore } from "../store/sessionStore";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Escribe tu contraseña actual."),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
  confirmPassword: z.string().min(1, "Confirma la nueva contraseña."),
}).refine((values) => values.newPassword === values.confirmPassword, {
  message: "Las contraseñas nuevas no coinciden.",
  path: ["confirmPassword"],
});

export function ProfileScreen({ showBack = true }: { showBack?: boolean } = {}) {
  const currentUser = useSessionStore((state) => state.currentUser);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const changePassword = async () => {
    if (!supabase) {
      setError("Falta configurar la conexión con Supabase.");
      return;
    }

    const result = passwordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      setNotice(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: result.data.newPassword,
        current_password: result.data.currentPassword,
      });
      if (updateError) {
        setError("No se pudo cambiar la contraseña. Revisa la contraseña actual e inténtalo otra vez.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice("La contraseña se actualizó correctamente.");
    } catch {
      setError("No se pudo conectar con Supabase. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

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
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        {showBack ? (
          <Pressable accessibilityRole="button" onPress={() => router.back()}>
            <Text style={styles.back}>‹ Volver</Text>
          </Pressable>
        ) : null}
        <Text style={styles.title}>Mi perfil</Text>
        <Text style={styles.email}>
          {currentUser?.role === "administrador"
            ? "Administrador"
            : currentUser?.role === "vendedor"
              ? "Vendedor"
              : "Usuario autenticado"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
        <Text style={styles.helper}>
          Confirma tu contraseña actual y elige una nueva de al menos 8 caracteres.
        </Text>

        <PasswordField
          label="Contraseña actual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <PasswordField
          label="Nueva contraseña"
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <PasswordField
          label="Confirmar contraseña nueva"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
        ) : null}
        {notice ? (
          <Text accessibilityRole="status" style={styles.notice}>{notice}</Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={() => void changePassword()}
          style={[styles.button, isSaving && styles.disabledButton]}
        >
          <Text style={styles.buttonText}>
            {isSaving ? "Actualizando…" : "Actualizar contraseña"}
          </Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={isSigningOut}
        onPress={() => void signOut()}
        style={[styles.signOutButton, isSigningOut && styles.disabledButton]}
      >
        <Text style={styles.signOutText}>
          {isSigningOut ? "Cerrando sesión…" : "Cerrar sesión"}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        autoComplete={label === "Contraseña actual" ? "current-password" : "new-password"}
        onChangeText={onChangeText}
        secureTextEntry
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: { marginBottom: spacing.lg },
  back: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  title: { marginTop: spacing.md, color: colors.text, fontSize: 28, fontWeight: "800" },
  email: { marginTop: spacing.xs, color: colors.muted, fontSize: 14 },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  helper: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  field: { gap: spacing.xs },
  label: { color: colors.text, fontSize: 13, fontWeight: "700" },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    color: colors.text,
    fontSize: 16,
  },
  error: { color: colors.danger, fontSize: 13 },
  notice: { color: colors.success, fontSize: 13 },
  button: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  disabledButton: { opacity: 0.6 },
  buttonText: { color: colors.surface, fontWeight: "700" },
  signOutButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
  },
  signOutText: { color: colors.danger, fontWeight: "700" },
});
