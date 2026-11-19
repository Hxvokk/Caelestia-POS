import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getApiErrorMessage } from "../../../shared/api/client";
import { getSalesHistory } from "../../../shared/api/salesApi";
import type { SaleHistoryItem } from "../../../shared/api/salesApi";
import { colors, spacing } from "../../../shared/config/theme";
import { formatPrice } from "../utils/formatPrice";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function SalesHistoryScreen() {
  const [sales, setSales] = useState<SaleHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSales = useCallback(async () => {
    setIsLoading(true);
    try {
      setSales(await getSalesHistory());
      setError(null);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSales();
    }, [loadSales]),
  );

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void loadSales()}
            refreshing={isLoading}
            tintColor={colors.primary}
          />
        }
      >
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.back}>‹ Volver</Text>
        </Pressable>
        <View>
          <Text style={styles.eyebrow}>VENTAS</Text>
          <Text style={styles.title}>Historial</Text>
          <Text style={styles.subtitle}>Ventas completadas registradas.</Text>
        </View>

        {error ? (
          <View style={styles.stateCard}>
            <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => void loadSales()}>
              <Text style={styles.retry}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {!error && !isLoading && sales.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.emptyTitle}>Todavía no hay ventas</Text>
            <Text style={styles.subtitle}>
              Las ventas aparecen aquí después de que el pago se aprueba.
            </Text>
          </View>
        ) : null}

        {sales.map((sale) => (
          <Pressable
            key={sale.id}
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: "/sales/[id]", params: { id: String(sale.id) } })
            }
            style={styles.saleCard}
          >
            <View style={styles.saleHeading}>
              <Text style={styles.saleNumber}>Venta #{sale.id}</Text>
              <Text style={styles.saleTotal}>{formatPrice(sale.total)}</Text>
            </View>
            <Text style={styles.saleDate}>{formatDate(sale.date)}</Text>
            <View style={styles.saleFooter}>
              <Text style={styles.saleMeta}>
                {sale.paymentMethod} · {sale.itemCount} {sale.itemCount === 1 ? "unidad" : "unidades"}
              </Text>
              <Text style={styles.saleLink}>Ver detalle ›</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl },
  back: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 1.8 },
  title: { marginTop: spacing.xs, color: colors.text, fontSize: 28, fontWeight: "800" },
  subtitle: { marginTop: spacing.xs, color: colors.muted, fontSize: 14, lineHeight: 20 },
  saleCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.surface,
  },
  saleHeading: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  saleNumber: { color: colors.text, fontSize: 15, fontWeight: "700" },
  saleTotal: { color: colors.text, fontSize: 15, fontWeight: "800" },
  saleDate: { color: colors.muted, fontSize: 13 },
  saleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  saleMeta: { color: colors.muted, fontSize: 12, textTransform: "capitalize" },
  saleLink: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  stateCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.surface,
  },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  error: { color: colors.danger, fontSize: 14 },
  retry: { color: colors.primary, fontWeight: "700" },
});
