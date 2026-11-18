import { useCallback, useEffect, useState } from "react";
import { Alert, Text } from "react-native";
import { router } from "expo-router";
import { deleteLaptopUnit } from "../../../shared/api/inventoryAdminApi";
import { getApiErrorMessage } from "../../../shared/api/client";
import { getLaptopUnits } from "../../../shared/api/inventoryApi";
import type { LaptopUnit } from "../../../shared/api/types";
import { colors } from "../../../shared/config/theme";
import { AdminCard, AdminGuard, AdminHelperText, AdminPage, AdminPrimaryButton, AdminSecondaryButton } from "../components/AdminAccess";

export function UnitsAdminScreen() {
  const [units, setUnits] = useState<LaptopUnit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUnits = useCallback(async () => {
    setIsLoading(true);
    try {
      setUnits(await getLaptopUnits());
      setError(null);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadUnits);
  }, [loadUnits]);

  const confirmDelete = (unit: LaptopUnit) => {
    Alert.alert(
      "Eliminar unidad",
      `¿Eliminar la unidad ${unit.serialNumber}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            void deleteLaptopUnit(unit.id)
              .then(loadUnits)
              .catch((deleteError: unknown) => setError(getApiErrorMessage(deleteError)));
          },
        },
      ],
    );
  };

  return (
    <AdminGuard>
      <AdminPage title="Unidades físicas">
        <AdminPrimaryButton
          label="Registrar unidad"
          onPress={() => router.push("/admin/units/new")}
        />
        <AdminHelperText>
          Las unidades vendidas o con historial no se pueden editar ni eliminar.
        </AdminHelperText>
        {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
        {isLoading ? <AdminHelperText>Cargando unidades…</AdminHelperText> : null}
        {units.map((unit) => (
          <AdminCard key={unit.id}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>{unit.brandName} {unit.modelName}</Text>
            <Text style={{ color: colors.muted }}>Serie: {unit.serialNumber}</Text>
            <Text style={{ color: unit.status === "disponible" ? colors.success : colors.muted, fontWeight: "700" }}>
              {unit.status === "disponible" ? "Disponible" : "Vendida"}
            </Text>
            {unit.status === "disponible" ? (
              <>
                <AdminSecondaryButton
                  label="Editar unidad"
                  onPress={() =>
                    router.push({
                      pathname: "/admin/units/[id]/edit",
                      params: { id: String(unit.id) },
                    })
                  }
                />
                <AdminSecondaryButton label="Eliminar unidad" onPress={() => confirmDelete(unit)} />
              </>
            ) : (
              <AdminHelperText>El historial de venta protege esta unidad.</AdminHelperText>
            )}
          </AdminCard>
        ))}
      </AdminPage>
    </AdminGuard>
  );
}
