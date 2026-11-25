import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "../../../shared/config/theme";
import { BrandHeader } from "../../inventory/components/HomeDashboardUI";
import { useLastSaleStore } from "../store/lastSaleStore";
import { formatPrice } from "../utils/formatPrice";

export function SaleResultScreen() {
  const insets = useSafeAreaInsets();
  const items = useLastSaleStore((state) => state.items);
  const { status, saleId, total } = useLocalSearchParams<{
    status?: string;
    saleId?: string;
    total?: string;
  }>();
  const isRejected = status === "rejected" || status === "rechazado";
  const parsedTotal = Number(total);
  const hasTotal = Number.isFinite(parsedTotal) && parsedTotal > 0;
  const showItems = !isRejected && items.length > 0;

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <BrandHeader
        action={null}
        onBack={isRejected ? () => router.replace("/checkout") : undefined}
        title="Pago"
      />
      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.halo, isRejected ? styles.haloRejected : styles.haloApproved]}>
            <View style={[styles.badge, isRejected ? styles.badgeRejected : styles.badgeApproved]}>
              <Ionicons name={isRejected ? "close" : "checkmark"} size={44} color={colors.surface} />
            </View>
          </View>
          <Text style={styles.title}>{isRejected ? "Pago rechazado" : "Venta completada"}</Text>
          <Text style={styles.description}>
            {isRejected
              ? "La venta no se registró y el inventario no cambió. No se realizó ningún cargo."
              : "La venta se registró correctamente y los artículos fueron procesados."}
          </Text>

          {(!isRejected && saleId) || hasTotal ? (
            <View style={styles.infoCard}>
              {!isRejected && saleId ? (
                <View style={styles.infoRow}>
                  <Ionicons name="receipt-outline" size={30} color={colors.primary} />
                  <View style={styles.infoCopy}>
                    <Text style={styles.infoLabel}>Folio de venta</Text>
                    <Text style={styles.infoValue}>{saleId}</Text>
                  </View>
                </View>
              ) : null}
              {!isRejected && saleId && hasTotal ? <View style={styles.divider} /> : null}
              {hasTotal ? (
                <View style={styles.infoRow}>
                  <Ionicons name="cash-outline" size={30} color={colors.primary} />
                  <View style={styles.infoCopy}>
                    <Text style={styles.infoLabel}>Total</Text>
                    <Text adjustsFontSizeToFit numberOfLines={1} style={styles.infoTotal}>
                      {formatPrice(parsedTotal)}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

          {showItems ? (
            <>
              <View style={styles.itemsHeader}>
                <Text style={styles.itemsTitle}>Artículos</Text>
                <View style={styles.countChip}>
                  <Text style={styles.countText}>
                    {items.length} {items.length === 1 ? "artículo" : "artículos"}
                  </Text>
                </View>
              </View>
              <View style={styles.itemsCard}>
                {items.map((item, index) => (
                  <View
                    key={item.unitId}
                    style={[styles.itemRow, index > 0 && styles.itemRowBorder]}
                  >
                    <View style={styles.itemImage}>
                      {item.imageUrl ? (
                        <Image
                          accessibilityLabel={`Imagen de ${item.brandName} ${item.modelName}`}
                          resizeMode="contain"
                          source={{ uri: item.imageUrl }}
                          style={styles.fill}
                        />
                      ) : (
                        <Ionicons name="laptop-outline" size={24} color={colors.muted} />
                      )}
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemBrand}>{item.brandName}</Text>
                      <Text numberOfLines={2} style={styles.itemName}>
                        {item.modelName}
                      </Text>
                    </View>
                    <Text style={styles.itemQty}>x1</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          {isRejected ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/checkout")}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Ionicons name="refresh" size={21} color={colors.surface} />
              <Text style={styles.primaryButtonText}>Volver al pago</Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/sales")}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Ionicons name="time-outline" size={22} color={colors.surface} />
              <Text style={styles.primaryButtonText}>Ver historial de ventas</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/inventory")}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Ionicons name="laptop-outline" size={21} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Volver al catálogo</Text>
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
  fill: { width: "100%", height: "100%" },
  content: {
    alignItems: "stretch",
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.md,
  },
  halo: {
    alignSelf: "center",
    width: 150,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 60,
  },
  haloApproved: { backgroundColor: colors.successBackground },
  haloRejected: { backgroundColor: colors.dangerBackground },
  badge: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 34,
  },
  badgeApproved: { backgroundColor: colors.success },
  badgeRejected: { backgroundColor: colors.danger },
  title: { color: colors.text, fontSize: 26, fontWeight: "800", textAlign: "center" },
  description: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center" },
  infoCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.blueBackground,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  infoCopy: { flex: 1, gap: 2 },
  infoLabel: { color: colors.muted, fontSize: 13 },
  infoValue: { color: colors.text, fontSize: 18, fontWeight: "800" },
  infoTotal: { color: colors.primary, fontSize: 26, fontWeight: "800" },
  divider: { height: 1, backgroundColor: colors.border },
  itemsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemsTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  countChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.blueBackground,
  },
  countText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
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
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  itemInfo: { flex: 1, minWidth: 0, gap: 1 },
  itemBrand: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  itemName: { color: colors.text, fontSize: 14, fontWeight: "800" },
  itemQty: { color: colors.muted, fontSize: 14, fontWeight: "700" },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  primaryButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  primaryButtonText: { color: colors.surface, fontSize: 16, fontWeight: "800" },
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
});
