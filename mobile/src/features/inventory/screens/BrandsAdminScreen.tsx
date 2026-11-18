import { useCallback, useEffect, useState } from "react";
import { Alert, Text } from "react-native";
import {
  createBrand,
  deleteBrand,
  updateBrand,
} from "../../../shared/api/inventoryAdminApi";
import { getBrands } from "../../../shared/api/inventoryApi";
import { getApiErrorMessage } from "../../../shared/api/client";
import type { Brand } from "../../../shared/api/types";
import { AdminCard, AdminField, AdminGuard, AdminPage, AdminPrimaryButton, AdminSecondaryButton, AdminHelperText } from "../components/AdminAccess";

export function BrandsAdminScreen() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadBrands = useCallback(async () => {
    setIsLoading(true);
    try {
      setBrands(await getBrands());
      setError(null);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadBrands);
  }, [loadBrands]);

  const resetForm = () => {
    setSelectedBrand(null);
    setName("");
    setError(null);
  };

  const save = async () => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      setError("Escribe el nombre de la marca.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      if (selectedBrand) {
        await updateBrand(selectedBrand.id, { name: normalizedName });
      } else {
        await createBrand({ name: normalizedName });
      }
      resetForm();
      await loadBrands();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (brand: Brand) => {
    Alert.alert(
      "Eliminar marca",
      `¿Eliminar ${brand.name}? Solo se permite si no tiene modelos asociados.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            void deleteBrand(brand.id)
              .then(loadBrands)
              .catch((deleteError: unknown) => {
                setError(getApiErrorMessage(deleteError));
              });
          },
        },
      ],
    );
  };

  return (
    <AdminGuard>
      <AdminPage title="Marcas">
        <AdminCard>
          <Text>{selectedBrand ? `Editar: ${selectedBrand.name}` : "Registrar marca"}</Text>
          <AdminField
            label="Nombre"
            onChangeText={setName}
            placeholder="Nombre de la marca"
            value={name}
          />
          {error ? <Text accessibilityRole="alert" style={{ color: "#B42318" }}>{error}</Text> : null}
          <AdminPrimaryButton
            disabled={isSaving}
            label={isSaving ? "Guardando…" : selectedBrand ? "Guardar cambios" : "Registrar marca"}
            onPress={() => void save()}
          />
          {selectedBrand ? (
            <AdminSecondaryButton label="Cancelar edición" onPress={resetForm} />
          ) : null}
        </AdminCard>
        <AdminHelperText>
          Una marca solo puede eliminarse cuando no tiene modelos asociados.
        </AdminHelperText>
        {isLoading ? <AdminHelperText>Cargando marcas…</AdminHelperText> : null}
        {brands.map((brand) => (
          <AdminCard key={brand.id}>
            <Text style={{ fontSize: 16, fontWeight: "700" }}>{brand.name}</Text>
            <AdminSecondaryButton
              label="Editar"
              onPress={() => {
                setSelectedBrand(brand);
                setName(brand.name);
                setError(null);
              }}
            />
            <AdminSecondaryButton label="Eliminar" onPress={() => confirmDelete(brand)} />
          </AdminCard>
        ))}
      </AdminPage>
    </AdminGuard>
  );
}
