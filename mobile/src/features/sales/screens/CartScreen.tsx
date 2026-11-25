import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "../../../shared/config/theme";
import { BrandHeader } from "../../inventory/components/HomeDashboardUI";
import { useCartStore } from "../store/cartStore";
import { formatPrice } from "../utils/formatPrice";

export function CartScreen() {
  const insets = useSafeAreaInsets();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const total = Number(items.reduce((sum, item) => sum + item.unitPrice, 0).toFixed(2));
  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/inventory"));

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <BrandHeader action={null} onBack={goBack} title="Carrito" />
      <View style={styles.body}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cart-outline" size={64} color={colors.muted} />
            </View>
            <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
            <Text style={styles.emptyDescription}>
              Aún no has agregado ninguna laptop a tu carrito.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/inventory")}
              style={({ pressed }) => [styles.primaryButton, styles.emptyButton, pressed && styles.pressed]}
            >
              <Ionicons name="laptop-outline" size={21} color={colors.surface} />
              <Text style={styles.primaryButtonText}>Ir al catálogo</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.sectionHeader}>
                <Ionicons name="cart-outline" size={30} color={colors.primary} />
                <View style={styles.sectionCopy}>
                  <Text style={styles.sectionTitle}>Artículos en el carrito</Text>
                  <Text style={styles.sectionSubtitle}>Revisa las unidades seleccionadas</Text>
                </View>
                <View style={styles.countChip}>
                  <Text style={styles.countValue}>{items.length}</Text>
                  <Text style={styles.countLabel}>
                    {items.length === 1 ? "artículo" : "artículos"}
                  </Text>
                </View>
              </View>

              {items.map((item) => (
                <View key={item.unitId} style={styles.itemCard}>
                  <View style={styles.imageBox}>
                    {item.imageUrl ? (
                      <Image
                        accessibilityLabel={`Imagen de ${item.brandName} ${item.modelName}`}
                        resizeMode="contain"
                        source={{ uri: item.imageUrl }}
                        style={styles.image}
                      />
                    ) : (
                      <Ionicons name="laptop-outline" size={36} color={colors.muted} />
                    )}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemBrand}>{item.brandName}</Text>
                    <Text numberOfLines={2} style={styles.itemName}>
                      {item.modelName}
                    </Text>
                    <Text numberOfLines={1} style={styles.serial}>
                      Serie: {item.serialNumber}
                    </Text>
                    <View style={styles.priceChip}>
                      <Text style={styles.priceText}>{formatPrice(item.unitPrice)}</Text>
                    </View>
                  </View>
                  <Pressable
                    accessibilityLabel={`Quitar ${item.modelName} de la serie ${item.serialNumber}`}
                    accessibilityRole="button"
                    onPress={() => removeItem(item.unitId)}
                    style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
                  >
                    <Ionicons name="trash-outline" size={21} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
              <View style={styles.totalCard}>
                <Ionicons name="pricetag-outline" size={28} color={colors.primary} />
                <View style={styles.totalCopy}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalDetail}>Cantidad de artículos: {items.length}</Text>
                </View>
                <View style={styles.totalDivider} />
                <View style={styles.totalAmountBlock}>
                  <Text style={styles.totalDetail}>Total a pagar</Text>
                  <Text adjustsFontSizeToFit numberOfLines={1} style={styles.total}>
                    {formatPrice(total)}
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/checkout")}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              >
                <Ionicons name="card-outline" size={22} color={colors.surface} />
                <Text style={styles.primaryButtonText}>Continuar al pago</Text>
              </Pressable>
            </View>
          </>
        )}
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
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.lg },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sectionCopy: { flex: 1, gap: 2 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  sectionSubtitle: { color: colors.muted, fontSize: 13 },
  countChip: {
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.blueBackground,
  },
  countValue: { color: colors.primary, fontSize: 17, fontWeight: "800" },
  countLabel: { color: colors.muted, fontSize: 11 },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imageBox: {
    width: 84,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  image: { width: "100%", height: "100%" },
  itemInfo: { flex: 1, minWidth: 0, gap: 3 },
  itemBrand: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  itemName: { color: colors.text, fontSize: 15, fontWeight: "800" },
  serial: { color: colors.muted, fontSize: 12 },
  priceChip: {
    alignSelf: "flex-start",
    marginTop: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: colors.blueBackground,
  },
  priceText: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  removeButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    borderRadius: 12,
    backgroundColor: colors.dangerBackground,
  },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  totalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  totalCopy: { gap: 2 },
  totalLabel: { color: colors.text, fontSize: 17, fontWeight: "800" },
  totalDetail: { color: colors.muted, fontSize: 12 },
  totalDivider: { alignSelf: "stretch", width: 1, backgroundColor: colors.border },
  totalAmountBlock: { flex: 1, minWidth: 0, gap: 2 },
  total: { color: colors.primary, fontSize: 24, fontWeight: "800" },
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
  pressed: { opacity: 0.75 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  emptyIcon: {
    width: 150,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 60,
    backgroundColor: colors.blueBackground,
  },
  emptyTitle: { color: colors.text, fontSize: 21, fontWeight: "800", textAlign: "center" },
  emptyDescription: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center" },
  emptyButton: { alignSelf: "stretch", marginTop: spacing.sm },
});
