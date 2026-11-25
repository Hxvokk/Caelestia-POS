import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { getApiErrorMessage } from "../../../shared/api/client";
import { getDashboardMetrics } from "../../../shared/api/inventoryApi";
import type { DashboardMetrics } from "../../../shared/api/inventoryApi";
import { colors, spacing } from "../../../shared/config/theme";
import {
  HomeActionCard,
  HomeErrorState,
  HomeFrame,
  HomeMetricCard,
  HomeSectionTitle,
  HomeSkeleton,
} from "../components/HomeDashboardUI";
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
  actionLabel?: string;
  onPress?: () => void;
};

function MetricCard({
  title,
  value,
  description,
  actionLabel,
  onPress,
}: MetricCardProps) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDescription}>{description}</Text>
      {actionLabel && onPress ? (
        <Pressable accessibilityRole="button" onPress={onPress} style={styles.metricAction}>
          <Text style={styles.metricActionText}>{actionLabel} ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function DashboardScreen({ asHome = false }: { asHome?: boolean } = {}) {
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

  if (asHome) {
    return (
      <AdminGuard>
        <HomeFrame promoState="hidden">
          {metrics ? (
            <>
              <HomeSectionTitle>Resumen del negocio</HomeSectionTitle>
              <View style={styles.metricRow}>
                <HomeMetricCard
                  title="Ventas acumuladas"
                  value={formatPrice(metrics.completedSalesTotal)}
                  description="Ventas completadas"
                  icon="cart-outline"
                  tone="blue"
                />
                <HomeMetricCard
                  title="Unidades vendidas"
                  value={String(metrics.soldUnits)}
                  description="Equipos vendidos"
                  icon="bag-check-outline"
                  tone="indigo"
                />
              </View>
              <View style={styles.metricRow}>
                <HomeMetricCard
                  title="Unidades disponibles"
                  value={String(metrics.availableUnits)}
                  description="Disponibles para venta"
                  icon="laptop-outline"
                  tone="green"
                />
                <HomeMetricCard
                  title="Modelos registrados"
                  value={String(metrics.registeredModels)}
                  description="En el catálogo"
                  icon="layers-outline"
                  tone="teal"
                />
              </View>
              <HomeActionCard
                icon="settings-outline"
                title="Administración"
                description="Gestiona marcas, modelos, unidades y vendedores"
                onPress={() => router.push("/admin")}
                style={styles.adminAction}
              />
            </>
          ) : isLoading ? (
            <HomeSkeleton>
              <HomeSectionTitle>Resumen del negocio</HomeSectionTitle>
            </HomeSkeleton>
          ) : (
            <HomeErrorState
              message={error ?? "Ocurrió un error al obtener el resumen del negocio."}
              onRetry={() => void loadMetrics()}
            />
          )}
        </HomeFrame>
      </AdminGuard>
    );
  }

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
  metricRow: { flexDirection: "row", gap: spacing.md },
  adminAction: { marginTop: spacing.sm },
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
