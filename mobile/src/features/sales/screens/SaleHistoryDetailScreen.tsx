import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getApiErrorMessage } from "../../../shared/api/client";
import { getSaleHistoryDetail } from "../../../shared/api/salesApi";
import type { SaleHistoryDetail } from "../../../shared/api/salesApi";
import { colors, spacing } from "../../../shared/config/theme";
import { ScreenState } from "../../../shared/ui/ScreenState";
import { formatPrice } from "../utils/formatPrice";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(date));
}

export function SaleHistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const saleId = Number(id);
  const [sale, setSale] = useState<SaleHistoryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSale = useCallback(async () => {
    if (!Number.isSafeInteger(saleId) || saleId <= 0) {
      setError("El número de venta no es válido.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setSale(await getSaleHistoryDetail(saleId));
      setError(null);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [saleId]);

  useFocusEffect(
    useCallback(() => {
      void loadSale();
    }, [loadSale]),
  );

  if (isLoading) {
    return <ScreenState loading title="Cargando venta" />;
  }

  if (!sale) {
    return (
      <ScreenState
        title="No se pudo cargar la venta"
        description={error ?? "La venta no está disponible para tu cuenta."}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.back}>‹ Historial</Text>
        </Pressable>
        <View>
          <Text style={styles.eyebrow}>DETALLE DE VENTA</Text>
          <Text style={styles.title}>Venta #{sale.id}</Text>
          <Text style={styles.subtitle}>{formatDate(sale.date)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <DetailRow label="Vendedor" value={sale.sellerName} />
          <DetailRow label="Estado" value={sale.status} />
          <DetailRow label="Método de pago" value={sale.paymentMethod} />
          <DetailRow label="Pago simulado" value={sale.isSimulated ? "Sí" : "No"} />
          {sale.amountReceived !== null ? (
            <DetailRow label="Efectivo recibido" value={formatPrice(sale.amountReceived)} />
          ) : null}
          {sale.change > 0 ? <DetailRow label="Cambio" value={formatPrice(sale.change)} /> : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.total}>{formatPrice(sale.total)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Unidades</Text>
          {sale.items.map((item) => (
            <View key={item.unitId} style={styles.item}>
              <Text style={styles.itemName}>{item.brandName} {item.modelName}</Text>
              <Text style={styles.itemMeta}>Serie: {item.serialNumber}</Text>
              <Text style={styles.itemPrice}>{formatPrice(item.unitPrice)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl },
  back: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 1.8 },
  title: { marginTop: spacing.xs, color: colors.text, fontSize: 26, fontWeight: "800" },
  subtitle: { marginTop: spacing.xs, color: colors.muted, fontSize: 14 },
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.surface,
  },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  detailLabel: { color: colors.muted, fontSize: 13 },
  detailValue: { color: colors.text, fontSize: 13, fontWeight: "600", textTransform: "capitalize" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { color: colors.text, fontWeight: "700" },
  total: { color: colors.text, fontSize: 20, fontWeight: "800" },
  item: { gap: 3, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  itemName: { color: colors.text, fontWeight: "700" },
  itemMeta: { color: colors.muted, fontSize: 13 },
  itemPrice: { color: colors.text, fontSize: 14, fontWeight: "700" },
});
