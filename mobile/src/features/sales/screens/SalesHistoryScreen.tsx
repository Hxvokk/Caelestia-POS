import { useCallback, useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getApiErrorMessage } from "../../../shared/api/client";
import { getSalesHistory } from "../../../shared/api/salesApi";
import type { SaleHistoryItem } from "../../../shared/api/salesApi";
import { colors, spacing } from "../../../shared/config/theme";
import { BrandHeader, HomeErrorState } from "../../inventory/components/HomeDashboardUI";
import { formatPrice } from "../utils/formatPrice";
import { paymentMethodLabel } from "../utils/paymentLabel";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function SalesHistoryScreen({ showBack = true }: { showBack?: boolean } = {}) {
  const [sales, setSales] = useState<SaleHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadSales = useCallback(async () => {
    setIsLoading(true);
    try {
      setSales(await getSalesHistory());
      setError(null);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSales();
    }, [loadSales]),
  );

  const initialLoading = isLoading && !hasLoaded;

  const renderState = () => {
    if (initialLoading) return <LoadingState />;
    if (error && sales.length === 0) {
      return (
        <HomeErrorState
          message={error}
          onRetry={() => void loadSales()}
          title="No se pudo cargar el historial"
        />
      );
    }
    return (
      <View style={styles.stateWrap}>
        <View style={styles.stateIcon}>
          <Ionicons name="document-text-outline" size={58} color={colors.muted} />
        </View>
        <Text style={styles.stateTitle}>Aún no hay ventas registradas</Text>
        <Text style={styles.stateDescription}>
          Las ventas que realices se mostrarán aquí.
        </Text>
      </View>
    );
  };

  const showList = !initialLoading && sales.length > 0;

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <BrandHeader
        action={null}
        onBack={showBack ? () => router.back() : undefined}
        title="Historial de ventas"
      />
      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={[styles.content, !showList && styles.contentFill]}
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              onRefresh={() => void loadSales()}
              refreshing={isLoading && !initialLoading}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {error && showList ? (
            <Text accessibilityRole="alert" style={styles.inlineError}>
              {error}
            </Text>
          ) : null}
          {showList
            ? sales.map((sale) => (
                <Pressable
                  key={sale.id}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({ pathname: "/sales/[id]", params: { id: String(sale.id) } })
                  }
                  style={({ pressed }) => [styles.saleCard, pressed && styles.pressed]}
                >
                  <View style={styles.saleIcon}>
                    <Ionicons name="receipt-outline" size={26} color={colors.primary} />
                  </View>
                  <View style={styles.saleInfo}>
                    <View style={styles.saleHeading}>
                      <Text style={styles.saleNumber}>Venta #{sale.id}</Text>
                      <View style={styles.methodChip}>
                        <Text numberOfLines={1} style={styles.methodText}>
                          {paymentMethodLabel(sale.paymentMethod)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.dateRow}>
                      <Ionicons name="calendar-outline" size={14} color={colors.muted} />
                      <Text style={styles.saleDate}>{formatDate(sale.date)}</Text>
                    </View>
                    <Text style={styles.saleMeta}>
                      {sale.itemCount} {sale.itemCount === 1 ? "unidad" : "unidades"} · Total:{" "}
                      <Text style={styles.saleTotal}>{formatPrice(sale.total)}</Text>
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                </Pressable>
              ))
            : renderState()}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function LoadingState() {
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
    <View accessibilityLabel="Cargando historial" style={styles.stateWrap}>
      <View style={styles.stateIcon}>
        <Ionicons name="time-outline" size={64} color={colors.primary} />
      </View>
      <Text style={styles.stateTitle}>Cargando historial…</Text>
      <Text style={styles.stateDescription}>Estamos obteniendo las ventas registradas.</Text>
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
  content: { gap: spacing.sm, padding: spacing.md, paddingBottom: spacing.xl },
  contentFill: { flexGrow: 1 },
  inlineError: { color: colors.danger, fontSize: 13 },
  saleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
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
  pressed: { opacity: 0.75 },
  saleIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.blueBackground,
  },
  saleInfo: { flex: 1, minWidth: 0, gap: 3 },
  saleHeading: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  saleNumber: { color: colors.text, fontSize: 16, fontWeight: "800" },
  methodChip: {
    flexShrink: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.indigoBackground,
  },
  methodText: { color: colors.indigo, fontSize: 11, fontWeight: "800" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  saleDate: { color: colors.muted, fontSize: 12 },
  saleMeta: { color: colors.muted, fontSize: 12 },
  saleTotal: { color: colors.text, fontSize: 13, fontWeight: "800" },
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  stateIcon: {
    width: 150,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 60,
    backgroundColor: colors.indigoBackground,
  },
  stateTitle: { color: colors.text, fontSize: 21, fontWeight: "800", textAlign: "center" },
  stateDescription: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center" },
  progressTrack: {
    width: "80%",
    height: 8,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: colors.indigoBackground,
  },
  progressBar: { width: 120, height: 8, borderRadius: 4, backgroundColor: colors.indigoLight },
});
