import { useCallback, useEffect, useState } from "react";
import { Alert, Text } from "react-native";
import { router } from "expo-router";
import { deleteLaptopModel } from "../../../shared/api/inventoryAdminApi";
import { getApiErrorMessage } from "../../../shared/api/client";
import { getLaptopModels } from "../../../shared/api/inventoryApi";
import type { LaptopModel } from "../../../shared/api/types";
import { colors } from "../../../shared/config/theme";
import { AdminCard, AdminGuard, AdminHelperText, AdminPage, AdminPrimaryButton, AdminSecondaryButton } from "../components/AdminAccess";

export function ModelsAdminScreen() {
  const [models, setModels] = useState<LaptopModel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadModels = useCallback(async () => {
    setIsLoading(true);
    try {
      setModels(await getLaptopModels());
      setError(null);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadModels);
  }, [loadModels]);

  const confirmDelete = (model: LaptopModel) => {
    Alert.alert(
      "Eliminar modelo",
      `¿Eliminar ${model.brandName} ${model.name}? Solo se permite si no tiene unidades asociadas.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            void deleteLaptopModel(model.id)
              .then(loadModels)
              .catch((deleteError: unknown) => setError(getApiErrorMessage(deleteError)));
          },
        },
      ],
    );
  };

  return (
    <AdminGuard>
      <AdminPage title="Modelos">
        <AdminPrimaryButton
          label="Registrar modelo"
          onPress={() => router.push("/admin/models/new")}
        />
        <AdminHelperText>
          La API impide eliminar modelos que tengan unidades físicas asociadas.
        </AdminHelperText>
        {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
        {isLoading ? <AdminHelperText>Cargando modelos…</AdminHelperText> : null}
        {models.map((model) => (
          <AdminCard key={model.id}>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>{model.brandName}</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>{model.name}</Text>
            <Text style={{ color: colors.muted }}>{model.processorOrChip} · {model.storageGb} GB {model.storageType}</Text>
            <AdminSecondaryButton
              label="Editar modelo"
              onPress={() =>
                router.push({
                  pathname: "/admin/models/[id]/edit",
                  params: { id: String(model.id) },
                })
              }
            />
            <AdminSecondaryButton label="Eliminar modelo" onPress={() => confirmDelete(model)} />
          </AdminCard>
        ))}
      </AdminPage>
    </AdminGuard>
  );
}
