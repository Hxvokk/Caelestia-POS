import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { createSale, PaymentRejectedError } from "../../../shared/api/salesApi";
import type { SalePaymentMethod, SimulatedCardResult } from "../../../shared/api/salesApi";
import { getApiErrorMessage } from "../../../shared/api/client";
import { colors, spacing } from "../../../shared/config/theme";
import { useCartStore } from "../store/cartStore";
import { formatPrice } from "../utils/formatPrice";

const paymentMethods: { value: SalePaymentMethod; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "debito", label: "Débito simulado" },
  { value: "credito", label: "Crédito simulado" },
];

const cardResults: { value: SimulatedCardResult; label: string }[] = [
  { value: "aprobado", label: "Aprobado" },
  { value: "rechazado", label: "Rechazado" },
];

function parseAmount(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

export function CheckoutScreen() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod | null>(null);
  const [cardResult, setCardResult] = useState<SimulatedCardResult | null>(null);
  const [amountReceived, setAmountReceived] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const total = Number(items.reduce((sum, item) => sum + item.unitPrice, 0).toFixed(2));
  const isCardPayment = paymentMethod === "debito" || paymentMethod === "credito";

  const submitSale = async () => {
    setError(null);
    if (items.length === 0) {
      setError("Agrega al menos una unidad antes de continuar.");
      return;
    }
    if (!paymentMethod) {
      setError("Selecciona un método de pago.");
      return;
    }
    if (isCardPayment && !cardResult) {
      setError("Selecciona el resultado de la simulación de tarjeta.");
      return;
    }

    const received = paymentMethod === "efectivo" ? parseAmount(amountReceived) : null;
    if (
      paymentMethod === "efectivo" &&
      (received === null || received < total)
    ) {
      setError("El efectivo recibido debe ser válido y cubrir el total.");
      return;
    }

    setIsSubmitting(true);
    try {
      const sale = await createSale({
        unitIds: items.map((item) => item.unitId),
        paymentMethod,
        amountReceived: received,
        simulatedCardResult: isCardPayment ? cardResult : null,
      });
      clearCart();
      router.replace({
        pathname: "/sales/result",
        params: {
          status: "aprobado",
          saleId: String(sale.id),
          total: String(sale.total),
        },
      });
    } catch (submitError) {
      if (submitError instanceof PaymentRejectedError) {
        router.replace({
          pathname: "/sales/result",
          params: { status: "rechazado", message: submitError.message },
        });
        return;
      }
      setError(getApiErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.back}>‹ Carrito</Text>
        </Pressable>
        <View>
          <Text style={styles.eyebrow}>VENTA</Text>
          <Text style={styles.title}>Pago</Text>
          <Text style={styles.subtitle}>
            {items.length} {items.length === 1 ? "unidad" : "unidades"} · Total estimado {formatPrice(total)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Método de pago</Text>
          {paymentMethods.map((method) => (
            <Pressable
              key={method.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: paymentMethod === method.value }}
              onPress={() => {
                setPaymentMethod(method.value);
                setError(null);
              }}
              style={[
                styles.choice,
                paymentMethod === method.value && styles.choiceSelected,
              ]}
            >
              <View style={styles.radio}>
                {paymentMethod === method.value ? <View style={styles.radioSelected} /> : null}
              </View>
              <Text style={styles.choiceText}>{method.label}</Text>
            </Pressable>
          ))}
        </View>

        {paymentMethod === "efectivo" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Efectivo recibido</Text>
            <Text style={styles.help}>Ingresa el monto recibido en pesos mexicanos.</Text>
            <TextInput
              accessibilityLabel="Efectivo recibido"
              keyboardType="decimal-pad"
              onChangeText={(value) => {
                setAmountReceived(value);
                setError(null);
              }}
              placeholder="0.00"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={amountReceived}
            />
          </View>
        ) : null}

        {isCardPayment ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Resultado de la simulación</Text>
            <Text style={styles.help}>
              No ingreses datos bancarios. Selecciona el resultado que se simulará.
            </Text>
            <View style={styles.resultChoices}>
              {cardResults.map((result) => (
                <Pressable
                  key={result.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: cardResult === result.value }}
                  onPress={() => {
                    setCardResult(result.value);
                    setError(null);
                  }}
                  style={[
                    styles.resultChoice,
                    cardResult === result.value && styles.choiceSelected,
                    result.value === "rechazado" && cardResult === result.value && styles.rejectedChoice,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      result.value === "rechazado" && cardResult === result.value && styles.rejectedText,
                    ]}
                  >
                    {result.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={() => void submitSale()}
          style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? "Procesando…" : "Confirmar pago simulado"}
          </Text>
        </Pressable>
        <Text style={styles.disclaimer}>
          El total definitivo y la disponibilidad se validan en el backend. No se solicitan datos bancarios.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xl },
  back: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 1.8 },
  title: { marginTop: spacing.xs, color: colors.text, fontSize: 28, fontWeight: "800" },
  subtitle: { marginTop: spacing.xs, color: colors.muted, fontSize: 14 },
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  help: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  choice: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  choiceSelected: { borderColor: colors.primary, backgroundColor: "#F0F5FF" },
  radio: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.muted,
    borderRadius: 10,
  },
  radioSelected: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  choiceText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    color: colors.text,
    fontSize: 16,
  },
  resultChoices: { flexDirection: "row", gap: spacing.sm },
  resultChoice: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  rejectedChoice: { borderColor: colors.danger, backgroundColor: colors.dangerBackground },
  rejectedText: { color: colors.danger },
  error: { color: colors.danger, fontSize: 13 },
  primaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: colors.surface, fontWeight: "700" },
  disclaimer: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center" },
});
