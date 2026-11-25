import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { getApiErrorMessage } from "../../../shared/api/client";
import {
  getLaptopRecommendations,
  type LaptopRecommendationResponse,
} from "../../../shared/api/advisorApi";
import { colors, spacing } from "../../../shared/config/theme";
import { BrandHeader } from "../../inventory/components/HomeDashboardUI";
import { formatPrice } from "../../sales/utils/formatPrice";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
type Phase = "form" | "loading" | "results" | "error";

const NEEDS_LIMIT = 1000;

function parseOptionalPositiveInteger(value: string): number | null | undefined {
  if (!value.trim()) return null;
  if (!/^\d+$/.test(value.trim())) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function LaptopAdvisorScreen({ showBack = true }: { showBack?: boolean } = {}) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>("form");
  const [budget, setBudget] = useState("");
  const [needs, setNeeds] = useState("");
  const [software, setSoftware] = useState("");
  const [resolution, setResolution] = useState("");
  const [minimumRam, setMinimumRam] = useState("");
  const [minimumStorage, setMinimumStorage] = useState("");
  const [requiredGpu, setRequiredGpu] = useState("");
  const [showOptional, setShowOptional] = useState(false);
  const [result, setResult] = useState<LaptopRecommendationResponse | null>(null);
  const [errors, setErrors] = useState<{ budget?: string; needs?: string; optional?: string }>({});
  const [serviceError, setServiceError] = useState<string | null>(null);

  const submit = async () => {
    const parsedBudget = Number(budget.trim().replace(",", "."));
    const parsedRam = parseOptionalPositiveInteger(minimumRam);
    const parsedStorage = parseOptionalPositiveInteger(minimumStorage);
    const nextErrors: typeof errors = {};
    if (!budget.trim() || !Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      nextErrors.budget = "Ingresa un presupuesto válido.";
    }
    if (!needs.trim()) {
      nextErrors.needs = "Describe brevemente lo que necesita el cliente.";
    }
    if (parsedRam === undefined || parsedStorage === undefined) {
      nextErrors.optional = "La RAM y el almacenamiento mínimos deben ser enteros positivos.";
      setShowOptional(true);
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setServiceError(null);
    setResult(null);
    setPhase("loading");
    try {
      setResult(
        await getLaptopRecommendations({
          budget: parsedBudget,
          needs: needs.trim(),
          software: software.trim() || null,
          resolution: resolution.trim() || null,
          minimumRamGb: parsedRam ?? null,
          minimumStorageGb: parsedStorage ?? null,
          requiredGpu: requiredGpu.trim() || null,
        }),
      );
      setPhase("results");
    } catch (requestError) {
      setServiceError(getApiErrorMessage(requestError));
      setPhase("error");
    }
  };

  const bottomPadding = Math.max(insets.bottom, spacing.md);

  const renderBody = () => {
    if (phase === "loading") return <LoadingState />;

    if (phase === "error") {
      return (
        <View style={styles.stateWrap}>
          <View style={[styles.stateIcon, styles.stateIconError]}>
            <Ionicons name="laptop-outline" size={58} color={colors.danger} />
            <View style={styles.errorBadge}>
              <Ionicons name="alert" size={16} color={colors.surface} />
            </View>
          </View>
          <Text style={styles.stateTitle}>Servicio no disponible</Text>
          <Text style={styles.stateDescription}>
            No se pudieron generar recomendaciones en este momento.{" "}
            {serviceError ?? "Por favor, inténtalo de nuevo."}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void submit()}
            style={({ pressed }) => [styles.primaryButton, styles.stateButton, pressed && styles.pressed]}
          >
            <Ionicons name="refresh" size={21} color={colors.surface} />
            <Text style={styles.primaryButtonText}>Reintentar</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setPhase("form")}
            style={({ pressed }) => [styles.secondaryButton, styles.stateButton, pressed && styles.pressed]}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Editar solicitud</Text>
          </Pressable>
        </View>
      );
    }

    if (phase === "results" && result) {
      const hasResults = result.recommendations.length > 0;
      return (
        <>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.resultsHeader}>
              <View style={styles.checkBadge}>
                <Ionicons name={hasResults ? "checkmark" : "search"} size={20} color={colors.surface} />
              </View>
              <View style={styles.resultsCopy}>
                <Text style={styles.sectionTitle}>
                  {hasResults ? "Recomendaciones" : "Sin coincidencias"}
                </Text>
                <Text style={styles.muted}>
                  {hasResults
                    ? "Laptops que se adaptan a tus necesidades."
                    : "No encontramos laptops para esta solicitud."}
                </Text>
              </View>
            </View>
            {result.message ? <Text style={styles.muted}>{result.message}</Text> : null}

            {result.recommendations.map((model) => (
              <Pressable
                key={model.modelId}
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: "/models/[id]", params: { id: String(model.modelId) } })
                }
                style={({ pressed }) => [styles.modelCard, pressed && styles.pressed]}
              >
                <View style={styles.modelTop}>
                  <View style={styles.modelImage}>
                    <Ionicons name="laptop-outline" size={32} color={colors.muted} />
                  </View>
                  <View style={styles.modelInfo}>
                    <Text style={styles.modelBrand}>{model.brandName}</Text>
                    <Text numberOfLines={2} style={styles.modelName}>
                      {model.modelName}
                    </Text>
                    <View style={styles.priceChip}>
                      <Text style={styles.priceText}>{formatPrice(model.price)}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                </View>
                <SpecLine icon="hardware-chip-outline" text={model.processorOrChip} />
                <SpecLine
                  icon="albums-outline"
                  text={`${
                    model.ramGb !== null
                      ? `RAM ${model.ramGb} GB`
                      : model.unifiedMemoryGb !== null
                        ? `Memoria ${model.unifiedMemoryGb} GB`
                        : "Memoria no especificada"
                  } · ${model.storageGb} GB de almacenamiento`}
                />
                <SpecLine icon="game-controller-outline" text={`GPU: ${model.gpu ?? "No especificada"}`} />
                <Text style={styles.matchSummary}>{model.matchSummary}</Text>
                {model.limitations.map((limitation) => (
                  <Text key={limitation} style={styles.limitation}>
                    • {limitation}
                  </Text>
                ))}
              </Pressable>
            ))}

            <View style={styles.noteCard}>
              <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
              <View style={styles.noteCopy}>
                <Text style={styles.noteTitle}>Nota</Text>
                <Text style={styles.noteText}>
                  {result.usedAi
                    ? "Estas recomendaciones fueron generadas con ayuda de un asesor de inteligencia artificial."
                    : "Estas recomendaciones se generaron con reglas locales del catálogo."}{" "}
                  Solo se consideran modelos con unidades disponibles que respetan el presupuesto.
                </Text>
              </View>
            </View>
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: bottomPadding }]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPhase("form")}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Ionicons name="refresh" size={21} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>Nueva recomendación</Text>
            </Pressable>
          </View>
        </>
      );
    }

    return (
      <>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="laptop-outline" size={46} color={colors.primary} />
            <Ionicons name="sparkles" size={20} color={colors.accent} style={styles.sparkle} />
          </View>
          <Text style={styles.title}>Asesor de laptops</Text>
          <Text style={styles.subtitle}>
            Cuéntanos el presupuesto y lo que necesita el cliente. Te recomendaremos modelos
            disponibles que se adapten.
          </Text>

          <FieldLabel icon="cash-outline" required text="Presupuesto máximo (MXN)" />
          <View style={[styles.inputBox, errors.budget && styles.inputBoxError]}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              accessibilityLabel="Presupuesto máximo en pesos mexicanos"
              keyboardType="decimal-pad"
              onChangeText={(value) => {
                setBudget(value);
                setErrors((current) => ({ ...current, budget: undefined }));
              }}
              placeholder="Ej. 25000"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={budget}
            />
            {budget ? (
              <Pressable
                accessibilityLabel="Borrar presupuesto"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setBudget("")}
              >
                <Ionicons name="close-circle-outline" size={22} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
          {errors.budget ? <FieldError text={errors.budget} /> : null}

          <FieldLabel icon="laptop-outline" required text="Necesidades de uso" />
          <TextInput
            accessibilityLabel="Descripción de necesidades"
            maxLength={NEEDS_LIMIT}
            multiline
            onChangeText={(value) => {
              setNeeds(value);
              setErrors((current) => ({ ...current, needs: undefined }));
            }}
            placeholder="Describe el uso o las tareas que realizará"
            placeholderTextColor={colors.muted}
            style={[styles.inputBox, styles.multiline, errors.needs && styles.inputBoxError]}
            value={needs}
          />
          <Text style={styles.counter}>
            {needs.length}/{NEEDS_LIMIT}
          </Text>
          {errors.needs ? <FieldError text={errors.needs} /> : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showOptional }}
            onPress={() => setShowOptional((open) => !open)}
            style={styles.optionalToggle}
          >
            <Ionicons name="options-outline" size={22} color={colors.primary} />
            <Text style={styles.optionalText}>Requisitos opcionales</Text>
            <Ionicons
              name={showOptional ? "chevron-up" : "chevron-down"}
              size={22}
              color={colors.muted}
            />
          </Pressable>

          {showOptional ? (
            <View style={styles.optionalCard}>
              <LabeledInput label="Software requerido" onChangeText={setSoftware} placeholder="Software que necesita" value={software} />
              <LabeledInput label="Resolución deseada" onChangeText={setResolution} placeholder="Resolución de pantalla" value={resolution} />
              <View style={styles.numericRow}>
                <View style={styles.numericField}>
                  <LabeledInput
                    keyboardType="number-pad"
                    label="RAM mínima (GB)"
                    onChangeText={setMinimumRam}
                    placeholder="GB"
                    value={minimumRam}
                  />
                </View>
                <View style={styles.numericField}>
                  <LabeledInput
                    keyboardType="number-pad"
                    label="Almacenamiento (GB)"
                    onChangeText={setMinimumStorage}
                    placeholder="GB"
                    value={minimumStorage}
                  />
                </View>
              </View>
              <LabeledInput label="GPU requerida" onChangeText={setRequiredGpu} placeholder="GPU requerida" value={requiredGpu} />
              {errors.optional ? <FieldError text={errors.optional} /> : null}
            </View>
          ) : null}

          <View style={styles.privacyRow}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.privacyNote}>
              No incluyas nombres, correos ni teléfonos. Solo se envían necesidades y
              especificaciones; nunca números de serie ni datos de cuenta.
            </Text>
          </View>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: bottomPadding }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void submit()}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Ionicons name="color-wand-outline" size={22} color={colors.surface} />
            <Text style={styles.primaryButtonText}>Solicitar recomendaciones</Text>
          </Pressable>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <BrandHeader
        action={null}
        onBack={showBack ? () => router.back() : undefined}
        title="Asesor de laptops"
      />
      <View style={styles.body}>{renderBody()}</View>
    </SafeAreaView>
  );
}

function FieldLabel({ icon, text, required = false }: { icon: IconName; text: string; required?: boolean }) {
  return (
    <View style={styles.fieldLabelRow}>
      <Ionicons name={icon} size={22} color={colors.text} />
      <Text style={styles.fieldLabel}>
        {text}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
    </View>
  );
}

function FieldError({ text }: { text: string }) {
  return (
    <View style={styles.errorRow}>
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
      <Text accessibilityRole="alert" style={styles.errorText}>
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
  keyboardType?: "number-pad";
}) {
  return (
    <View style={styles.labeledInput}>
      <Text style={styles.smallLabel}>{label}</Text>
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

function SpecLine({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.specLine}>
      <Ionicons name={icon} size={15} color={colors.muted} />
      <Text style={styles.specText}>{text}</Text>
    </View>
  );
}

function LoadingState() {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-120, 260] });

  return (
    <View accessibilityLabel="Generando recomendaciones" style={styles.stateWrap}>
      <View style={styles.stateIcon}>
        <Ionicons name="laptop-outline" size={64} color={colors.primary} />
      </View>
      <Text style={styles.stateTitle}>Generando recomendaciones…</Text>
      <Text style={styles.stateDescription}>
        Espera un momento mientras el servicio analiza tus necesidades.
      </Text>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressBar, { transform: [{ translateX }] }]} />
      </View>
    </View>
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
  content: { gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.md },
  heroIcon: {
    alignSelf: "center",
    width: 130,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 45,
    backgroundColor: colors.blueBackground,
  },
  sparkle: { position: "absolute", top: 10, right: 22 },
  title: { color: colors.text, fontSize: 24, fontWeight: "800", textAlign: "center" },
  subtitle: {
    marginBottom: spacing.xs,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  fieldLabelRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs },
  fieldLabel: { color: colors.text, fontSize: 16, fontWeight: "800" },
  required: { color: colors.danger },
  inputBox: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
  },
  inputBoxError: { borderColor: colors.danger },
  currency: { color: colors.text, fontSize: 18, fontWeight: "800" },
  input: { flex: 1, paddingVertical: 10, color: colors.text, fontSize: 15 },
  multiline: { minHeight: 96, paddingTop: spacing.sm, textAlignVertical: "top" },
  counter: { alignSelf: "flex-end", color: colors.muted, fontSize: 12 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorText: { flex: 1, color: colors.danger, fontSize: 13 },
  optionalToggle: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.indigoBackground,
  },
  optionalText: { flex: 1, color: colors.text, fontSize: 15, fontWeight: "800" },
  optionalCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
  },
  labeledInput: { gap: 4 },
  smallLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  smallInput: {
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    color: colors.text,
    fontSize: 14,
    backgroundColor: colors.surface,
  },
  numericRow: { flexDirection: "row", gap: spacing.sm },
  numericField: { flex: 1 },
  privacyRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginTop: spacing.xs },
  privacyNote: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 18 },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  primaryButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  primaryButtonText: { color: colors.surface, fontSize: 16, fontWeight: "800" },
  secondaryButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.blueBackground,
  },
  secondaryButtonText: { color: colors.primary, fontSize: 16, fontWeight: "800" },
  pressed: { opacity: 0.75 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "800" },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  resultsHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  checkBadge: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.primary,
  },
  resultsCopy: { flex: 1, gap: 2 },
  modelCard: {
    gap: 6,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  modelTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  modelImage: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  modelInfo: { flex: 1, minWidth: 0, gap: 3 },
  modelBrand: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  modelName: { color: colors.text, fontSize: 16, fontWeight: "800" },
  priceChip: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: colors.indigoBackground,
  },
  priceText: { color: colors.indigo, fontSize: 13, fontWeight: "800" },
  specLine: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  specText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 16 },
  matchSummary: { marginTop: 2, color: colors.success, fontSize: 13, lineHeight: 19 },
  limitation: { color: colors.warning, fontSize: 12, lineHeight: 17 },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.indigoBackground,
  },
  noteCopy: { flex: 1, gap: 2 },
  noteTitle: { color: colors.text, fontSize: 15, fontWeight: "800" },
  noteText: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  stateIcon: {
    position: "relative",
    width: 150,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 60,
    backgroundColor: colors.blueBackground,
  },
  stateIconError: { backgroundColor: colors.dangerBackground },
  errorBadge: {
    position: "absolute",
    right: 40,
    top: 28,
    width: 25,
    height: 25,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.danger,
  },
  stateTitle: { color: colors.text, fontSize: 21, fontWeight: "800", textAlign: "center" },
  stateDescription: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center" },
  stateButton: { alignSelf: "stretch" },
  progressTrack: {
    width: "80%",
    height: 8,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: colors.blueBackground,
  },
  progressBar: { width: 120, height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
