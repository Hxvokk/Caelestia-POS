import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../../../shared/config/theme";
import { useCartStore } from "../store/cartStore";
import { formatPrice } from "../utils/formatPrice";

export function CartScreen() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const total = Number(items.reduce((sum, item) => sum + item.unitPrice, 0).toFixed(2));

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.back}>‹ Volver</Text>
        </Pressable>
        <View>
          <Text style={styles.eyebrow}>VENTA</Text>
          <Text style={styles.title}>Carrito</Text>
          <Text style={styles.subtitle}>
            {items.length} {items.length === 1 ? "unidad seleccionada" : "unidades seleccionadas"}
          </Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>El carrito está vacío</Text>
            <Text style={styles.muted}>Agrega unidades disponibles desde el detalle de un modelo.</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/inventory")}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Volver al inventario</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.itemList}>
              {items.map((item) => (
                <View key={item.unitId} style={styles.itemCard}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemBrand}>{item.brandName}</Text>
                    <Text style={styles.itemName}>{item.modelName}</Text>
                    <Text style={styles.serial}>Serie: {item.serialNumber}</Text>
                    <Text style={styles.price}>{formatPrice(item.unitPrice)}</Text>
                  </View>
                  <Pressable
                    accessibilityLabel={`Quitar ${item.modelName} de la serie ${item.serialNumber}`}
                    accessibilityRole="button"
                    onPress={() => removeItem(item.unitId)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeText}>Quitar</Text>
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total estimado</Text>
              <Text style={styles.total}>{formatPrice(total)}</Text>
              <Text style={styles.muted}>
                La API calculará el total final con los precios registrados.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/checkout")}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Continuar al pago</Text>
            </Pressable>
          </>
        )}
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
  itemList: { gap: spacing.md },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  itemInfo: { flex: 1, gap: 3 },
  itemBrand: { color: colors.muted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  itemName: { color: colors.text, fontSize: 16, fontWeight: "700" },
  serial: { color: colors.muted, fontSize: 13 },
  price: { marginTop: spacing.xs, color: colors.text, fontSize: 15, fontWeight: "700" },
  removeButton: { paddingHorizontal: spacing.sm, paddingVertical: spacing.md },
  removeText: { color: colors.danger, fontSize: 13, fontWeight: "700" },
  totalCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  totalLabel: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  total: { color: colors.text, fontSize: 24, fontWeight: "800" },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  primaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  primaryButtonText: { color: colors.surface, fontWeight: "700" },
  emptyCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  secondaryButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.text,
  },
  secondaryButtonText: { color: colors.surface, fontWeight: "700" },
});
