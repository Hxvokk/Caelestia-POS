import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../../../shared/config/theme";

function CaelestiaBrand() {
  return (
    <View accessibilityLabel="Caelestia POS" accessible style={styles.brandLockup}>
      <Svg height={38} viewBox="0 0 48 40" width={46}>
        <Defs>
          <LinearGradient id="caelestiaC" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor="#8FD8FF" />
            <Stop offset="1" stopColor="#2F7BEA" />
          </LinearGradient>
          <LinearGradient id="caelestiaRing" x1="0" x2="1" y1="1" y2="0">
            <Stop offset="0" stopColor="#4FA3F7" />
            <Stop offset="1" stopColor="#7CC8FF" />
          </LinearGradient>
        </Defs>
        <G origin="24,20" rotation="-26">
          <Path
            d="M3 20A21 7 0 0 1 45 20"
            fill="none"
            stroke="#3B83E6"
            strokeLinecap="round"
            strokeWidth={2.6}
          />
        </G>
        <Path
          d="M30.4 13.6A9 9 0 1 0 30.4 26.4"
          fill="none"
          stroke="url(#caelestiaC)"
          strokeLinecap="round"
          strokeWidth={5}
        />
        <G origin="24,20" rotation="-26">
          <Path
            d="M3 20A21 7 0 0 0 45 20"
            fill="none"
            stroke="url(#caelestiaRing)"
            strokeLinecap="round"
            strokeWidth={3.6}
          />
        </G>
      </Svg>
      <Text numberOfLines={1} style={styles.brand}>
        Caelestia <Text style={styles.brandAccent}>POS</Text>
      </Text>
    </View>
  );
}

export function HomeFrame({
  children,
  promoState = "normal",
}: {
  children: ReactNode;
  promoState?: "normal" | "loading" | "hidden";
}) {
  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <View style={styles.header}>
        <View pointerEvents="none" style={styles.headerArtwork}>
          <View style={styles.headerSweep} />
          <View style={styles.headerFacet} />
          <View style={styles.headerGlow} />
        </View>
        <View style={styles.brandRow}>
          <CaelestiaBrand />
          <Pressable
            accessibilityLabel="Abrir perfil"
            accessibilityRole="button"
            onPress={() => router.push("/profile")}
            style={styles.profileButton}
          >
            <Ionicons name="person-outline" size={23} color={colors.surface} />
          </Pressable>
        </View>
        <Text style={styles.pageTitle}>Inicio</Text>
        <Text style={styles.pageSubtitle}>Gestiona tu punto de venta</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {promoState === "normal" ? <PromoBanner /> : null}
        {promoState === "loading" ? <PromoSkeleton /> : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function PromoBanner() {
  return (
    <View style={styles.promo}>
      <View pointerEvents="none" style={styles.promoArtwork}>
        <View style={styles.promoOrb} />
        <View style={styles.promoFacet} />
      </View>
      <View style={styles.promoCopy}>
        <Text style={styles.promoTitle}>Consulta y vende laptops fácilmente</Text>
        <Text style={styles.promoDescription}>
          Catálogo, carrito y ventas en un solo lugar.
        </Text>
      </View>
      <View style={styles.laptopIllustration}>
        <View style={styles.laptopHalo} />
        <Ionicons name="laptop-outline" size={72} color={colors.accent} />
        <View style={styles.laptopGlow} />
      </View>
    </View>
  );
}

export function HomeSectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function HomeMetricCard({
  title,
  value,
  description,
  icon,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  tone: "blue" | "indigo" | "green" | "teal";
}) {
  return (
    <View style={[styles.metricCard, styles[`metric${tone}`]]}>
      <Ionicons name={icon} size={23} color={colors.primary} />
      <Text style={styles.metricTitle}>{title}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.metricValue}>
        {value}
      </Text>
      <Text style={styles.metricDescription}>{description}</Text>
    </View>
  );
}

export function HomeActionCard({
  icon,
  title,
  description,
  onPress,
  style,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  description: string;
  onPress: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.actionCard, style, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={27} color={colors.primary} />
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

export function HomeErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.errorState}>
      <View style={styles.errorIcon}>
        <Ionicons name="laptop-outline" size={58} color={colors.muted} />
        <View style={styles.errorBadge}>
          <Ionicons name="alert" size={17} color={colors.surface} />
        </View>
      </View>
      <Text style={styles.errorTitle}>No se pudo cargar el inicio</Text>
      <Text style={styles.errorDescription}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
      >
        <Ionicons name="refresh" size={19} color={colors.surface} />
        <Text style={styles.retryText}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

export function HomeSkeleton({ children }: { children: ReactNode }) {
  return (
    <View style={styles.skeletonContent}>
      {children}
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonMetric} />
        <View style={styles.skeletonMetric} />
      </View>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonMetric} />
        <View style={styles.skeletonMetric} />
      </View>
    </View>
  );
}

function PromoSkeleton() {
  return (
    <View style={styles.promoSkeleton}>
      <View style={styles.skeletonCopy}>
        <View style={styles.skeletonLineWide} />
        <View style={styles.skeletonLineMedium} />
        <View style={styles.skeletonLineShort} />
      </View>
      <View style={styles.skeletonImage} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy },
  header: {
    position: "relative",
    overflow: "hidden",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.navy,
  },
  headerArtwork: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
  },
  headerSweep: {
    position: "absolute",
    top: -172,
    right: -66,
    width: 276,
    height: 348,
    borderRadius: 170,
    backgroundColor: colors.navyMid,
    transform: [{ rotate: "34deg" }],
  },
  headerFacet: {
    position: "absolute",
    top: -118,
    right: 94,
    width: 122,
    height: 306,
    borderRadius: 90,
    backgroundColor: colors.navyHighlight,
    opacity: 0.42,
    transform: [{ rotate: "34deg" }],
  },
  headerGlow: {
    position: "absolute",
    right: -95,
    bottom: -144,
    width: 250,
    height: 210,
    borderRadius: 130,
    backgroundColor: colors.indigoLight,
    opacity: 0.38,
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  brandLockup: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  brandMark: { width: 46, height: 38 },
  brand: { flexShrink: 1, color: colors.surface, fontSize: 19, fontWeight: "800" },
  brandAccent: { color: colors.accent },
  profileButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#FFFFFF24",
  },
  pageTitle: { marginTop: spacing.sm, color: colors.surface, fontSize: 30, fontWeight: "800" },
  pageSubtitle: { color: "#E7ECF7", fontSize: 15 },
  content: {
    flexGrow: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.surface,
  },
  promo: {
    position: "relative",
    minHeight: 148,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    overflow: "hidden",
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.indigo,
  },
  promoArtwork: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    borderRadius: 18,
  },
  promoOrb: {
    position: "absolute",
    right: -72,
    bottom: -138,
    width: 240,
    height: 230,
    borderRadius: 130,
    backgroundColor: colors.primary,
    opacity: 0.45,
  },
  promoFacet: {
    position: "absolute",
    top: -102,
    right: 82,
    width: 96,
    height: 260,
    borderRadius: 80,
    backgroundColor: colors.indigoLight,
    opacity: 0.7,
    transform: [{ rotate: "34deg" }],
  },
  promoCopy: { flex: 1, gap: spacing.sm },
  promoTitle: { color: colors.surface, fontSize: 19, fontWeight: "800", lineHeight: 24 },
  promoDescription: { color: "#E5E9FF", fontSize: 13, lineHeight: 18 },
  laptopIllustration: {
    position: "relative",
    width: 86,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  laptopHalo: {
    position: "absolute",
    width: 82,
    height: 82,
    borderRadius: 45,
    backgroundColor: colors.accent,
    opacity: 0.12,
  },
  laptopGlow: {
    position: "absolute",
    right: 0,
    bottom: 4,
    width: 62,
    height: 12,
    borderRadius: 20,
    backgroundColor: colors.primary,
    opacity: 0.42,
  },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "800" },
  metricCard: {
    flex: 1,
    minHeight: 138,
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  metricblue: { backgroundColor: colors.blueBackground },
  metricindigo: { backgroundColor: colors.indigoBackground },
  metricgreen: { backgroundColor: colors.successBackground },
  metricteal: { backgroundColor: colors.tealBackground },
  metricTitle: { color: colors.text, fontSize: 13, fontWeight: "700" },
  metricValue: { color: colors.primaryDark, fontSize: 22, fontWeight: "800" },
  metricDescription: { color: colors.muted, fontSize: 11, lineHeight: 15 },
  actionCard: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  actionCopy: { flex: 1, gap: 3 },
  actionTitle: { color: colors.text, fontSize: 14, fontWeight: "800" },
  actionDescription: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  pressed: { opacity: 0.72 },
  errorState: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  errorIcon: { position: "relative", padding: spacing.md },
  errorBadge: {
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
  errorTitle: { color: colors.text, fontSize: 19, fontWeight: "800", textAlign: "center" },
  errorDescription: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: "center" },
  retryButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    alignSelf: "stretch",
    marginTop: spacing.sm,
    borderRadius: 11,
    backgroundColor: colors.primary,
  },
  retryText: { color: colors.surface, fontSize: 15, fontWeight: "800" },
  skeletonContent: { gap: spacing.md },
  promoSkeleton: {
    minHeight: 148,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: "#E6ECF5",
  },
  skeletonCopy: { flex: 1, gap: spacing.sm },
  skeletonLineWide: {
    width: "90%",
    height: 14,
    borderRadius: 7,
    backgroundColor: "#BECBE0",
  },
  skeletonLineMedium: {
    width: "78%",
    height: 14,
    borderRadius: 7,
    backgroundColor: "#BECBE0",
  },
  skeletonLineShort: {
    width: "58%",
    height: 14,
    borderRadius: 7,
    backgroundColor: "#BECBE0",
  },
  skeletonImage: {
    width: 74,
    height: 74,
    borderRadius: 14,
    backgroundColor: "#BECBE0",
  },
  skeletonRow: { flexDirection: "row", gap: spacing.md },
  skeletonMetric: {
    flex: 1,
    height: 138,
    borderRadius: 15,
    backgroundColor: "#E5EBF4",
  },
});
