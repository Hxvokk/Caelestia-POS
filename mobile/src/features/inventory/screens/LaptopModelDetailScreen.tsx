import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getApiErrorMessage } from "../../../shared/api/client";
import { getLaptopModel, getLaptopUnits } from "../../../shared/api/inventoryApi";
import type { LaptopModel, LaptopUnit } from "../../../shared/api/types";
import { colors, spacing } from "../../../shared/config/theme";
import { ScreenState } from "../../../shared/ui/ScreenState";
import { useSessionStore } from "../../auth/store/sessionStore";
import { MAX_CART_ITEMS, useCartStore } from "../../sales/store/cartStore";
import { formatPrice } from "../../sales/utils/formatPrice";

export function LaptopModelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useSessionStore((state) => state.currentUser);
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const [model, setModel] = useState<LaptopModel | null>(null);
  const [availableUnits, setAvailableUnits] = useState<LaptopUnit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const modelId = Number(id);
  const isValidModelId = Number.isInteger(modelId) && modelId > 0;

  useEffect(() => {
    let active = true;
    if (!isValidModelId) return;

    Promise.all([
      getLaptopModel(modelId),
      getLaptopUnits({ modelId, status: "disponible" }),
    ])
      .then(([modelResult, units]) => {
        if (!active) return;
        setModel(modelResult);
        setAvailableUnits(units);
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
  }, [id, isValidModelId, modelId]);

  if (!isValidModelId) {
    return <ScreenState title="Identificador no válido" description="No se reconoce el modelo solicitado." />;
  }
  if (isLoading) {
    return <ScreenState loading title="Cargando modelo" />;
  }
  if (error || !model) {
    return <ScreenState title="No se pudo abrir el modelo" description={error ?? "Modelo no encontrado."} />;
  }

  const specifications = [
    ["Procesador o chip", model.processorOrChip],
    ["Núcleos de CPU", model.cpuCores],
    ["Hilos de CPU", model.cpuThreads],
    ["RAM", model.ramGb ? `${model.ramGb} GB` : null],
    ["Memoria unificada", model.unifiedMemoryGb ? `${model.unifiedMemoryGb} GB` : null],
    ["Almacenamiento", `${model.storageGb} GB ${model.storageType}`],
    ["GPU", model.gpu],
    ["Tipo de GPU", model.gpuType],
    ["VRAM dedicada", model.gpuVramGb ? `${model.gpuVramGb} GB` : null],
    ["Nivel de CPU", model.cpuLevel],
    ["Nivel de GPU", model.gpuLevel],
    ["SKU", model.sku],
  ] as const;
  const availableCount = availableUnits.length;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.back}>‹ Inventario</Text>
        </Pressable>

        {model.imageUrl ? (
          <Image
            accessibilityLabel={`Imagen de ${model.brandName} ${model.name}`}
            resizeMode="contain"
            source={{ uri: model.imageUrl }}
            style={styles.image}
          />
        ) : null}

        <Text style={styles.brand}>{model.brandName}</Text>
        <Text style={styles.title}>{model.name}</Text>
        <View style={styles.summary}>
          <Text style={styles.price}>{formatPrice(model.price)}</Text>
          <Text style={styles.available}>
            {availableCount} {availableCount === 1 ? "disponible" : "disponibles"}
          </Text>
        </View>

        <View style={styles.specifications}>
          {specifications.map(([label, value]) => (
            <View key={label} style={styles.specRow}>
              <Text style={styles.specLabel}>{label}</Text>
              <Text style={styles.specValue}>{value ?? "Sin especificar"}</Text>
            </View>
          ))}
        </View>

        <View style={styles.specifications}>
          <Text style={styles.unitsTitle}>Unidades físicas disponibles</Text>
          {availableUnits.length > 0 ? (
            availableUnits.map((unit) => {
              const isSelected = cartItems.some((item) => item.unitId === unit.id);
              const cartIsFull = cartItems.length >= MAX_CART_ITEMS && !isSelected;

              return (
                <View key={unit.id} style={styles.availableUnitRow}>
                  <View style={styles.unitInfo}>
                    <Text style={styles.specLabel}>Número de serie</Text>
                    <Text style={styles.serialNumber}>{unit.serialNumber}</Text>
                  </View>
                  <Pressable
                    accessibilityLabel={
                      isSelected
                        ? `Quitar la serie ${unit.serialNumber} del carrito`
                        : `Agregar la serie ${unit.serialNumber} al carrito`
                    }
                    accessibilityRole="button"
                    disabled={cartIsFull}
                    onPress={() => {
                      if (isSelected) {
                        removeItem(unit.id);
                      } else {
                        addItem({
                          unitId: unit.id,
                          modelId: model.id,
                          brandName: model.brandName,
                          modelName: model.name,
                          serialNumber: unit.serialNumber,
                          unitPrice: model.price,
                        });
                      }
                    }}
                    style={[
                      styles.unitAction,
                      isSelected && styles.unitActionSelected,
                      cartIsFull && styles.unitActionDisabled,
                    ]}
                  >
                    <Text style={[styles.unitActionText, isSelected && styles.unitActionSelectedText]}>
                      {isSelected ? "Quitar" : cartIsFull ? "Límite alcanzado" : "Agregar"}
                    </Text>
                  </Pressable>
                </View>
              );
            })
          ) : (
            <Text style={styles.specLabel}>No hay unidades disponibles para este modelo.</Text>
          )}
        </View>

        <Text style={styles.disclaimer}>
          Las especificaciones disponibles no garantizan el rendimiento en software o juegos específicos.
        </Text>
        {model.specificationsSource ? (
          <Text style={styles.source}>Fuente de especificaciones: {model.specificationsSource}</Text>
        ) : null}

        {currentUser?.role === "administrador" ? (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/admin/models/[id]/edit",
                params: { id: String(model.id) },
              })
            }
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Editar modelo</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl },
  back: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  image: { width: "100%", height: 210, borderRadius: 14, backgroundColor: colors.surface },
  brand: { color: colors.muted, fontSize: 13, fontWeight: "700", textTransform: "uppercase" },
  title: { color: colors.text, fontSize: 28, fontWeight: "800" },
  summary: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  price: { color: colors.text, fontSize: 24, fontWeight: "800" },
  available: { color: colors.success, fontSize: 15, fontWeight: "700" },
  specifications: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  specRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  specLabel: { flex: 1, color: colors.muted, fontSize: 14 },
  specValue: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "600", textAlign: "right" },
  unitsTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  availableUnitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  unitInfo: { flex: 1, gap: 3 },
  serialNumber: { color: colors.text, fontSize: 14, fontWeight: "600" },
  unitAction: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: 9,
    backgroundColor: colors.primary,
  },
  unitActionSelected: { backgroundColor: colors.successBackground },
  unitActionDisabled: { opacity: 0.55 },
  unitActionText: { color: colors.surface, fontSize: 12, fontWeight: "700" },
  unitActionSelectedText: { color: colors.success },
  disclaimer: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  source: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  editButton: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: colors.primary },
  editButtonText: { color: colors.surface, fontWeight: "700" },
});
