import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { z } from "zod";
import { getApiErrorMessage } from "../../../shared/api/client";
import {
  createLaptopUnit,
  updateLaptopUnit,
} from "../../../shared/api/inventoryAdminApi";
import { getLaptopModels, getLaptopUnit } from "../../../shared/api/inventoryApi";
import type { LaptopModel, LaptopUnit } from "../../../shared/api/types";
import { colors } from "../../../shared/config/theme";
import {
  AdminCard,
  AdminField,
  AdminGuard,
  AdminHelperText,
  AdminPage,
  AdminPrimaryButton,
} from "../components/AdminAccess";

const unitFormSchema = z.object({
  modelId: z.string().min(1, "Selecciona un modelo."),
  serialNumber: z.string().trim().min(1, "Escribe el número de serie.").max(100),
});

export function LaptopUnitFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const unitId = id ? Number(id) : null;
  const [models, setModels] = useState<LaptopModel[]>([]);
  const [unit, setUnit] = useState<LaptopUnit | null>(null);
  const [modelId, setModelId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(unitId));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const unitRequest = unitId ? getLaptopUnit(unitId) : Promise.resolve(null);
    Promise.all([getLaptopModels(), unitRequest])
      .then(([nextModels, nextUnit]) => {
        if (!active) return;
        setModels(nextModels);
        if (nextUnit) {
          setUnit(nextUnit);
          setModelId(String(nextUnit.modelId));
          setSerialNumber(nextUnit.serialNumber);
        }
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (active) setError(getApiErrorMessage(loadError));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [unitId]);

  const save = async () => {
    const parsed = unitFormSchema.safeParse({ modelId, serialNumber });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const request = {
        modelId: Number(parsed.data.modelId),
        serialNumber: parsed.data.serialNumber,
      };
      if (unitId) await updateLaptopUnit(unitId, request);
      else await createLaptopUnit(request);
      router.replace("/admin/units");
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminGuard>
      <AdminPage title={unitId ? "Editar unidad" : "Registrar unidad física"}>
        <AdminHelperText>
          El número de serie debe pertenecer a un equipo físico real y ser único.
        </AdminHelperText>
        {isLoading ? <AdminHelperText>Cargando información…</AdminHelperText> : null}
        {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
        <AdminCard>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>Modelo</Text>
          {models.map((model) => {
            const selected = modelId === String(model.id);
            return (
              <Pressable
                key={model.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setModelId(String(model.id))}
                style={{
                  padding: 12,
                  borderWidth: 1,
                  borderColor: selected ? colors.primary : colors.border,
                  borderRadius: 9,
                  backgroundColor: selected ? colors.successBackground : colors.surface,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: selected ? "700" : "400" }}>
                  {model.brandName} · {model.name}
                </Text>
              </Pressable>
            );
          })}
          {models.length === 0 ? (
            <AdminHelperText>Registra un modelo antes de crear una unidad física.</AdminHelperText>
          ) : null}
        </AdminCard>
        <AdminField
          label="Número de serie"
          onChangeText={setSerialNumber}
          placeholder="Número indicado en el equipo"
          value={serialNumber}
        />
        <AdminPrimaryButton
          disabled={isSaving || isLoading || models.length === 0}
          label={isSaving ? "Guardando…" : "Guardar unidad"}
          onPress={() => void save()}
        />
        {unit?.status === "vendida" ? (
          <View>
            <AdminHelperText>Esta unidad ya está vendida; la API rechazará cualquier modificación.</AdminHelperText>
          </View>
        ) : null}
      </AdminPage>
    </AdminGuard>
  );
}
