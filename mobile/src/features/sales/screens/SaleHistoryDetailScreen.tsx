import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { getApiErrorMessage } from "../../../shared/api/client";
import { getSaleHistoryDetail } from "../../../shared/api/salesApi";
import type { SaleHistoryDetail } from "../../../shared/api/salesApi";
import { colors, spacing } from "../../../shared/config/theme";
import { BrandHeader, HomeErrorState } from "../../inventory/components/HomeDashboardUI";
import { formatPrice } from "../utils/formatPrice";
import { paymentMethodLabel } from "../utils/paymentLabel";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(date));
}

export function SaleHistoryDetailScreen() {
  const insets = useSafeAreaInsets();
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

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/sales"));

  const renderBody = () => {
    if (isLoading && !sale) {
      return (
        <View style={styles.stateWrap}>
          <Text style={styles.stateTitle}>Cargando venta…</Text>
        </View>
      );
    }
    if (!sale) {
      return (
        <HomeErrorState
          message={error ?? "La venta no está disponible para tu cuenta."}
          onRetry={() => void loadSale()}
          title="No se pudo cargar la venta"
        />
      );
    }

    return (
      <>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            <View style={styles.idRow}>
              <Ionicons name="receipt-outline" size={32} color={colors.primary} />
              <View style={styles.idCopy}>
                <Text style={styles.label}>Identificador</Text>
                <Text style={styles.idValue}>Venta #{sale.id}</Text>
              </View>
            </View>
            <DetailRow icon="calendar-outline" label="Fecha" value={formatDate(sale.date)} />
            <DetailRow
              icon="card-outline"
              label="Método de pago"
              value={paymentMethodLabel(sale.paymentMethod)}
              chip
            />
            <DetailRow icon="person-outline" label="Vendedor" value={sale.sellerName} />
            {sale.amountReceived !== null ? (
              <DetailRow
                icon="cash-outline"
                label="Efectivo recibido"
                value={formatPrice(sale.amountReceived)}
              />
            ) : null}
            {sale.change > 0 ? (
              <DetailRow icon="swap-horizontal-outline" label="Cambio" value={formatPrice(sale.change)} />
            ) : null}
            <View style={styles.totalRow}>
              <Ionicons name="wallet-outline" size={22} color={colors.primary} />
              <Text style={styles.totalLabel}>Total</Text>
              <Text adjustsFontSizeToFit numberOfLines={1} style={styles.total}>
                {formatPrice(sale.total)}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Artículos ({sale.items.length})</Text>
          <View style={styles.itemsCard}>
            {sale.items.map((item, index) => (
              <View
                key={item.unitId}
                style={[styles.itemRow, index > 0 && styles.itemRowBorder]}
              >
                <View style={styles.itemImage}>
                  <Ionicons name="laptop-outline" size={26} color={colors.muted} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemBrand}>{item.brandName}</Text>
                  <Text numberOfLines={2} style={styles.itemName}>
                    {item.modelName}
                  </Text>
                  <Text numberOfLines={1} style={styles.itemSerial}>
                    Serie: {item.serialNumber}
                  </Text>
                  <View style={styles.priceChip}>
                    <Text style={styles.priceText}>{formatPrice(item.unitPrice)}</Text>
                  </View>
                </View>
                <Text style={styles.itemQty}>x1</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            accessibilityRole="button"
            onPress={goBack}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Volver al historial</Text>
          </Pressable>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <BrandHeader action={null} onBack={goBack} title="Detalle de venta" />
      <View style={styles.body}>{renderBody()}</View>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
  chip = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  chip?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.detailLabel}>{label}</Text>
      {chip ? (
        <View style={styles.valueChip}>
          <Text style={styles.valueChipText}>{value}</Text>
        </View>
      ) : (
        <Text style={styles.detailValue}>{value}</Text>
      )}
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
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.lg },
  summaryCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.blueBackground,
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  idCopy: { gap: 2 },
  label: { color: colors.muted, fontSize: 13 },
  idValue: { color: colors.text, fontSize: 20, fontWeight: "800" },
  detailRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  detailLabel: { flex: 1, color: colors.text, fontSize: 14 },
  detailValue: { maxWidth: "55%", color: colors.text, fontSize: 14, fontWeight: "700", textAlign: "right" },
  valueChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: colors.indigoBackground,
  },
  valueChipText: { color: colors.indigo, fontSize: 12, fontWeight: "800" },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { color: colors.text, fontSize: 16, fontWeight: "800" },
  total: { flex: 1, color: colors.primary, fontSize: 24, fontWeight: "800", textAlign: "right" },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  itemsCard: {
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  itemRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  itemRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  itemImage: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  itemInfo: { flex: 1, minWidth: 0, gap: 2 },
  itemBrand: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  itemName: { color: colors.text, fontSize: 14, fontWeight: "800" },
  itemSerial: { color: colors.muted, fontSize: 11 },
  priceChip: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 9,
    backgroundColor: colors.indigoBackground,
  },
  priceText: { color: colors.indigo, fontSize: 12, fontWeight: "800" },
  itemQty: { color: colors.muted, fontSize: 14, fontWeight: "700" },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.blueBackground,
  },
  secondaryButtonText: { color: colors.primary, fontSize: 16, fontWeight: "800" },
  pressed: { opacity: 0.75 },
  stateWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  stateTitle: { color: colors.muted, fontSize: 16, fontWeight: "700" },
});
