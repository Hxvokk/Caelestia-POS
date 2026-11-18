import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../config/theme";

type ScreenStateProps = {
  title: string;
  description?: string;
  loading?: boolean;
};

export function ScreenState({
  title,
  description,
  loading = false,
}: ScreenStateProps) {
  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator size="large" color={colors.primary} /> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  title: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
