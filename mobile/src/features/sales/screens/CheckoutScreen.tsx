import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { createSale, PaymentRejectedError } from "../../../shared/api/salesApi";
import type { SalePaymentMethod, SimulatedCardResult } from "../../../shared/api/salesApi";
import { getApiErrorMessage } from "../../../shared/api/client";
import { colors, spacing } from "../../../shared/config/theme";
import { BrandHeader } from "../../inventory/components/HomeDashboardUI";
import { useCartStore } from "../store/cartStore";
import { formatPrice } from "../utils/formatPrice";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const paymentMethods: {
  value: SalePaymentMethod;
  label: string;
  icon: IconName;
  description?: string;
}[] = [
  { value: "efectivo", label: "Efectivo", icon: "cash-outline" },
  {
    value: "debito",
    label: "Débito simulado",
    icon: "card-outline",
    description: "Simulación, no se capturan datos de tarjeta.",
  },
  {
    value: "credito",
    label: "Crédito simulado",
    icon: "card-outline",
    description: "Simulación, no se capturan datos de tarjeta.",
  },
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
  const insets = useSafeAreaInsets();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod | null>(null);
  const [cardResult, setCardResult] = useState<SimulatedCardResult | null>(null);
  const [amountReceived, setAmountReceived] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const total = Number(items.reduce((sum, item) => sum + item.unitPrice, 0).toFixed(2));
  const selectedMethod = paymentMethods.find((method) => method.value === paymentMethod);
  const isCardPayment = paymentMethod === "debito" || paymentMethod === "credito";
  const receivedAmount = parseAmount(amountReceived);
  const estimatedChange =
    paymentMethod === "efectivo" && receivedAmount !== null && receivedAmount >= total
      ? Number((receivedAmount - total).toFixed(2))
      : null;

  const submitSale = async () => {
    setError(null);
    setFailure(null);
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

    const received = paymentMethod === "efectivo" ? receivedAmount : null;
    if (paymentMethod === "efectivo" && (received === null || received < total)) {
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
      setFailure(getApiErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/cart"));

  const renderBody = () => {
    if (isSubmitting) return <ProcessingState />;
    if (failure) {
      return (
        <View style={styles.stateWrap}>
          <View style={[styles.stateIcon, styles.stateIconError]}>
            <Ionicons name="laptop-outline" size={58} color={colors.danger} />
            <View style={styles.errorBadge}>
              <Ionicons name="alert" size={16} color={colors.surface} />
            </View>
          </View>
          <Text style={styles.stateTitle}>No se pudo procesar el pago</Text>
          <Text style={styles.stateDescription}>{failure} Por favor, inténtalo de nuevo.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void submitSale()}
            style={({ pressed }) => [styles.primaryButton, styles.stateButton, pressed && styles.pressed]}
          >
            <Ionicons name="refresh" size={21} color={colors.surface} />
            <Text style={styles.primaryButtonText}>Reintentar</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/cart")}
            style={({ pressed }) => [styles.secondaryButton, styles.stateButton, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Volver al carrito</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <>
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Resumen de artículos</Text>
          <ScrollView
            contentContainerStyle={styles.summaryList}
            nestedScrollEnabled
            showsVerticalScrollIndicator
            style={styles.summaryScroll}
          >
            {items.map((item) => (
              <View key={item.unitId} style={styles.itemRow}>
                <View style={styles.itemImage}>
                  {item.imageUrl ? (
                    <Image
                      accessibilityLabel={`Imagen de ${item.brandName} ${item.modelName}`}
                      resizeMode="contain"
                      source={{ uri: item.imageUrl }}
                      style={styles.fill}
                    />
                  ) : (
                    <Ionicons name="laptop-outline" size={26} color={colors.muted} />
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemBrand}>{item.brandName}</Text>
                  <Text numberOfLines={2} style={styles.itemName}>
                    {item.modelName}
                  </Text>
                  <Text numberOfLines={1} style={styles.itemSerial}>
                    Serie: {item.serialNumber}
                  </Text>
                </View>
                <View style={styles.itemPriceBlock}>
                  <View style={styles.priceChip}>
                    <Text style={styles.priceText}>{formatPrice(item.unitPrice)}</Text>
                  </View>
                  <Text style={styles.itemQty}>x1</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text adjustsFontSizeToFit numberOfLines={1} style={styles.total}>
              {formatPrice(total)}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          style={styles.formScroll}
        >
          <Text style={styles.sectionTitle}>Método de pago</Text>
          <Pressable
            accessibilityLabel="Método de pago"
            accessibilityRole="button"
            accessibilityState={{ expanded: methodOpen }}
            onPress={() => setMethodOpen((open) => !open)}
            style={[styles.combo, methodOpen && styles.comboOpen]}
          >
            <Ionicons
              name={selectedMethod?.icon ?? "wallet-outline"}
              size={24}
              color={selectedMethod ? colors.primary : colors.muted}
            />
            <Text style={[styles.comboText, !selectedMethod && styles.comboPlaceholder]}>
              {selectedMethod?.label ?? "Selecciona un método de pago"}
            </Text>
            <Ionicons
              name={methodOpen ? "chevron-up" : "chevron-down"}
              size={22}
              color={colors.muted}
            />
          </Pressable>
          {methodOpen ? (
            <View style={styles.comboList}>
              {paymentMethods.map((method) => {
                const selected = paymentMethod === method.value;
                return (
                  <Pressable
                    key={method.value}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setPaymentMethod(method.value);
                      setMethodOpen(false);
                      setError(null);
                    }}
                    style={[styles.comboOption, selected && styles.comboOptionSelected]}
                  >
                    <Ionicons name={method.icon} size={24} color={colors.primary} />
                    <View style={styles.choiceCopy}>
                      <Text style={styles.choiceText}>{method.label}</Text>
                      {method.description ? (
                        <Text style={styles.choiceDescription}>{method.description}</Text>
                      ) : null}
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {paymentMethod === "efectivo" ? (
            <View style={styles.extra}>
              <View style={styles.cashHeader}>
                <Text style={styles.fieldLabel}>Efectivo recibido (MXN)</Text>
                {estimatedChange !== null ? (
                  <Text style={styles.change}>Cambio: {formatPrice(estimatedChange)}</Text>
                ) : null}
              </View>
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
            <View style={styles.extra}>
              <Text style={styles.fieldLabel}>Resultado de la simulación</Text>
              <View style={styles.resultChoices}>
                {cardResults.map((result) => {
                  const selected = cardResult === result.value;
                  const rejected = result.value === "rechazado" && selected;
                  return (
                    <Pressable
                      key={result.value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => {
                        setCardResult(result.value);
                        setError(null);
                      }}
                      style={[
                        styles.resultChoice,
                        selected && styles.choiceSelected,
                        rejected && styles.rejectedChoice,
                      ]}
                    >
                      <Text style={[styles.choiceText, rejected && styles.rejectedText]}>
                        {result.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => void submitSale()}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Ionicons name="cart-outline" size={22} color={colors.surface} />
            <Text style={styles.primaryButtonText}>Confirmar pago</Text>
          </Pressable>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <BrandHeader
        action={null}
        onBack={isSubmitting ? undefined : goBack}
        title="Pago"
      />
      <View style={styles.body}>{renderBody()}</View>
    </SafeAreaView>
  );
}

function ProcessingState() {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-120, 260] });

  return (
    <View accessibilityLabel="Procesando pago" style={styles.stateWrap}>
      <View style={styles.stateIcon}>
        <Ionicons name="cart-outline" size={64} color={colors.primary} />
      </View>
      <Text style={styles.stateTitle}>Procesando pago…</Text>
      <Text style={styles.stateDescription}>
        Espera un momento mientras registramos la venta.
      </Text>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressBar, { transform: [{ translateX }] }]} />
      </View>
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
  formScroll: { flexGrow: 0, flexShrink: 1 },
  formContent: {
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fill: { width: "100%", height: "100%" },
  summarySection: { flexGrow: 1, flexShrink: 1, minHeight: 130, gap: spacing.sm, padding: spacing.md, paddingBottom: spacing.sm },
  summaryScroll: { flex: 1 },
  summaryList: { gap: spacing.sm },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  itemImage: {
    width: 56,
    height: 56,
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
  itemSerial: { color: colors.muted, fontSize: 11 },
  itemPriceBlock: { alignItems: "flex-end", gap: 4 },
  priceChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 9,
    backgroundColor: colors.indigoBackground,
  },
  priceText: { color: colors.indigo, fontSize: 12, fontWeight: "800" },
  itemQty: { color: colors.muted, fontSize: 13 },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.indigoBackground,
  },
  totalLabel: { color: colors.text, fontSize: 17, fontWeight: "800" },
  total: { flex: 1, color: colors.indigo, fontSize: 24, fontWeight: "800", textAlign: "right" },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  choiceSelected: { borderColor: colors.primary, backgroundColor: colors.blueBackground },
  combo: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  comboOpen: { borderColor: colors.primary },
  comboText: { flex: 1, color: colors.text, fontSize: 15, fontWeight: "800" },
  comboPlaceholder: { color: colors.muted, fontWeight: "400" },
  comboList: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  comboOption: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  comboOptionSelected: { backgroundColor: colors.blueBackground },
  choiceCopy: { flex: 1, gap: 1 },
  choiceText: { color: colors.text, fontSize: 15, fontWeight: "800" },
  choiceDescription: { color: colors.muted, fontSize: 12 },
  extra: { gap: 4 },
  cashHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    color: colors.text,
    fontSize: 16,
    backgroundColor: colors.surface,
  },
  change: { color: colors.success, fontSize: 13, fontWeight: "700" },
  resultChoices: { flexDirection: "row", gap: spacing.sm },
  resultChoice: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
  },
  rejectedChoice: { borderColor: colors.danger, backgroundColor: colors.dangerBackground },
  rejectedText: { color: colors.danger },
  footer: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18 },
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
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  stateIcon: {
    position: "relative",
    width: 150,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 60,
    backgroundColor: colors.indigoBackground,
  },
  stateIconError: { backgroundColor: colors.dangerBackground },
  errorBadge: {
    position: "absolute",
    right: 40,
    top: 28,
    width: 25,
    height: 25,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.danger,
  },
  stateTitle: { color: colors.text, fontSize: 21, fontWeight: "800", textAlign: "center" },
  stateDescription: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center" },
  stateButton: { alignSelf: "stretch" },
  progressTrack: {
    width: "80%",
    height: 8,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: colors.indigoBackground,
  },
  progressBar: { width: 120, height: 8, borderRadius: 4, backgroundColor: colors.indigoLight },
});
