import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../shared/auth/supabase";
import { colors, spacing } from "../../../shared/config/theme";
import { BrandHeader } from "../../inventory/components/HomeDashboardUI";
import { useSessionStore } from "../store/sessionStore";

const MIN_LENGTH = 8;

export function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const email = useSessionStore((state) => state.session?.user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const longEnough = newPassword.length >= MIN_LENGTH;
  const matches = confirmPassword.length > 0 && newPassword === confirmPassword;
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit = currentPassword.length > 0 && longEnough && matches && !isSaving;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/profile"));

  const changePassword = async () => {
    if (!supabase) {
      setError("Falta configurar la conexión con Supabase.");
      return;
    }
    if (!canSubmit) return;

    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      if (!email) {
        setError("No se pudo identificar tu cuenta. Cierra sesión e inicia de nuevo.");
        return;
      }

      // Supabase only checks the current password when "secure password change"
      // is enabled in the project, so verify it explicitly before updating.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (verifyError) {
        setError(
          verifyError.code === "invalid_credentials"
            ? "La contraseña actual no es correcta."
            : "No se pudo verificar la contraseña actual. Inténtalo de nuevo.",
        );
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
        current_password: currentPassword,
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

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <BrandHeader action={null} onBack={goBack} title="Cambiar contraseña" />
      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed-outline" size={46} color={colors.primary} />
          </View>
          <Text style={styles.subtitle}>
            Actualiza la contraseña de tu cuenta para mantenerla segura.
          </Text>

          <PasswordField
            autoComplete="current-password"
            label="Contraseña actual"
            onChangeText={(value) => {
              setCurrentPassword(value);
              setError(null);
            }}
            placeholder="Ingresa tu contraseña actual"
            value={currentPassword}
          />
          <PasswordField
            autoComplete="new-password"
            label="Nueva contraseña"
            onChangeText={(value) => {
              setNewPassword(value);
              setError(null);
            }}
            placeholder="Ingresa tu nueva contraseña"
            value={newPassword}
          />
          <Rule met={longEnough} text={`Mínimo ${MIN_LENGTH} caracteres.`} touched={newPassword.length > 0} />
          <PasswordField
            autoComplete="new-password"
            label="Confirmar nueva contraseña"
            onChangeText={(value) => {
              setConfirmPassword(value);
              setError(null);
            }}
            placeholder="Confirma tu nueva contraseña"
            value={confirmPassword}
          />
          {mismatch ? (
            <View style={styles.ruleRow}>
              <Ionicons name="close-circle" size={18} color={colors.danger} />
              <Text style={styles.ruleError}>Las contraseñas no coinciden.</Text>
            </View>
          ) : matches ? (
            <Rule met text="Las contraseñas coinciden." touched />
          ) : null}

          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}
          {notice ? (
            <View style={styles.noticeRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text accessibilityRole="alert" style={styles.notice}>
                {notice}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
            disabled={!canSubmit}
            onPress={() => void changePassword()}
            style={({ pressed }) => [
              styles.submit,
              !canSubmit && styles.submitDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="checkmark" size={22} color={colors.surface} />
            <Text style={styles.submitText}>
              {isSaving ? "Actualizando…" : "Actualizar contraseña"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Rule({ met, text, touched }: { met: boolean; text: string; touched: boolean }) {
  return (
    <View style={styles.ruleRow}>
      <Ionicons
        name={met ? "checkmark-circle" : "ellipse-outline"}
        size={18}
        color={met ? colors.success : touched ? colors.muted : colors.border}
      />
      <Text style={[styles.rule, met && styles.ruleMet]}>{text}</Text>
    </View>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoComplete: "current-password" | "new-password";
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={22} color={colors.primary} />
        <TextInput
          accessibilityLabel={label}
          autoCapitalize="none"
          autoComplete={autoComplete}
          autoCorrect={false}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={!visible}
          style={styles.input}
          value={value}
        />
        <Pressable
          accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setVisible((current) => !current)}
        >
          <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={22} color={colors.muted} />
        </Pressable>
      </View>
    </View>
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
  content: { gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.md },
  lockIcon: {
    alignSelf: "center",
    width: 100,
    height: 86,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 40,
    backgroundColor: colors.blueBackground,
  },
  subtitle: {
    marginBottom: spacing.sm,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  field: { gap: 6, marginTop: spacing.xs },
  label: { color: colors.text, fontSize: 15, fontWeight: "800" },
  inputBox: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, paddingVertical: 10, color: colors.text, fontSize: 15 },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rule: { color: colors.muted, fontSize: 13 },
  ruleMet: { color: colors.success },
  ruleError: { color: colors.danger, fontSize: 13 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  noticeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  notice: { flex: 1, color: colors.success, fontSize: 14, fontWeight: "700" },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  submit: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  submitDisabled: { opacity: 0.45 },
  submitText: { color: colors.surface, fontSize: 16, fontWeight: "800" },
  pressed: { opacity: 0.75 },
});
