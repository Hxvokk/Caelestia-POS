import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
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
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCurrentUser } from "../../../shared/api/accountApi";
import { getApiErrorMessage } from "../../../shared/api/client";
import { getBrands, getLaptopModels, getLaptopUnits } from "../../../shared/api/inventoryApi";
import { MAX_CART_ITEMS, useCartStore } from "../../sales/store/cartStore";
import type {
  Brand,
  LaptopModel,
  LaptopModelFilters,
  LaptopUnit,
} from "../../../shared/api/types";
import { colors, spacing } from "../../../shared/config/theme";
import { useSessionStore } from "../../auth/store/sessionStore";
import { BrandHeader, HomeErrorState } from "../components/HomeDashboardUI";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const modelImageStyle: ImageStyle = {
  width: "100%",
  height: "100%",
};

const PROCESSOR_FAMILIES: { label: string; pattern: RegExp }[] = [
  { label: "Intel", pattern: /intel|core\s*(i\d|ultra)|celeron|pentium/i },
  { label: "AMD", pattern: /amd|ryzen|athlon/i },
  { label: "Apple", pattern: /apple|\bm[1-9]\b/i },
  { label: "Qualcomm", pattern: /qualcomm|snapdragon/i },
];

const RAM_OPTIONS = ["8", "16", "32", "64"];

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(price);
}

function formatModelMemory(model: LaptopModel): string {
  if (model.ramGb !== null) return `RAM: ${model.ramGb} GB`;
  if (model.unifiedMemoryGb !== null) return `Memoria: ${model.unifiedMemoryGb} GB`;
  return "Memoria no especificada";
}

export function ModelCatalogScreen() {
  const currentUser = useSessionStore((state) => state.currentUser);
  const setCurrentUser = useSessionStore((state) => state.setCurrentUser);
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const cartCount = cartItems.length;
  const cartIsFull = cartCount >= MAX_CART_ITEMS;
  const filtersRef = useRef<LaptopModelFilters>({});
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<LaptopModel[]>([]);
  const [units, setUnits] = useState<LaptopUnit[]>([]);
  const [search, setSearch] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [processor, setProcessor] = useState("");
  const [appliedProcessor, setAppliedProcessor] = useState("");
  const [minMemoryGb, setMinMemoryGb] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [advancedApplied, setAdvancedApplied] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);

  const isAdministrator = currentUser?.role === "administrador";

  const loadCatalog = useCallback(async (filters?: LaptopModelFilters) => {
    const activeFilters = filters ?? filtersRef.current;
    filtersRef.current = activeFilters;
    setIsLoading(true);
    setError(null);
    try {
      const [nextModels, nextUnits, nextBrands] = await Promise.all([
        getLaptopModels(activeFilters),
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

  const addModelToCart = (model: LaptopModel) => {
    const unit = units.find(
      (candidate) =>
        candidate.modelId === model.id &&
        !cartItems.some((cartItem) => cartItem.unitId === candidate.id),
    );
    if (!unit || cartIsFull) return;
    addItem({
      unitId: unit.id,
      modelId: model.id,
      brandName: model.brandName,
      modelName: model.name,
      serialNumber: unit.serialNumber,
      unitPrice: model.price,
    });
  };

  const visibleModels = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es-MX");
    const family = PROCESSOR_FAMILIES.find((item) => item.label === appliedProcessor);
    return models.filter(
      (model) =>
        (!family || family.pattern.test(String(model.processorOrChip ?? ""))) &&
        (!query ||
          [model.name, model.brandName, model.sku, model.processorOrChip].some((value) =>
            String(value ?? "").toLocaleLowerCase("es-MX").includes(query),
          )),
    );
  }, [models, search, appliedProcessor]);

  const buildFilters = (brandId: number | null): LaptopModelFilters | null => {
    const min = minPrice.trim() ? Number(minPrice) : undefined;
    const max = maxPrice.trim() ? Number(maxPrice) : undefined;
    const memory = minMemoryGb.trim() ? Number(minMemoryGb) : undefined;
    if (
      (min !== undefined && (!Number.isFinite(min) || min <= 0)) ||
      (max !== undefined && (!Number.isFinite(max) || max <= 0)) ||
      (memory !== undefined && (!Number.isInteger(memory) || memory <= 0))
    ) {
      setFilterError("Revisa el precio y la memoria mínima indicados.");
      setShowFilters(true);
      return null;
    }
    if (min !== undefined && max !== undefined && min > max) {
      setFilterError("El precio mínimo no puede superar el máximo.");
      setShowFilters(true);
      return null;
    }

    setFilterError(null);
    return {
      brandId: brandId ?? undefined,
      minPrice: min,
      maxPrice: max,
      minMemoryGb: memory,
      availableOnly: availableOnly || undefined,
    };
  };

  const applyFilters = () => {
    const filters = buildFilters(selectedBrandId);
    if (!filters) return;
    setAdvancedApplied(
      filters.minPrice !== undefined ||
        filters.maxPrice !== undefined ||
        filters.minMemoryGb !== undefined ||
        filters.availableOnly !== undefined ||
        processor !== "",
    );
    setAppliedProcessor(processor);
    setShowFilters(false);
    void loadCatalog(filters);
  };

  const selectBrand = (brandId: number | null) => {
    setSelectedBrandId(brandId);
    const filters = buildFilters(brandId);
    if (filters) void loadCatalog(filters);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedBrandId(null);
    setMinPrice("");
    setMaxPrice("");
    setProcessor("");
    setAppliedProcessor("");
    setMinMemoryGb("");
    setAvailableOnly(false);
    setAdvancedApplied(false);
    setFilterError(null);
    void loadCatalog({});
  };

  const hasQuery = search.trim().length > 0;
  const hasActiveFilters = hasQuery || selectedBrandId !== null || advancedApplied;
  const initialLoading = isLoading && models.length === 0 && !error;

  const renderEmpty = () => {
    if (initialLoading) return <CatalogSkeleton />;
    if (error) {
      return (
        <HomeErrorState
          message={error}
          onRetry={() => void loadCatalog()}
          title="No se pudo cargar el catálogo"
        />
      );
    }
    if (hasActiveFilters) {
      return (
        <StatePanel
          badge="search"
          description={
            hasQuery
              ? `No hay resultados para “${search.trim()}”. Intenta con otros términos de búsqueda o ajusta los filtros.`
              : "No hay laptops con los filtros seleccionados. Intenta ajustarlos."
          }
          title="No se encontraron laptops"
        >
          {hasQuery ? (
            <StateButton
              icon="close-circle-outline"
              label="Limpiar búsqueda"
              onPress={() => setSearch("")}
            />
          ) : (
            <StateButton icon="refresh" label="Limpiar filtros" onPress={clearFilters} />
          )}
          <StateButton
            icon="options-outline"
            label="Ajustar filtros"
            onPress={() => setShowFilters(true)}
            secondary
          />
        </StatePanel>
      );
    }
    return (
      <StatePanel
        badge="cube-outline"
        description={
          isAdministrator
            ? "Aún no hay modelos registrados en el catálogo. Puedes agregar modelos desde administración."
            : "Aún no hay modelos registrados en el catálogo."
        }
        title="No hay laptops disponibles"
      >
        {isAdministrator ? (
          <StateButton
            icon="settings-outline"
            label="Ir a administración"
            onPress={() => router.push("/admin")}
            secondary
          />
        ) : null}
      </StatePanel>
    );
  };

  const cartAction = (
    <Pressable
      accessibilityLabel={`Carrito de venta, ${cartCount} unidades`}
      accessibilityRole="button"
      onPress={() => router.push("/cart")}
      style={styles.cartButton}
    >
      <Ionicons name="cart-outline" size={25} color={colors.surface} />
      <View style={styles.cartBadge}>
        <Text style={styles.cartBadgeText}>{cartCount}</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <BrandHeader
        action={cartAction}
        subtitle="Explora nuestra selección de laptops"
        title="Catálogo"
      />
      <View style={styles.body}>
        <FlatList
          contentContainerStyle={styles.list}
          data={initialLoading ? [] : visibleModels}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(model) => String(model.id)}
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              onRefresh={() => void loadCatalog()}
              refreshing={isLoading && !initialLoading}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={renderEmpty()}
          ListHeaderComponent={
            <View style={styles.controls}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={21} color={colors.muted} />
                <TextInput
                  accessibilityLabel="Buscar modelo o marca"
                  onChangeText={setSearch}
                  placeholder="Buscar por nombre, marca, SKU o procesador"
                  placeholderTextColor={colors.muted}
                  returnKeyType="search"
                  style={styles.searchInput}
                  value={search}
                />
                {hasQuery ? (
                  <Pressable
                    accessibilityLabel="Borrar búsqueda"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => setSearch("")}
                  >
                    <Ionicons name="close" size={20} color={colors.muted} />
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.brandRow}>
                <ScrollView
                  horizontal
                  contentContainerStyle={styles.chipRow}
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipScroll}
                >
                  <FilterChip
                    label="Todas"
                    selected={selectedBrandId === null}
                    onPress={() => selectBrand(null)}
                  />
                  {brands.map((brand) => (
                    <FilterChip
                      key={brand.id}
                      label={brand.name}
                      selected={selectedBrandId === brand.id}
                      onPress={() => selectBrand(brand.id)}
                    />
                  ))}
                </ScrollView>
                <Pressable
                  accessibilityLabel="Más filtros"
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showFilters }}
                  onPress={() => setShowFilters((value) => !value)}
                  style={[styles.filterButton, showFilters && styles.filterButtonActive]}
                >
                  <Ionicons
                    name="options-outline"
                    size={22}
                    color={showFilters ? colors.surface : colors.primary}
                  />
                  {advancedApplied ? <View style={styles.filterDot} /> : null}
                </Pressable>
              </View>

              {showFilters ? (
                <View style={styles.filterPanel}>
                  <View style={styles.filterRow}>
                    <LabeledInput
                      keyboardType="decimal-pad"
                      label="Precio mínimo"
                      onChangeText={setMinPrice}
                      placeholder="$ MXN"
                      value={minPrice}
                    />
                    <LabeledInput
                      keyboardType="decimal-pad"
                      label="Precio máximo"
                      onChangeText={setMaxPrice}
                      placeholder="$ MXN"
                      value={maxPrice}
                    />
                  </View>
                  <SelectField
                    anyLabel="Cualquiera"
                    label="RAM mínima"
                    onChange={setMinMemoryGb}
                    options={RAM_OPTIONS.map((value) => ({ value, label: `${value} GB o más` }))}
                    value={minMemoryGb}
                  />
                  <SelectField
                    anyLabel="Todos"
                    label="Procesador o chip"
                    onChange={setProcessor}
                    options={PROCESSOR_FAMILIES.map((item) => ({
                      value: item.label,
                      label: item.label,
                    }))}
                    value={processor}
                  />
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: availableOnly }}
                    onPress={() => setAvailableOnly((value) => !value)}
                    style={styles.checkRow}
                  >
                    <Ionicons
                      name={availableOnly ? "checkbox" : "square-outline"}
                      size={22}
                      color={colors.primary}
                    />
                    <Text style={styles.checkText}>Solo disponibles</Text>
                  </Pressable>
                  {filterError ? (
                    <Text accessibilityRole="alert" style={styles.filterError}>
                      {filterError}
                    </Text>
                  ) : null}
                  <View style={styles.filterActions}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={clearFilters}
                      style={styles.clearButton}
                    >
                      <Text style={styles.clearText}>Limpiar filtros</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={applyFilters}
                      style={styles.applyButton}
                    >
                      <Text style={styles.applyText}>Aplicar filtros</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {!initialLoading && !error && visibleModels.length > 0 ? (
                <Text style={styles.resultsLabel}>
                  {visibleModels.length} {visibleModels.length === 1 ? "modelo" : "modelos"}
                </Text>
              ) : null}
            </View>
          }
          renderItem={({ item }) => {
            const stock = availableByModel.get(item.id) ?? 0;
            const inStock = stock > 0;
            const inCart = cartItems.filter((cartItem) => cartItem.modelId === item.id).length;
            const canAdd = inStock && inCart < stock && !cartIsFull;
            const addLabel = !inStock
              ? "Sin stock"
              : inCart >= stock
                ? "En el carrito"
                : cartIsFull
                  ? "Límite del carrito"
                  : "Agregar";
            return (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: "/models/[id]", params: { id: String(item.id) } })
                }
                style={({ pressed }) => [styles.modelCard, pressed && styles.cardPressed]}
              >
                <View style={styles.cardTop}>
                  <View style={styles.imageBox}>
                    {item.imageUrl ? (
                      <Image
                        accessibilityLabel={`Imagen de ${item.brandName} ${item.name}`}
                        resizeMode="contain"
                        source={{ uri: item.imageUrl }}
                        style={modelImageStyle}
                      />
                    ) : (
                      <Ionicons name="laptop-outline" size={38} color={colors.muted} />
                    )}
                  </View>
                  <View style={styles.modelInfo}>
                    <View style={styles.brandBadge}>
                      <Text numberOfLines={1} style={styles.brandBadgeText}>
                        {item.brandName}
                      </Text>
                    </View>
                    <Text numberOfLines={2} style={styles.modelName}>
                      {item.name}
                    </Text>
                    <View style={styles.specList}>
                      <SpecLine icon="hardware-chip-outline" lines={3} text={item.processorOrChip} />
                      <SpecLine icon="albums-outline" lines={2} text={formatModelMemory(item)} />
                      <SpecLine
                        icon="server-outline"
                        lines={3}
                        text={`${item.storageGb} GB ${item.storageType}`}
                      />
                    </View>
                  </View>
                </View>
                <View style={styles.cardBottom}>
                  <View style={styles.priceBlock}>
                    <Text adjustsFontSizeToFit numberOfLines={1} style={styles.price}>
                      {formatPrice(item.price)}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityLabel={`Agregar ${item.brandName} ${item.name} al carrito`}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !canAdd }}
                    disabled={!canAdd}
                    onPress={() => addModelToCart(item)}
                    style={({ pressed }) => [
                      styles.addButton,
                      !canAdd && styles.addButtonDisabled,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <Ionicons
                      name="cart-outline"
                      size={18}
                      color={canAdd ? colors.surface : colors.muted}
                    />
                    <Text style={[styles.addText, !canAdd && styles.addTextDisabled]}>
                      {addLabel}
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function SpecLine({
  icon,
  text,
  lines = 1,
}: {
  icon: IconName;
  text: string;
  lines?: number;
}) {
  return (
    <View style={styles.specLine}>
      <Ionicons name={icon} size={15} color={colors.muted} />
      <Text numberOfLines={lines} style={styles.specText}>
        {text}
      </Text>
    </View>
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "decimal-pad" | "number-pad";
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.smallInput}
        value={value}
      />
    </View>
  );
}

function SelectField({
  label,
  value,
  options,
  anyLabel,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  anyLabel: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <View style={styles.selectGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
        style={styles.selectButton}
      >
        <Text style={styles.selectValue}>{selected?.label ?? anyLabel}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
      </Pressable>
      {open ? (
        <View style={styles.selectList}>
          {[{ value: "", label: anyLabel }, ...options].map((option) => (
            <Pressable
              accessibilityRole="menuitem"
              key={option.value || "any"}
              onPress={() => choose(option.value)}
              style={styles.selectOption}
            >
              <Text
                style={[styles.selectOptionText, option.value === value && styles.selectedText]}
              >
                {option.label}
              </Text>
              {option.value === value ? (
                <Ionicons name="checkmark" size={18} color={colors.primary} />
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
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

function StatePanel({
  badge,
  title,
  description,
  children,
}: {
  badge: IconName;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.statePanel}>
      <View style={styles.stateIcon}>
        <Ionicons name="laptop-outline" size={58} color={colors.muted} />
        <View style={styles.stateBadge}>
          <Ionicons name={badge} size={16} color={colors.surface} />
        </View>
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateDescription}>{description}</Text>
      {children}
    </View>
  );
}

function StateButton({
  icon,
  label,
  onPress,
  secondary = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.stateButton,
        secondary && styles.stateButtonSecondary,
        pressed && styles.cardPressed,
      ]}
    >
      <Ionicons name={icon} size={19} color={secondary ? colors.primary : colors.surface} />
      <Text style={[styles.stateButtonText, secondary && styles.stateButtonSecondaryText]}>
        {label}
      </Text>
    </Pressable>
  );
}

function CatalogSkeleton() {
  return (
    <View accessibilityLabel="Cargando catálogo" style={styles.skeletonList}>
      {[0, 1, 2].map((key) => (
        <View key={key} style={styles.skeletonCard}>
          <View style={styles.skeletonImage}>
            <Ionicons name="laptop-outline" size={34} color="#BECBE0" />
          </View>
          <View style={styles.skeletonCopy}>
            <View style={styles.skeletonLineMedium} />
            <View style={styles.skeletonLineWide} />
            <View style={styles.skeletonLineShort} />
          </View>
        </View>
      ))}
      <View style={styles.loadingRow}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Cargando catálogo…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy },
  body: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.surface,
  },
  list: { flexGrow: 1, gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xl },
  controls: { gap: spacing.sm },
  cartButton: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#FFFFFF24",
  },
  cartBadge: {
    position: "absolute",
    top: -7,
    right: -7,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: colors.primary,
  },
  cartBadgeText: { color: colors.surface, fontSize: 12, fontWeight: "800" },
  searchBox: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.background,
  },
  searchInput: { flex: 1, paddingVertical: 10, color: colors.text, fontSize: 14 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  chipScroll: { flex: 1 },
  chipRow: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: 19,
    backgroundColor: colors.background,
  },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14, fontWeight: "700" },
  chipSelectedText: { color: colors.surface },
  filterButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.blueBackground,
  },
  filterButtonActive: { backgroundColor: colors.primary },
  filterDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.danger,
  },
  filterPanel: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.background,
  },
  filterRow: { flexDirection: "row", gap: spacing.sm },
  inputGroup: { flex: 1, gap: 4 },
  fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  smallInput: {
    minHeight: 42,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 14,
  },
  selectGroup: { gap: 4 },
  selectButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  selectValue: { color: colors.text, fontSize: 14 },
  selectList: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  selectOption: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
  },
  selectOptionText: { color: colors.text, fontSize: 14 },
  selectedText: { color: colors.primary, fontWeight: "800" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 36 },
  checkText: { color: colors.text, fontSize: 14, fontWeight: "700" },
  filterError: { color: colors.danger, fontSize: 13 },
  filterActions: { flexDirection: "row", gap: spacing.sm },
  clearButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: colors.blueBackground,
  },
  clearText: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  applyButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: colors.primary,
  },
  applyText: { color: colors.surface, fontSize: 14, fontWeight: "800" },
  resultsLabel: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  modelCard: {
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: { opacity: 0.75 },
  cardTop: { flexDirection: "row", gap: spacing.sm },
  imageBox: {
    width: 84,
    height: 104,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  modelInfo: { flex: 1, minWidth: 0, gap: 4 },
  brandBadge: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.blueBackground,
  },
  brandBadgeText: { color: colors.primary, fontSize: 11, fontWeight: "800" },
  modelName: { color: colors.text, fontSize: 16, fontWeight: "800" },
  specList: { gap: 5, marginTop: spacing.xs },
  specLine: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  specText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 16 },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceBlock: { flex: 1, minWidth: 0 },
  price: { color: colors.text, fontSize: 18, fontWeight: "800" },
  addButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 11,
    backgroundColor: colors.primary,
  },
  addButtonDisabled: { backgroundColor: colors.background },
  addText: { color: colors.surface, fontSize: 14, fontWeight: "800" },
  addTextDisabled: { color: colors.muted },
  statePanel: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  stateIcon: { position: "relative", padding: spacing.md },
  stateBadge: {
    position: "absolute",
    right: 9,
    top: 9,
    width: 25,
    height: 25,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primaryDark,
  },
  stateTitle: { color: colors.text, fontSize: 19, fontWeight: "800", textAlign: "center" },
  stateDescription: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: "center" },
  stateButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    alignSelf: "stretch",
    borderRadius: 11,
    backgroundColor: colors.primary,
  },
  stateButtonSecondary: { backgroundColor: colors.blueBackground },
  stateButtonText: { color: colors.surface, fontSize: 15, fontWeight: "800" },
  stateButtonSecondaryText: { color: colors.primary },
  skeletonList: { gap: spacing.md },
  skeletonCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  skeletonImage: {
    width: 78,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#E5EBF4",
  },
  skeletonCopy: { flex: 1, gap: spacing.sm },
  skeletonLineMedium: { width: "70%", height: 14, borderRadius: 7, backgroundColor: "#D3DCEB" },
  skeletonLineWide: { width: "90%", height: 14, borderRadius: 7, backgroundColor: "#D3DCEB" },
  skeletonLineShort: { width: "45%", height: 14, borderRadius: 7, backgroundColor: "#D3DCEB" },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loadingText: { color: colors.muted, fontSize: 14 },
});
