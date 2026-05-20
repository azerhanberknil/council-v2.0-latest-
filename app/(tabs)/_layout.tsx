import { Redirect, Tabs } from "expo-router";

import { SymbolIcon } from "@/components/symbol-icon";
import { colors } from "@/constants/theme";
import { useDecisionStore } from "@/context/decision-store";
import { useCopy } from "@/lib/i18n";

export default function TabLayout() {
  const { settings } = useDecisionStore();
  const text = useCopy(settings.language);

  if (settings.authMode === "signed-out") return <Redirect href="/auth" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        sceneStyle: { backgroundColor: colors.paper },
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.faintInk,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.softLine,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Council",
          tabBarLabel: text.today,
          tabBarIcon: ({ color, size }) => (
            <SymbolIcon name="house" color={color} size={size} fallback="H" />
          ),
        }}
      />
      <Tabs.Screen
        name="decisions"
        options={{
          title: text.decisions,
          tabBarLabel: text.decisions,
          tabBarIcon: ({ color, size }) => (
            <SymbolIcon name="tray.full" color={color} size={size} fallback="D" />
          ),
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: text.review,
          tabBarLabel: text.review,
          tabBarIcon: ({ color, size }) => (
            <SymbolIcon name="clock.arrow.circlepath" color={color} size={size} fallback="R" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: text.settings,
          tabBarLabel: text.settings,
          tabBarIcon: ({ color, size }) => (
            <SymbolIcon name="gearshape" color={color} size={size} fallback="S" />
          ),
        }}
      />
    </Tabs>
  );
}
