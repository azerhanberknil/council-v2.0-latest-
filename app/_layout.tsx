import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { colors } from "@/constants/theme";
import { DecisionProvider, useDecisionStore } from "@/context/decision-store";
import { useCopy } from "@/lib/i18n";

export default function RootLayout() {
  return (
    <DecisionProvider>
      <RootStack />
    </DecisionProvider>
  );
}

function RootStack() {
  const { settings } = useDecisionStore();
  const text = useCopy(settings.language);
  const statusStyle = settings.theme === "dark" ? "light" : "dark";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.backgroundColor = colors.paper;
    document.body.style.backgroundColor = colors.paper;
    document.body.style.color = colors.ink;
  }, [settings.theme]);

  return (
    <>
      <StatusBar style={statusStyle} backgroundColor={colors.paper} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.paper },
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          contentStyle: { backgroundColor: colors.paper },
        }}
      >
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="new-decision"
          options={{
            title: text.newDecision,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="decision/[id]"
          options={{
            title: text.councilSession,
          }}
        />
      </Stack>
    </>
  );
}
