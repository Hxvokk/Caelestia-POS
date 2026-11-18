import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  type ImageStyle,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../shared/auth/supabase";
import { getCurrentUser } from "../../../shared/api/accountApi";
import { getApiErrorMessage } from "../../../shared/api/client";
import { getBrands, getLaptopModels, getLaptopUnits } from "../../../shared/api/inventoryApi";
import type {
  Brand,
  LaptopModel,
  LaptopModelFilters,
  LaptopUnit,
} from "../../../shared/api/types";
import { colors, spacing } from "../../../shared/config/theme";
import { ScreenState } from "../../../shared/ui/ScreenState";
import { useSessionStore } from "../../auth/store/sessionStore";

const modelImageStyle: ImageStyle = {
  width: 96,
  height: 96,
  borderRadius: 12,
  backgroundColor: "#F8F9FB",
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(price);
}

function formatModelMemory(model: LaptopModel): string {
  const memoryParts = [
    model.ramGb === null ? null : `RAM ${model.ramGb} GB`,
    model.unifiedMemoryGb === null ? null : `Memoria unificada ${model.unifiedMemoryGb} GB`,
  ].filter((value): value is string => value !== null);

  return memoryParts.length > 0 ? memoryParts.join(" · ") : "Memoria no especificada";
}

export function ModelCatalogScreen() {
  const currentUser = useSessionStore((state) => state.currentUser);
  const setCurrentUser = useSessionStore((state) => state.setCurrentUser);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<LaptopModel[]>([]);
  const [units, setUnits] = useState<LaptopUnit[]>([]);
  const [search, setSearch] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [processor, setProcessor] = useState("");
  const [minMemoryGb, setMinMemoryGb] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState("");

  const loadCatalog = useCallback(async (filters: LaptopModelFilters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextModels, nextUnits, nextBrands] = await Promise.all([
        getLaptopModels(filters),
        getLaptopUnits({ status: "disponible" }),
        getBrands(),
      ]);
      setModels(nextModels);
      setUnits(nextUnits);
      setBrands(nextBrands);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCatalog();
      if (supabase) {
        void supabase.auth.getUser().then(({ data }) => {
          setAccountEmail(data.user?.email ?? "");
        });
      }
      void getCurrentUser()
        .then(setCurrentUser)
        .catch(() => setCurrentUser(null));
    }, [loadCatalog, setCurrentUser]),
  );

  const availableByModel = useMemo(() => {
    const counts = new Map<number, number>();
    for (const unit of units) {
      counts.set(unit.modelId, (counts.get(unit.modelId) ?? 0) + 1);
    }
    return counts;
  }, [units]);

  const visibleModels = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es-MX");
    if (!query) return models;
    return models.filter((model) =>
      [model.name, model.brandName, model.sku, model.processorOrChip]
        .some((value) => String(value ?? "").toLocaleLowerCase("es-MX").includes(query)),
    );
  }, [models, search]);

  const applyFilters = () => {
    const min = minPrice.trim() ? Number(minPrice) : undefined;
    const max = maxPrice.trim() ? Number(maxPrice) : undefined;
    const memory = minMemoryGb.trim() ? Number(minMemoryGb) : undefined;
    if (
      (min !== undefined && (!Number.isFinite(min) || min <= 0)) ||
      (max !== undefined && (!Number.isFinite(max) || max <= 0)) ||
      (memory !== undefined && (!Number.isInteger(memory) || memory <= 0))
    ) {
      setFilterError("Revisa el precio y la memoria mínima indicados.");
      return;
    }
    if (min !== undefined && max !== undefined && min > max) {
      setFilterError("El precio mínimo no puede superar el máximo.");
      return;
    }

    setFilterError(null);
    void loadCatalog({
      brandId: selectedBrandId ?? undefined,
      minPrice: min,
      maxPrice: max,
      processor: processor.trim() || undefined,
      minMemoryGb: memory,
      availableOnly: availableOnly || undefined,
    });
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  if (isLoading && models.length === 0 && !error) {
    return <ScreenState loading title="Cargando catálogo" description="Consultando la API local." />;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.list}
        data={visibleModels}
        keyExtractor={(model) => String(model.id)}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void loadCatalog()}
            refreshing={isLoading}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {error ? "No se pudo cargar el catálogo" : "No hay modelos para mostrar"}
            </Text>
            <Text style={styles.emptyDescription}>
              {error ?? "Prueba con otros filtros o registra un modelo desde la administración."}
            </Text>
            {error ? (
              <Pressable onPress={() => void loadCatalog()} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Reintentar</Text>
              </Pressable>
            ) : null}
          </View>
        }
        ListHeaderComponent={
          <View>
            <View style={styles.topBar}>
              <View style={styles.titleGroup}>
                <Text style={styles.eyebrow}>CAELESTIA POS</Text>
                <Text style={styles.title}>Inventario</Text>
                <Text numberOfLines={1} style={styles.account}>
                  {accountEmail || "Sesión activa"}
                </Text>
              </View>
              <View style={styles.accountActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/profile")}
                >
                  <Text style={styles.profileLink}>Mi perfil</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => void signOut()}>
                  <Text style={styles.signOut}>Salir</Text>
                </Pressable>
              </View>
            </View>

            {currentUser?.role === "administrador" ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/admin")}
                style={styles.adminButton}
              >
                <Text style={styles.adminButtonText}>Administrar inventario</Text>
              </Pressable>
            ) : null}

            <Text style={styles.sectionLabel}>Buscar modelo o marca</Text>
            <TextInput
              accessibilityLabel="Buscar modelo o marca"
              onChangeText={setSearch}
              placeholder="Nombre, marca, SKU o procesador"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              value={search}
            />

            <Text style={styles.sectionLabel}>Marca</Text>
            <ScrollView
              horizontal
              contentContainerStyle={styles.chipRow}
              showsHorizontalScrollIndicator={false}
            >
              <FilterChip
                label="Todas"
                selected={selectedBrandId === null}
                onPress={() => setSelectedBrandId(null)}
              />
              {brands.map((brand) => (
                <FilterChip
                  key={brand.id}
                  label={brand.name}
                  selected={selectedBrandId === brand.id}
                  onPress={() => setSelectedBrandId(brand.id)}
                />
              ))}
            </ScrollView>

            <View style={styles.filterRow}>
              <View style={styles.priceField}>
                <Text style={styles.fieldLabel}>Precio mínimo</Text>
                <TextInput
                  accessibilityLabel="Precio mínimo"
                  keyboardType="decimal-pad"
                  onChangeText={setMinPrice}
                  placeholder="$ MXN"
                  placeholderTextColor={colors.muted}
                  style={styles.smallInput}
                  value={minPrice}
                />
              </View>
              <View style={styles.priceField}>
                <Text style={styles.fieldLabel}>Precio máximo</Text>
                <TextInput
                  accessibilityLabel="Precio máximo"
                  keyboardType="decimal-pad"
                  onChangeText={setMaxPrice}
                  placeholder="$ MXN"
                  placeholderTextColor={colors.muted}
                  style={styles.smallInput}
                  value={maxPrice}
                />
              </View>
              <View style={styles.memoryField}>
                <Text style={styles.fieldLabel}>RAM mínima</Text>
                <TextInput
                  accessibilityLabel="RAM o memoria unificada mínima"
                  keyboardType="number-pad"
                  onChangeText={setMinMemoryGb}
                  placeholder="GB"
                  placeholderTextColor={colors.muted}
                  style={styles.smallInput}
                  value={minMemoryGb}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Procesador o chip</Text>
            <TextInput
              accessibilityLabel="Filtrar por procesador o chip"
              onChangeText={setProcessor}
              placeholder="Intel, Ryzen, Apple silicon…"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              value={processor}
            />

            <View style={styles.filterActions}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: availableOnly }}
                onPress={() => setAvailableOnly((value) => !value)}
                style={[styles.availabilityToggle, availableOnly && styles.availabilitySelected]}
              >
                <Text style={[styles.toggleText, availableOnly && styles.toggleSelectedText]}>
                  {availableOnly ? "✓ " : ""}Solo disponibles
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={applyFilters}
                style={styles.applyButton}
              >
                <Text style={styles.applyText}>Aplicar filtros</Text>
              </Pressable>
            </View>
            {filterError ? (
              <Text accessibilityRole="alert" style={styles.filterError}>
                {filterError}
              </Text>
            ) : null}
            {error ? (
              <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>
            ) : null}
            <Text style={styles.resultsLabel}>
              {visibleModels.length} {visibleModels.length === 1 ? "modelo" : "modelos"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: "/models/[id]", params: { id: String(item.id) } })
            }
            style={({ pressed }) => [styles.modelCard, pressed && styles.cardPressed]}
          >
            {item.imageUrl ? (
              <Image
                accessibilityLabel={`Imagen de ${item.brandName} ${item.name}`}
                resizeMode="contain"
                source={{ uri: item.imageUrl }}
                style={modelImageStyle}
              />
            ) : null}
            <View style={styles.modelInfo}>
              <Text style={styles.brandName}>{item.brandName}</Text>
              <Text style={styles.modelName}>{item.name}</Text>
              <Text numberOfLines={2} style={styles.specSummary}>
                {item.processorOrChip} · {formatModelMemory(item)} · {item.storageGb} GB {item.storageType}
              </Text>
              <View style={styles.modelFooter}>
                <Text style={styles.price}>{formatPrice(item.price)}</Text>
                <Text style={styles.stock}>
                  {availableByModel.get(item.id) ?? 0} disponibles
                </Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipSelectedText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  titleGroup: { flex: 1, marginRight: spacing.md },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 1.8 },
  title: { marginTop: 3, color: colors.text, fontSize: 28, fontWeight: "800" },
  account: { marginTop: 4, color: colors.muted, fontSize: 13 },
  accountActions: { alignItems: "flex-end", gap: spacing.sm },
  profileLink: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  signOut: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  adminButton: {
    alignItems: "center",
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 11,
    backgroundColor: colors.text,
  },
  adminButtonText: { color: colors.surface, fontWeight: "700" },
  sectionLabel: { marginTop: spacing.sm, marginBottom: spacing.xs, color: colors.text, fontWeight: "700" },
  searchInput: {
    minHeight: 46,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  chipRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  chipSelected: { borderColor: colors.text, backgroundColor: colors.text },
  chipText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  chipSelectedText: { color: colors.surface },
  filterRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  priceField: { flex: 1 },
  memoryField: { width: 88 },
  fieldLabel: { marginBottom: 5, color: colors.muted, fontSize: 12, fontWeight: "600" },
  smallInput: {
    minHeight: 43,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  filterActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: spacing.sm },
  availabilityToggle: { paddingVertical: spacing.sm },
  availabilitySelected: {},
  toggleText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  toggleSelectedText: { color: colors.success },
  applyButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 9, backgroundColor: colors.primary },
  applyText: { color: colors.surface, fontWeight: "700" },
  filterError: { marginBottom: spacing.sm, color: colors.danger, fontSize: 13 },
  errorText: { marginBottom: spacing.sm, color: colors.danger, fontSize: 13 },
  resultsLabel: { marginTop: spacing.sm, marginBottom: spacing.xs, color: colors.muted, fontSize: 13 },
  modelCard: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  cardPressed: { opacity: 0.85 },
  modelInfo: { flex: 1, justifyContent: "center" },
  brandName: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  modelName: { marginTop: 2, color: colors.text, fontSize: 16, fontWeight: "700" },
  specSummary: { marginTop: 5, color: colors.muted, fontSize: 12, lineHeight: 17 },
  modelFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.xs, marginTop: spacing.sm },
  price: { color: colors.primary, fontSize: 15, fontWeight: "800" },
  stock: { color: colors.success, fontSize: 11, fontWeight: "700" },
  emptyCard: { padding: spacing.lg, borderRadius: 14, backgroundColor: colors.surface },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  emptyDescription: { marginTop: spacing.sm, color: colors.muted, fontSize: 14, lineHeight: 21 },
  secondaryButton: { alignSelf: "flex-start", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.md, borderRadius: 9, backgroundColor: colors.primary },
  secondaryButtonText: { color: colors.surface, fontWeight: "700" },
});
