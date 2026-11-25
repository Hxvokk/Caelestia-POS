import type { ReactNode } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { colors, spacing } from "../../../shared/config/theme";
import { ScreenState } from "../../../shared/ui/ScreenState";
import { useAdministratorAccess } from "../hooks/useAdministratorAccess";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { isChecking, isAdministrator } = useAdministratorAccess();
  if (isChecking) {
    return <ScreenState loading title="Verificando permisos" />;
  }
  if (!isAdministrator) {
    return (
      <ScreenState
        title="Acceso solo para administrador"
        description="Tu cuenta no tiene permiso para administrar el inventario."
      />
    );
  }
  return children;
}

export function AdminPage({
  title,
  children,
  showBack = true,
}: {
  title: string;
  children: ReactNode;
  showBack?: boolean;
}) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        {showBack ? (
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>‹ Volver</Text>
          </Pressable>
        ) : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function AdminPrimaryButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.primaryButton, disabled && styles.disabledButton]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function AdminSecondaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.secondaryButton}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function AdminField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline = false,
  editable = true,
  secureTextEntry = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad" | "number-pad" | "url";
  multiline?: boolean;
  editable?: boolean;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        editable={editable}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        style={[styles.fieldInput, multiline && styles.multilineInput]}
        value={value}
      />
    </View>
  );
}

export function AdminCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function AdminHelperText({ children }: { children: ReactNode }) {
  return <Text style={styles.helperText}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  back: { alignSelf: "flex-start", paddingVertical: spacing.xs },
  backText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  title: { marginTop: spacing.sm, color: colors.text, fontSize: 27, fontWeight: "800" },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  disabledButton: { opacity: 0.55 },
  primaryButtonText: { color: colors.surface, fontWeight: "700" },
  secondaryButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: { color: colors.primary, fontWeight: "700" },
  field: { gap: 5 },
  fieldLabel: { color: colors.text, fontSize: 13, fontWeight: "700" },
  fieldInput: { minHeight: 44, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: 9, backgroundColor: colors.surface, color: colors.text },
  multilineInput: { minHeight: 88, textAlignVertical: "top" },
  card: { gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 13, backgroundColor: colors.surface },
  helperText: { color: colors.muted, fontSize: 13, lineHeight: 19 },
});
