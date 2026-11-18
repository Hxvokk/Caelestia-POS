import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { colors, spacing } from "../../../shared/config/theme";
import { supabase } from "../../../shared/auth/supabase";

const signInSchema = z.object({
  email: z.email("Escribe un correo válido."),
  password: z.string().min(1, "Escribe tu contraseña."),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInScreen() {
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signIn = async ({ email, password }: SignInValues) => {
    if (!supabase) {
      setRequestError("Falta configurar la conexión pública de Supabase en .env.local.");
      return;
    }

    setIsSubmitting(true);
    setRequestError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setRequestError("No se pudo iniciar sesión. Revisa tus datos y que tu cuenta esté activa.");
      }
    } catch {
      setRequestError("No se pudo iniciar sesión. Revisa tus datos y que tu cuenta esté activa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.brand}>
        <Text style={styles.eyebrow}>CAELESTIA POS</Text>
        <Text style={styles.title}>Inicia sesión</Text>
        <Text style={styles.subtitle}>
          Accede con la cuenta de administrador o vendedor de la tienda.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Correo electrónico</Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              accessibilityLabel="Correo electrónico"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="nombre@tienda.com"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
              style={[styles.input, errors.email && styles.inputError]}
              value={value}
            />
          )}
        />
        {errors.email ? <Text style={styles.fieldError}>{errors.email.message}</Text> : null}

        <Text style={[styles.label, styles.passwordLabel]}>Contraseña</Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              accessibilityLabel="Contraseña"
              autoCapitalize="none"
              autoComplete="current-password"
              onBlur={onBlur}
              onChangeText={onChange}
              onSubmitEditing={() => void handleSubmit(signIn)()}
              placeholder="Tu contraseña"
              placeholderTextColor={colors.muted}
              returnKeyType="go"
              secureTextEntry
              style={[styles.input, errors.password && styles.inputError]}
              value={value}
            />
          )}
        />
        {errors.password ? (
          <Text style={styles.fieldError}>{errors.password.message}</Text>
        ) : null}

        {requestError ? (
          <Text accessibilityRole="alert" style={styles.requestError}>
            {requestError}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={() => void handleSubmit(signIn)()}
          style={({ pressed }) => [
            styles.button,
            (pressed || isSubmitting) && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? "Conectando…" : "Iniciar sesión"}
          </Text>
        </Pressable>
        <Text style={styles.footnote}>
          La cuenta debe tener un perfil activo en Caelestia POS.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    backgroundColor: colors.background,
  },
  brand: {
    marginBottom: spacing.xl,
  },
  eyebrow: {
    marginBottom: spacing.sm,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
  },
  form: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  label: {
    marginBottom: spacing.xs,
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  passwordLabel: {
    marginTop: spacing.md,
  },
  input: {
    minHeight: 50,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    color: colors.text,
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.danger,
  },
  fieldError: {
    marginTop: 5,
    color: colors.danger,
    fontSize: 13,
  },
  requestError: {
    marginTop: spacing.md,
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  buttonPressed: {
    backgroundColor: colors.primaryDark,
    opacity: 0.9,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  footnote: {
    marginTop: spacing.md,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
