import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { getApiErrorMessage } from "../../../shared/api/client";
import { getDashboardMetrics } from "../../../shared/api/inventoryApi";
import type { DashboardMetrics } from "../../../shared/api/inventoryApi";
import { colors, spacing } from "../../../shared/config/theme";
import {
  AdminGuard,
  AdminHelperText,
  AdminPage,
  AdminSecondaryButton,
} from "../components/AdminAccess";
import { formatPrice } from "../../sales/utils/formatPrice";

type MetricCardProps = {
  title: string;
  value: string;
  description: string;
  actionLabel: string;
  onPress: () => void;
};

function MetricCard({ title, value, description, actionLabel, onPress }: MetricCardProps) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDescription}>{description}</Text>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.metricAction}>
        <Text style={styles.metricActionText}>{actionLabel} ›</Text>
      </Pressable>
    </View>
  );
}

export function DashboardScreen() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      setMetrics(await getDashboardMetrics());
      setError(null);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMetrics();
    }, [loadMetrics]),
  );

  return (
    <AdminGuard>
      <AdminPage title="Dashboard">
        <AdminHelperText>
          Resumen de ventas completadas e inventario actual.
        </AdminHelperText>
        {error ? (
          <View style={styles.errorCard}>
            <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>
            <AdminSecondaryButton label="Reintentar" onPress={() => void loadMetrics()} />
          </View>
        ) : null}
        {isLoading && !metrics ? <AdminHelperText>Cargando métricas…</AdminHelperText> : null}
        {metrics ? (
          <View style={styles.metrics}>
            <MetricCard
              title="Ventas acumuladas"
              value={formatPrice(metrics.completedSalesTotal)}
              description="Suma de ventas completadas"
              actionLabel="Ver historial"
              onPress={() => router.push("/sales")}
            />
            <MetricCard
              title="Unidades vendidas"
              value={String(metrics.soldUnits)}
              description="Equipos con estado vendido"
              actionLabel="Ver unidades vendidas"
              onPress={() =>
                router.push({ pathname: "/admin/units", params: { status: "vendida" } })
              }
            />
            <MetricCard
              title="Unidades disponibles"
              value={String(metrics.availableUnits)}
              description="Equipos disponibles para venta"
              actionLabel="Ver unidades disponibles"
              onPress={() =>
                router.push({ pathname: "/admin/units", params: { status: "disponible" } })
              }
            />
            <MetricCard
              title="Modelos registrados"
              value={String(metrics.registeredModels)}
              description="Configuraciones en el catálogo"
              actionLabel="Ver modelos"
              onPress={() => router.push("/admin/models")}
            />
          </View>
        ) : null}
      </AdminPage>
    </AdminGuard>
  );
}

const styles = StyleSheet.create({
  metrics: { gap: spacing.md },
  metricCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  metricTitle: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  metricValue: { color: colors.text, fontSize: 23, fontWeight: "800" },
  metricDescription: { color: colors.muted, fontSize: 12 },
  metricAction: { alignSelf: "flex-start", paddingVertical: spacing.sm },
  metricActionText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  errorCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    backgroundColor: colors.dangerBackground,
  },
  errorText: { color: colors.danger, fontSize: 13 },
});
