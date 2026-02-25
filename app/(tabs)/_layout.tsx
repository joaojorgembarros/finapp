// app/(tabs)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/ui/theme";
import { DrawerHost, DrawerProvider, useDrawer } from "../../src/ui/drawer";

function TabsShell() {
  const { open } = useDrawer();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.bg1,
            borderTopColor: theme.colors.border,
            // ✅ quando abre o menu, some a tabbar (não mistura com "Sair")
            display: open ? "none" : "flex",
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.muted,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Início",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="planning"
          options={{
            title: "Planejamento",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="goals"
          options={{
            title: "Metas",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trophy-outline" size={size} color={color} />
            ),
          }}
        />

        {/* Rotas que ficam no menu lateral / escondidas */}
        <Tabs.Screen name="history" options={{ href: null }} />
        <Tabs.Screen name="closures" options={{ href: null }} />
        <Tabs.Screen name="cards" options={{ href: null }} />
        <Tabs.Screen name="new-card-charge" options={{ href: null }} />

        {/* hidden */}
        <Tabs.Screen name="add-transaction" options={{ href: null }} />
        <Tabs.Screen name="create-household" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="categories" options={{ href: null }} />
      </Tabs>

      <DrawerHost />
    </>
  );
}

export default function TabsLayout() {
  return (
    <DrawerProvider>
      <TabsShell />
    </DrawerProvider>
  );
}
