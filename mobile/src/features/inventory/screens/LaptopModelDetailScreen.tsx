import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { getApiErrorMessage } from "../../../shared/api/client";
import { getLaptopModel, getLaptopUnits } from "../../../shared/api/inventoryApi";
import type { LaptopModel, LaptopUnit } from "../../../shared/api/types";
import { colors, spacing } from "../../../shared/config/theme";
import { useSessionStore } from "../../auth/store/sessionStore";
import { MAX_CART_ITEMS, useCartStore } from "../../sales/store/cartStore";
import { formatPrice } from "../../sales/utils/formatPrice";
import { BrandHeader, HomeErrorState } from "../components/HomeDashboardUI";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function memoryLabel(model: LaptopModel): string | null {
  if (model.ramGb) return `${model.ramGb} GB RAM`;
  if (model.unifiedMemoryGb) return `${model.unifiedMemoryGb} GB unificada`;
  return null;
}

function graphicsLabel(model: LaptopModel): string | null {
  if (!model.gpu) return null;
  return model.gpuVramGb ? `${model.gpu} · ${model.gpuVramGb} GB` : model.gpu;
}

function coresLabel(model: LaptopModel): string | null {
  const parts = [
    model.cpuCores ? `${model.cpuCores} núcleos` : null,
    model.cpuThreads ? `${model.cpuThreads} hilos` : null,
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function levelLabel(model: LaptopModel): string | null {
  const parts = [
    model.cpuLevel ? `CPU ${model.cpuLevel}` : null,
    model.gpuLevel ? `GPU ${model.gpuLevel}` : null,
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function LaptopModelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const currentUser = useSessionStore((state) => state.currentUser);
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const [model, setModel] = useState<LaptopModel | null>(null);
  const [availableUnits, setAvailableUnits] = useState<LaptopUnit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
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
  }, [isValidModelId, modelId, reloadKey]);

  const reload = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((key) => key + 1);
  };

  const cartUnitIds = useMemo(
    () => new Set(cartItems.map((item) => item.unitId)),
    [cartItems],
  );
  const addableUnits = availableUnits.filter((unit) => !cartUnitIds.has(unit.id));
  const cartIsFull = cartItems.length >= MAX_CART_ITEMS;
  const maxQuantity = Math.max(
    0,
    Math.min(addableUnits.length, MAX_CART_ITEMS - cartItems.length),
  );
  const selectedQuantity = Math.min(Math.max(quantity, 1), Math.max(maxQuantity, 1));
  const inStock = availableUnits.length > 0;
  const canAdd = maxQuantity > 0;

  const addToCart = () => {
    if (!model || !canAdd) return;
    const units = addableUnits.slice(0, selectedQuantity);
    for (const unit of units) {
      addItem({
        unitId: unit.id,
        modelId: model.id,
        brandName: model.brandName,
        modelName: model.name,
        serialNumber: unit.serialNumber,
        unitPrice: model.price,
        imageUrl: model.imageUrl,
      });
    }
    setJustAdded(units.length);
    setQuantity(1);
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/inventory"));

  const renderBody = () => {
    if (!isValidModelId) {
      return (
        <HomeErrorState
          message="No se reconoce el modelo solicitado."
          onRetry={goBack}
          title="Identificador no válido"
        />
      );
    }
    if (isLoading && !model) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Cargando modelo…</Text>
        </View>
      );
    }
    if (error || !model) {
      return (
        <HomeErrorState
          message={error ?? "Modelo no encontrado."}
          onRetry={reload}
          title="No se pudo abrir el modelo"
        />
      );
    }

    const tiles: { icon: IconName; label: string; value: string | null }[] = [
      { icon: "hardware-chip-outline", label: "Procesador", value: model.processorOrChip },
      { icon: "albums-outline", label: "Memoria", value: memoryLabel(model) },
      {
        icon: "server-outline",
        label: "Almacenamiento",
        value: `${model.storageGb} GB ${model.storageType}`,
      },
      { icon: "game-controller-outline", label: "Gráficos", value: graphicsLabel(model) },
      { icon: "git-network-outline", label: "Núcleos e hilos", value: coresLabel(model) },
      { icon: "speedometer-outline", label: "Rendimiento", value: levelLabel(model) },
    ];

    return (
      <>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.imageArea}>
            {model.imageUrl ? (
              <Image
                accessibilityLabel={`Imagen de ${model.brandName} ${model.name}`}
                resizeMode="contain"
                source={{ uri: model.imageUrl }}
                style={styles.image}
              />
            ) : (
              <View style={styles.noImage}>
                <Ionicons name="laptop-outline" size={64} color={colors.muted} />
                <Text style={styles.noImageText}>Sin imagen disponible</Text>
              </View>
            )}
          </View>

          <View style={styles.identity}>
            <Text style={styles.brand}>{model.brandName}</Text>
            <Text style={styles.title}>{model.name}</Text>
            {model.sku ? (
              <View style={styles.skuChip}>
                <Text style={styles.skuText}>SKU: {model.sku}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>Especificaciones</Text>
          <View style={styles.specGrid}>
            {tiles.map((tile) => (
              <View key={tile.label} style={styles.specTile}>
                <Ionicons name={tile.icon} size={22} color={colors.primary} />
                <View style={styles.specCopy}>
                  <Text style={styles.specLabel}>{tile.label}</Text>
                  <Text style={styles.specValue}>{tile.value ?? "Sin especificar"}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.priceCard}>
            <View style={styles.pricePart}>
              <Text style={styles.priceLabel}>Precio</Text>
              <Text adjustsFontSizeToFit numberOfLines={1} style={styles.price}>
                {formatPrice(model.price)}
              </Text>
            </View>
            <View style={styles.availabilityPart}>
              <Text style={styles.priceLabel}>Disponibilidad</Text>
              <View style={[styles.availabilityChip, !inStock && styles.availabilityChipOut]}>
                <Ionicons
                  name={inStock ? "checkmark-circle" : "close-circle"}
                  size={17}
                  color={inStock ? colors.success : colors.danger}
                />
                <Text
                  style={[styles.availabilityText, !inStock && styles.availabilityTextOut]}
                >
                  {inStock
                    ? `Disponible · ${availableUnits.length} ${availableUnits.length === 1 ? "unidad" : "unidades"}`
                    : "No disponible"}
                </Text>
              </View>
            </View>
          </View>

          {inStock ? (
            <View style={styles.unitsCard}>
              <Text style={styles.unitsTitle}>Unidades disponibles</Text>
              {availableUnits.map((unit) => (
                <View key={unit.id} style={styles.unitRow}>
                  <Text style={styles.unitSerial}>{unit.serialNumber}</Text>
                  {cartUnitIds.has(unit.id) ? (
                    <Text style={styles.unitInCart}>En el carrito</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          <Text style={styles.disclaimer}>
            Las especificaciones disponibles no garantizan el rendimiento en software o juegos
            específicos.
          </Text>
          {model.specificationsSource ? (
            <Text style={styles.source}>
              Fuente de especificaciones: {model.specificationsSource}
            </Text>
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
              <Ionicons name="create-outline" size={19} color={colors.primary} />
              <Text style={styles.editButtonText}>Editar modelo</Text>
            </Pressable>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Cantidad</Text>
            <View style={[styles.stepper, !canAdd && styles.stepperDisabled]}>
              <Pressable
                accessibilityLabel="Disminuir cantidad"
                accessibilityRole="button"
                disabled={!canAdd || selectedQuantity <= 1}
                onPress={() => setQuantity(selectedQuantity - 1)}
                style={styles.stepButton}
              >
                <Ionicons name="remove" size={22} color={colors.primary} />
              </Pressable>
              <Text style={styles.quantityValue}>{canAdd ? selectedQuantity : 0}</Text>
              <Pressable
                accessibilityLabel="Aumentar cantidad"
                accessibilityRole="button"
                disabled={!canAdd || selectedQuantity >= maxQuantity}
                onPress={() => setQuantity(selectedQuantity + 1)}
                style={styles.stepButton}
              >
                <Ionicons name="add" size={22} color={colors.primary} />
              </Pressable>
            </View>
          </View>

          {justAdded > 0 && canAdd ? (
            <Pressable onPress={() => router.push("/cart")} style={styles.addedRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.addedText}>
                {justAdded === 1 ? "1 unidad agregada" : `${justAdded} unidades agregadas`}.
                Ver carrito ›
              </Text>
            </Pressable>
          ) : null}

          {!canAdd && inStock ? (
            <View style={styles.limitBanner}>
              <Ionicons name="warning-outline" size={26} color={colors.warning} />
              <View style={styles.limitCopy}>
                <Text style={styles.limitTitle}>
                  {cartIsFull ? "Límite del carrito alcanzado" : "Ya agregaste todo el stock"}
                </Text>
                <Text style={styles.limitDescription}>
                  {cartIsFull
                    ? `Ya tienes el máximo de ${MAX_CART_ITEMS} unidades permitidas en el carrito.`
                    : "Ya tienes en el carrito todas las unidades disponibles de este modelo."}
                </Text>
              </View>
            </View>
          ) : (
            <Pressable
              accessibilityLabel={
                canAdd ? "Agregar al carrito" : "No disponible: este modelo no tiene unidades"
              }
              accessibilityRole="button"
              accessibilityState={{ disabled: !canAdd }}
              disabled={!canAdd}
              onPress={addToCart}
              style={({ pressed }) => [
                styles.addButton,
                !canAdd && styles.addButtonDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="cart-outline"
                size={22}
                color={canAdd ? colors.surface : colors.muted}
              />
              <Text style={[styles.addText, !canAdd && styles.addTextDisabled]}>
                {canAdd ? "Agregar al carrito" : "No disponible"}
              </Text>
            </Pressable>
          )}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <BrandHeader action={null} onBack={goBack} title="Detalle de modelo" />
      <View style={styles.body}>{renderBody()}</View>
    </SafeAreaView>
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
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  loadingText: { color: colors.muted, fontSize: 14 },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.lg },
  imageArea: {
    height: 230,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  image: { width: "100%", height: "100%" },
  noImage: { alignItems: "center", gap: spacing.sm },
  noImageText: { color: colors.muted, fontSize: 14, fontWeight: "700" },
  identity: { gap: 4 },
  brand: { color: colors.muted, fontSize: 14, fontWeight: "700" },
  title: { color: colors.text, fontSize: 24, fontWeight: "800" },
  skuChip: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: colors.blueBackground,
  },
  skuText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "800" },
  specGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  specTile: {
    width: "48.5%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.background,
  },
  specCopy: { flex: 1, minWidth: 0, gap: 2 },
  specLabel: { color: colors.text, fontSize: 12, fontWeight: "800" },
  specValue: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  priceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  pricePart: {
    flex: 1,
    gap: 2,
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.blueBackground,
  },
  priceLabel: { color: colors.muted, fontSize: 13 },
  price: { color: colors.primary, fontSize: 24, fontWeight: "800" },
  availabilityPart: { flex: 1, gap: 6 },
  availabilityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.successBackground,
  },
  availabilityChipOut: { backgroundColor: colors.dangerBackground },
  availabilityText: { flex: 1, color: colors.success, fontSize: 12, fontWeight: "800" },
  availabilityTextOut: { color: colors.danger },
  unitsCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
  },
  unitsTitle: { color: colors.text, fontSize: 15, fontWeight: "800" },
  unitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: 4,
  },
  unitSerial: { flex: 1, color: colors.muted, fontSize: 13 },
  unitInCart: { color: colors.success, fontSize: 12, fontWeight: "800" },
  disclaimer: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  source: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  editButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: 11,
    backgroundColor: colors.blueBackground,
  },
  editButtonText: { color: colors.primary, fontSize: 15, fontWeight: "800" },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  quantityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  quantityLabel: { color: colors.text, fontSize: 16, fontWeight: "800" },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
  },
  stepperDisabled: { opacity: 0.5 },
  stepButton: { width: 46, height: 44, alignItems: "center", justifyContent: "center" },
  quantityValue: {
    minWidth: 44,
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  addedRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  addedText: { flex: 1, color: colors.success, fontSize: 13, fontWeight: "700" },
  limitBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.warningBackground,
  },
  limitCopy: { flex: 1, gap: 2 },
  limitTitle: { color: colors.text, fontSize: 15, fontWeight: "800" },
  limitDescription: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  addButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  addButtonDisabled: { backgroundColor: colors.background },
  addText: { color: colors.surface, fontSize: 16, fontWeight: "800" },
  addTextDisabled: { color: colors.muted },
  pressed: { opacity: 0.75 },
});
