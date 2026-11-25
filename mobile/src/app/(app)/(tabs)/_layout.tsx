import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../../shared/config/theme";

export default function MainTabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarStyle: {
          height: 68 + insets.bottom,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: bottomInset,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={22}
              color={focused ? colors.primary : colors.muted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Catálogo",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "laptop" : "laptop-outline"}
              size={22}
              color={focused ? colors.primary : colors.muted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Ventas",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "receipt" : "receipt-outline"}
              size={22}
              color={focused ? colors.primary : colors.muted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="advisor"
        options={{
          title: "Asesor",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "sparkles" : "sparkles-outline"}
              size={22}
              color={focused ? colors.primary : colors.muted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={22}
              color={focused ? colors.primary : colors.muted}
            />
          ),
        }}
      />
    </Tabs>
  );
}
