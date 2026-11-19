import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { z } from "zod";
import { getApiErrorMessage } from "../../../shared/api/client";
import {
  createLaptopModel,
  uploadLaptopModelImage,
  updateLaptopModel,
  type SaveLaptopModelRequest,
} from "../../../shared/api/inventoryAdminApi";
import { getBrands, getLaptopModel } from "../../../shared/api/inventoryApi";
import type { Brand, LaptopModel } from "../../../shared/api/types";
import { colors } from "../../../shared/config/theme";
import {
  AdminCard,
  AdminField,
  AdminGuard,
  AdminHelperText,
  AdminPage,
  AdminPrimaryButton,
} from "../components/AdminAccess";

const positiveInteger = (value: string) =>
  !value.trim() ||
  (/^\d+$/.test(value.trim()) &&
    Number(value) > 0 &&
    Number(value) <= 2_147_483_647);
const positiveDecimal = (value: string) =>
  /^\d+(\.\d{1,2})?$/.test(value.trim()) &&
  Number(value) > 0 &&
  Number(value) <= 9_999_999_999.99;
const positiveVram = (value: string) =>
  !value.trim() ||
  (/^\d+(\.\d{1,2})?$/.test(value.trim()) &&
    Number(value) > 0 &&
    Number(value) <= 9_999.99);
const validOptionalUrl = (value: string) => {
  if (!value.trim()) return true;
  return /^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(value.trim());
};
const validOptionalDate = (value: string) => {
  if (!value.trim()) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsedDate = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
};

const modelFormSchema = z.object({
  brandId: z.string().min(1, "Selecciona una marca."),
  sku: z.string().max(120, "El SKU no puede superar 120 caracteres."),
  name: z.string().trim().min(1, "Escribe el nombre del modelo.").max(120),
  processorOrChip: z.string().trim().min(1, "Escribe el procesador o chip.").max(150),
  cpuCores: z.string().refine(positiveInteger, "Usa un entero positivo o deja el campo vacío."),
  cpuThreads: z.string().refine(positiveInteger, "Usa un entero positivo o deja el campo vacío."),
  unifiedMemoryGb: z.string().refine(positiveInteger, "Usa un entero positivo o deja el campo vacío."),
  ramGb: z.string().refine(positiveInteger, "Usa un entero positivo o deja el campo vacío."),
  storageGb: z.string().refine(positiveInteger, "El almacenamiento debe ser un entero positivo."),
  storageType: z.string().trim().min(1, "Escribe el tipo de almacenamiento.").max(20),
  gpu: z.string().max(150),
  gpuType: z.enum(["", "integrada", "dedicada", "híbrida"]),
  gpuVramGb: z.string().refine(positiveVram, "Usa un valor positivo con hasta dos decimales o deja vacío."),
  cpuLevel: z.enum(["", "básico", "medio", "alto"]),
  gpuLevel: z.enum(["", "básico", "medio", "alto"]),
  price: z.string().refine(positiveDecimal, "El precio debe ser positivo y tener hasta dos decimales."),
  priceSourceUrl: z.string().refine(validOptionalUrl, "Escribe una URL HTTP o HTTPS válida."),
  priceCheckedOn: z.string().refine(validOptionalDate, "Usa el formato de fecha AAAA-MM-DD."),
  specificationsSource: z.string(),
});

type ModelFormValues = z.infer<typeof modelFormSchema>;

const emptyValues: ModelFormValues = {
  brandId: "",
  sku: "",
  name: "",
  processorOrChip: "",
  cpuCores: "",
  cpuThreads: "",
  unifiedMemoryGb: "",
  ramGb: "",
  storageGb: "",
  storageType: "SSD",
  gpu: "",
  gpuType: "",
  gpuVramGb: "",
  cpuLevel: "",
  gpuLevel: "",
  price: "",
  priceSourceUrl: "",
  priceCheckedOn: "",
  specificationsSource: "",
};

function optionalNumber(value: string): number | null {
  return value.trim() ? Number(value) : null;
}

function modelToFormValues(model: LaptopModel): ModelFormValues {
  return {
    brandId: String(model.brandId),
    sku: model.sku ?? "",
    name: model.name,
    processorOrChip: model.processorOrChip,
    cpuCores: model.cpuCores === null ? "" : String(model.cpuCores),
    cpuThreads: model.cpuThreads === null ? "" : String(model.cpuThreads),
    unifiedMemoryGb: model.unifiedMemoryGb === null ? "" : String(model.unifiedMemoryGb),
    ramGb: model.ramGb === null ? "" : String(model.ramGb),
    storageGb: String(model.storageGb),
    storageType: model.storageType,
    gpu: model.gpu ?? "",
    gpuType: model.gpuType === null ? "" : model.gpuType as ModelFormValues["gpuType"],
    gpuVramGb: model.gpuVramGb === null ? "" : String(model.gpuVramGb),
    cpuLevel: model.cpuLevel === null ? "" : model.cpuLevel as ModelFormValues["cpuLevel"],
    gpuLevel: model.gpuLevel === null ? "" : model.gpuLevel as ModelFormValues["gpuLevel"],
    price: String(model.price),
    priceSourceUrl: model.priceSourceUrl ?? "",
    priceCheckedOn: model.priceCheckedOn ?? "",
    specificationsSource: model.specificationsSource ?? "",
  };
}

export function LaptopModelFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const modelId = id ? Number(id) : null;
  const [brands, setBrands] = useState<Brand[]>([]);
  const [model, setModel] = useState<LaptopModel | null>(null);
  const [persistedModelId, setPersistedModelId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
    fileSize?: number;
  } | null>(null);
  const [values, setValues] = useState<ModelFormValues>(emptyValues);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(modelId));
  const [isSaving, setIsSaving] = useState(false);
  const effectiveModelId = modelId ?? persistedModelId;
  const isEditing = effectiveModelId !== null;

  const pickModelImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.85,
        exif: false,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      const mimeType = asset.mimeType;
      if (mimeType !== "image/jpeg" && mimeType !== "image/png" && mimeType !== "image/webp") {
        setValidationMessage("Elige una imagen JPEG, PNG o WebP.");
        return;
      }
      if (asset.fileSize !== undefined && asset.fileSize > 5 * 1024 * 1024) {
        setValidationMessage("La imagen no puede superar 5 MB.");
        return;
      }

      setSelectedImage({ uri: asset.uri, mimeType, fileSize: asset.fileSize });
      setValidationMessage(null);
    } catch (pickerError) {
      setValidationMessage(getApiErrorMessage(pickerError));
    }
  };

  useEffect(() => {
    let active = true;
    const requests: [Promise<Brand[]>, Promise<LaptopModel | null>] = [
      getBrands(),
      modelId ? getLaptopModel(modelId) : Promise.resolve(null),
    ];
    Promise.all(requests)
      .then(([nextBrands, nextModel]) => {
        if (!active) return;
        setBrands(nextBrands);
        if (nextModel) {
          setModel(nextModel);
          setValues(modelToFormValues(nextModel));
        }
        setValidationMessage(null);
      })
      .catch((loadError: unknown) => {
        if (active) setValidationMessage(getApiErrorMessage(loadError));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [modelId]);

  const errors = useMemo(() => {
    const result = modelFormSchema.safeParse(values);
    return result.success ? {} : Object.fromEntries(
      result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
    ) as Record<string, string>;
  }, [values]);

  const setField = <K extends keyof ModelFormValues>(key: K, value: ModelFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    const result = modelFormSchema.safeParse(values);
    if (!result.success) {
      setValidationMessage(result.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      return;
    }

    const form = result.data;
    const request: SaveLaptopModelRequest = {
      brandId: Number(form.brandId),
      sku: form.sku.trim() || null,
      name: form.name,
      processorOrChip: form.processorOrChip,
      cpuCores: optionalNumber(form.cpuCores),
      cpuThreads: optionalNumber(form.cpuThreads),
      unifiedMemoryGb: optionalNumber(form.unifiedMemoryGb),
      ramGb: optionalNumber(form.ramGb),
      storageGb: Number(form.storageGb),
      storageType: form.storageType,
      gpu: form.gpu.trim() || null,
      gpuType: form.gpuType || null,
      gpuVramGb: optionalNumber(form.gpuVramGb),
      cpuLevel: form.cpuLevel || null,
      gpuLevel: form.gpuLevel || null,
      price: Number(form.price),
      priceSourceUrl: form.priceSourceUrl.trim() || null,
      priceCheckedOn: form.priceCheckedOn.trim() || null,
      specificationsSource: form.specificationsSource.trim() || null,
      imageUrl: model?.imageUrl ?? null,
      imageSourceUrl: model?.imageSourceUrl ?? null,
      imageTermsUrl: model?.imageTermsUrl ?? null,
      imageRightsStatus: model?.imageRightsStatus ?? "no_confirmado",
    };

    setIsSaving(true);
    setValidationMessage(null);
    try {
      let savedModelId = effectiveModelId;
      if (savedModelId !== null) {
        await updateLaptopModel(savedModelId, request);
      } else {
        const createdModel = await createLaptopModel(request);
        savedModelId = createdModel.id;
        setPersistedModelId(createdModel.id);
        setModel(createdModel);
      }

      if (selectedImage) {
        const imageResponse = await uploadLaptopModelImage(savedModelId, selectedImage);
        setModel((current) => current
          ? {
              ...current,
              imageUrl: imageResponse.imageUrl,
              imageRightsStatus: imageResponse.imageRightsStatus,
            }
          : current);
        setSelectedImage(null);
      }
      router.replace("/admin/models");
    } catch (saveError) {
      setValidationMessage(getApiErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminGuard>
      <AdminPage title={isEditing ? "Editar modelo" : "Registrar modelo"}>
        {isLoading ? <AdminHelperText>Cargando información…</AdminHelperText> : null}
        {validationMessage ? (
          <Text accessibilityRole="alert" style={{ color: colors.danger }}>
            {validationMessage}
          </Text>
        ) : null}

        <AdminCard>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>Imagen del modelo</Text>
          <AdminHelperText>
            Adjunta una imagen JPEG, PNG o WebP de hasta 5 MB. La imagen debe tener permiso de uso;
            su estado de derechos permanecerá sin confirmar hasta registrarlo.
          </AdminHelperText>
          {selectedImage ? (
            <Image
              source={{ uri: selectedImage.uri }}
              style={{ width: 180, height: 135, borderRadius: 10 }}
            />
          ) : model?.imageUrl ? (
            <Image
              source={{ uri: model.imageUrl }}
              style={{ width: 180, height: 135, borderRadius: 10 }}
            />
          ) : (
            <AdminHelperText>No hay una imagen adjunta.</AdminHelperText>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => void pickModelImage()}
            style={{
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.primary,
              borderRadius: 9,
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: "700" }}>
              {selectedImage ? "Cambiar imagen seleccionada" : "Seleccionar imagen"}
            </Text>
          </Pressable>
          {selectedImage ? (
            <AdminHelperText>La imagen se subirá al guardar el modelo.</AdminHelperText>
          ) : null}
        </AdminCard>

        <AdminCard>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>Marca</Text>
          <View style={{ gap: 8 }}>
            {brands.map((brand) => {
              const selected = values.brandId === String(brand.id);
              return (
                <Pressable
                  key={brand.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setField("brandId", String(brand.id))}
                  style={{
                    padding: 12,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border,
                    borderRadius: 9,
                    backgroundColor: selected ? colors.successBackground : colors.surface,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: selected ? "700" : "400" }}>{brand.name}</Text>
                </Pressable>
              );
            })}
          </View>
          {errors.brandId ? <Text style={{ color: colors.danger }}>{errors.brandId}</Text> : null}
          {brands.length === 0 ? (
            <AdminHelperText>Registra una marca antes de crear un modelo.</AdminHelperText>
          ) : null}
        </AdminCard>

        <AdminField label="Nombre del modelo" value={values.name} onChangeText={(value) => setField("name", value)} />
        {errors.name ? <Text style={{ color: colors.danger }}>{errors.name}</Text> : null}
        <AdminField label="SKU (opcional)" value={values.sku} onChangeText={(value) => setField("sku", value)} />
        <AdminField label="Procesador o chip" value={values.processorOrChip} onChangeText={(value) => setField("processorOrChip", value)} />
        {errors.processorOrChip ? <Text style={{ color: colors.danger }}>{errors.processorOrChip}</Text> : null}

        <AdminCard>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>Procesador y memoria</Text>
          <AdminField label="Núcleos de CPU (opcional)" keyboardType="number-pad" value={values.cpuCores} onChangeText={(value) => setField("cpuCores", value)} />
          {errors.cpuCores ? <Text style={{ color: colors.danger }}>{errors.cpuCores}</Text> : null}
          <AdminField label="Hilos de CPU (opcional)" keyboardType="number-pad" value={values.cpuThreads} onChangeText={(value) => setField("cpuThreads", value)} />
          {errors.cpuThreads ? <Text style={{ color: colors.danger }}>{errors.cpuThreads}</Text> : null}
          <AdminField label="RAM en GB (opcional)" keyboardType="number-pad" value={values.ramGb} onChangeText={(value) => setField("ramGb", value)} />
          {errors.ramGb ? <Text style={{ color: colors.danger }}>{errors.ramGb}</Text> : null}
          <AdminField label="Memoria unificada en GB (opcional)" keyboardType="number-pad" value={values.unifiedMemoryGb} onChangeText={(value) => setField("unifiedMemoryGb", value)} />
          {errors.unifiedMemoryGb ? <Text style={{ color: colors.danger }}>{errors.unifiedMemoryGb}</Text> : null}
        </AdminCard>

        <AdminCard>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>Almacenamiento y gráficos</Text>
          <AdminField label="Almacenamiento en GB" keyboardType="number-pad" value={values.storageGb} onChangeText={(value) => setField("storageGb", value)} />
          {errors.storageGb ? <Text style={{ color: colors.danger }}>{errors.storageGb}</Text> : null}
          <AdminField label="Tipo de almacenamiento" placeholder="SSD" value={values.storageType} onChangeText={(value) => setField("storageType", value)} />
          {errors.storageType ? <Text style={{ color: colors.danger }}>{errors.storageType}</Text> : null}
          <AdminField label="GPU (opcional)" value={values.gpu} onChangeText={(value) => setField("gpu", value)} />
          <Text style={{ color: colors.muted, fontSize: 12 }}>Tipo de GPU</Text>
          <OptionRow
            values={["", "integrada", "dedicada", "híbrida"]}
            selected={values.gpuType}
            onSelect={(value) => setField("gpuType", value as ModelFormValues["gpuType"])}
          />
          <AdminField label="VRAM dedicada en GB (opcional)" keyboardType="decimal-pad" value={values.gpuVramGb} onChangeText={(value) => setField("gpuVramGb", value)} />
          {errors.gpuVramGb ? <Text style={{ color: colors.danger }}>{errors.gpuVramGb}</Text> : null}
          <AdminHelperText>No registres memoria unificada como VRAM dedicada.</AdminHelperText>
        </AdminCard>

        <AdminCard>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>Precio y fuentes</Text>
          <AdminField label="Precio en MXN" keyboardType="decimal-pad" value={values.price} onChangeText={(value) => setField("price", value)} />
          {errors.price ? <Text style={{ color: colors.danger }}>{errors.price}</Text> : null}
          <AdminField label="URL de la fuente del precio (opcional)" keyboardType="url" value={values.priceSourceUrl} onChangeText={(value) => setField("priceSourceUrl", value)} />
          {errors.priceSourceUrl ? <Text style={{ color: colors.danger }}>{errors.priceSourceUrl}</Text> : null}
          <AdminField label="Fecha de consulta (AAAA-MM-DD, opcional)" value={values.priceCheckedOn} onChangeText={(value) => setField("priceCheckedOn", value)} />
          {errors.priceCheckedOn ? <Text style={{ color: colors.danger }}>{errors.priceCheckedOn}</Text> : null}
          <AdminField label="Fuente de especificaciones (opcional)" multiline value={values.specificationsSource} onChangeText={(value) => setField("specificationsSource", value)} />
        </AdminCard>

        <AdminCard>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>Niveles de referencia (opcionales)</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Son referencias generales, no promesas de rendimiento.</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Nivel de CPU</Text>
          <OptionRow values={["", "básico", "medio", "alto"]} selected={values.cpuLevel} onSelect={(value) => setField("cpuLevel", value as ModelFormValues["cpuLevel"])} />
          <Text style={{ color: colors.muted, fontSize: 12 }}>Nivel de GPU</Text>
          <OptionRow values={["", "básico", "medio", "alto"]} selected={values.gpuLevel} onSelect={(value) => setField("gpuLevel", value as ModelFormValues["gpuLevel"])} />
        </AdminCard>

        <AdminCard>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>Fotografía</Text>
          <AdminHelperText>
            La selección de archivo se añadirá cuando se definan formato, límite y almacenamiento de imágenes, como indica el plan.
          </AdminHelperText>
        </AdminCard>

        <AdminPrimaryButton
          disabled={isSaving || isLoading || brands.length === 0}
          label={isSaving ? "Guardando…" : "Guardar modelo"}
          onPress={() => void save()}
        />
      </AdminPage>
    </AdminGuard>
  );
}

function OptionRow({
  values,
  selected,
  onSelect,
}: {
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {values.map((value) => {
        const isSelected = value === selected;
        return (
          <Pressable
            key={value || "none"}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(value)}
            style={{
              paddingHorizontal: 11,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: isSelected ? colors.primary : colors.border,
              borderRadius: 20,
              backgroundColor: isSelected ? colors.successBackground : colors.surface,
            }}
          >
            <Text style={{ color: colors.text }}>
              {value || "Sin especificar"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
