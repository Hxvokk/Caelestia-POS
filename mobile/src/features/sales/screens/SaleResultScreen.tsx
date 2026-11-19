import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../../../shared/config/theme";
import { formatPrice } from "../utils/formatPrice";

export function SaleResultScreen() {
  const { status, saleId, total, message } = useLocalSearchParams<{
    status?: string;
    saleId?: string;
    total?: string;
    message?: string;
  }>();
  const isRejected = status === "rechazado";
  const parsedTotal = Number(total);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.card, isRejected ? styles.rejectedCard : styles.approvedCard]}>
        <Text style={[styles.status, isRejected ? styles.rejectedText : styles.approvedText]}>
          {isRejected ? "Pago rechazado" : "Venta completada"}
        </Text>
        <Text style={styles.title}>
          {isRejected
            ? message || "No se registró la venta ni se modificó el inventario."
            : "El pago simulado fue aprobado."}
        </Text>
        {!isRejected && saleId ? (
          <Text style={styles.detail}>Número de venta: {saleId}</Text>
        ) : null}
        {!isRejected && Number.isFinite(parsedTotal) && parsedTotal > 0 ? (
          <Text style={styles.total}>{formatPrice(parsedTotal)}</Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace(isRejected ? "/checkout" : "/inventory")}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>
            {isRejected ? "Volver al pago" : "Volver al inventario"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  card: {
    width: "100%",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  approvedCard: { borderColor: colors.success },
  rejectedCard: { borderColor: colors.danger },
  status: { fontSize: 13, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  approvedText: { color: colors.success },
  rejectedText: { color: colors.danger },
  title: { color: colors.text, fontSize: 22, fontWeight: "800", lineHeight: 29 },
  detail: { color: colors.muted, fontSize: 14 },
  total: { color: colors.text, fontSize: 24, fontWeight: "800" },
  primaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  primaryButtonText: { color: colors.surface, fontWeight: "700" },
});
