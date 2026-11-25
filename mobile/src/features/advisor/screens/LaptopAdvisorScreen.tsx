import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getApiErrorMessage } from "../../../shared/api/client";
import {
  getLaptopRecommendations,
  type LaptopRecommendationResponse,
} from "../../../shared/api/advisorApi";
import { colors, spacing } from "../../../shared/config/theme";
import { formatPrice } from "../../sales/utils/formatPrice";

function parseOptionalPositiveInteger(value: string): number | null | undefined {
  if (!value.trim()) return null;
  if (!/^\d+$/.test(value.trim())) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function LaptopAdvisorScreen({ showBack = true }: { showBack?: boolean } = {}) {
  const [budget, setBudget] = useState("");
  const [needs, setNeeds] = useState("");
  const [software, setSoftware] = useState("");
  const [resolution, setResolution] = useState("");
  const [minimumRam, setMinimumRam] = useState("");
  const [minimumStorage, setMinimumStorage] = useState("");
  const [requiredGpu, setRequiredGpu] = useState("");
  const [result, setResult] = useState<LaptopRecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const parsedBudget = Number(budget.trim().replace(",", "."));
    const parsedRam = parseOptionalPositiveInteger(minimumRam);
    const parsedStorage = parseOptionalPositiveInteger(minimumStorage);
    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      setError("Indica un presupuesto máximo válido.");
      return;
    }
    if (!needs.trim()) {
      setError("Describe brevemente lo que necesita el cliente.");
      return;
    }
    if (parsedRam === undefined || parsedStorage === undefined) {
      setError("La RAM y el almacenamiento mínimos deben ser enteros positivos.");
      return;
    }

    setError(null);
    setResult(null);
    setIsSubmitting(true);
    try {
      setResult(await getLaptopRecommendations({
        budget: parsedBudget,
        needs: needs.trim(),
        software: software.trim() || null,
        resolution: resolution.trim() || null,
        minimumRamGb: parsedRam,
        minimumStorageGb: parsedStorage,
        requiredGpu: requiredGpu.trim() || null,
      }));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {showBack ? (
          <Pressable accessibilityRole="button" onPress={() => router.back()}>
            <Text style={styles.back}>‹ Inventario</Text>
          </Pressable>
        ) : null}
        <View>
          <Text style={styles.eyebrow}>ASESOR DE LAPTOPS</Text>
          <Text style={styles.title}>Encuentra opciones</Text>
          <Text style={styles.subtitle}>
            Las recomendaciones usan modelos con unidades disponibles y respetan el presupuesto.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Presupuesto máximo (MXN)</Text>
          <TextInput
            accessibilityLabel="Presupuesto máximo en pesos mexicanos"
            keyboardType="decimal-pad"
            onChangeText={setBudget}
            placeholder="Ej. 25000"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={budget}
          />

          <Text style={styles.fieldLabel}>¿Qué necesita el cliente?</Text>
          <TextInput
            accessibilityLabel="Descripción de necesidades"
            multiline
            onChangeText={setNeeds}
            placeholder="Describe el uso o las tareas que realizará"
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.multiline]}
            value={needs}
          />

          <Text style={styles.sectionTitle}>Requisitos opcionales</Text>
          <TextInput
            accessibilityLabel="Software requerido"
            onChangeText={setSoftware}
            placeholder="Software que necesita"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={software}
          />
          <TextInput
            accessibilityLabel="Resolución deseada"
            onChangeText={setResolution}
            placeholder="Resolución de pantalla deseada"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={resolution}
          />
          <View style={styles.numericRow}>
            <TextInput
              accessibilityLabel="RAM mínima en GB"
              keyboardType="number-pad"
              onChangeText={setMinimumRam}
              placeholder="RAM mínima (GB)"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.numericInput]}
              value={minimumRam}
            />
            <TextInput
              accessibilityLabel="Almacenamiento mínimo en GB"
              keyboardType="number-pad"
              onChangeText={setMinimumStorage}
              placeholder="Almacenamiento (GB)"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.numericInput]}
              value={minimumStorage}
            />
          </View>
          <TextInput
            accessibilityLabel="GPU requerida"
            onChangeText={setRequiredGpu}
            placeholder="GPU requerida"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={requiredGpu}
          />
          <Text style={styles.privacyNote}>
            No incluyas nombres, correos ni teléfonos. Solo se envían necesidades y especificaciones
            de modelos; nunca números de serie ni datos de cuenta.
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => void submit()}
            style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.primaryButtonText}>Solicitar recomendación</Text>
            )}
          </Pressable>
        </View>

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {result ? (
          <View style={styles.results}>
            <View style={styles.resultHeader}>
              <Text style={styles.sectionTitle}>Opciones recomendadas</Text>
              <Text style={styles.resultSource}>{result.usedAi ? "Asesor IA" : "Reglas locales"}</Text>
            </View>
            <Text style={styles.resultMessage}>{result.message}</Text>
            {result.recommendations.map((model) => (
              <View key={model.modelId} style={styles.modelCard}>
                <Text style={styles.modelBrand}>{model.brandName}</Text>
                <Text style={styles.modelName}>{model.modelName}</Text>
                <Text style={styles.modelPrice}>{formatPrice(model.price)}</Text>
                <Text style={styles.modelSpec}>{model.processorOrChip}</Text>
                <Text style={styles.modelSpec}>
                  {model.ramGb !== null
                    ? `RAM ${model.ramGb} GB`
                    : model.unifiedMemoryGb !== null
                      ? `Memoria unificada ${model.unifiedMemoryGb} GB`
                      : "Memoria no especificada"}
                  {" · "}{model.storageGb} GB de almacenamiento
                </Text>
                <Text style={styles.modelSpec}>GPU: {model.gpu ?? "No especificada"}</Text>
                <Text style={styles.matchSummary}>{model.matchSummary}</Text>
                {model.limitations.map((limitation) => (
                  <Text key={limitation} style={styles.limitation}>• {limitation}</Text>
                ))}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl },
  back: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 1.8 },
  title: { marginTop: spacing.xs, color: colors.text, fontSize: 27, fontWeight: "800" },
  subtitle: { marginTop: spacing.xs, color: colors.muted, fontSize: 14, lineHeight: 20 },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  fieldLabel: { marginTop: spacing.xs, color: colors.text, fontSize: 13, fontWeight: "700" },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  input: {
    minHeight: 46,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    color: colors.text,
    fontSize: 14,
  },
  multiline: { minHeight: 92, paddingTop: spacing.sm, textAlignVertical: "top" },
  numericRow: { flexDirection: "row", gap: spacing.sm },
  numericInput: { flex: 1 },
  privacyNote: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: colors.surface, fontWeight: "700" },
  error: { color: colors.danger, fontSize: 13 },
  results: { gap: spacing.sm },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resultSource: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  resultMessage: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  modelCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  modelBrand: { color: colors.muted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  modelName: { color: colors.text, fontSize: 16, fontWeight: "700" },
  modelPrice: { color: colors.text, fontSize: 18, fontWeight: "800" },
  modelSpec: { color: colors.muted, fontSize: 13 },
  matchSummary: { marginTop: spacing.xs, color: colors.success, fontSize: 13, lineHeight: 19 },
  limitation: { color: colors.warning, fontSize: 12, lineHeight: 17 },
});
