// src/ui/drawer.tsx
import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "./theme";
import { supabase } from "../lib/supabase";

type DrawerCtx = {
  open: boolean;
  progress: Animated.Value;
  drawerW: number;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
};

type DrawerItem = {
  label: string;
  route: string;
  icon: any;
  danger?: boolean;
};

type DrawerSection = {
  title?: string;
  items: DrawerItem[];
};

const Ctx = createContext<DrawerCtx | null>(null);

export function useDrawer() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDrawer must be used inside DrawerProvider");
  return v;
}

export function useDrawerOptional() {
  return useContext(Ctx);
}

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const W = Dimensions.get("window").width;
  const drawerW = Math.min(310, Math.round(W * 0.74));

  const [open, setOpen] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  function openDrawer() {
    setOpen(true);
    Animated.timing(progress, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }

  function closeDrawer() {
    Animated.timing(progress, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setOpen(false);
    });
  }

  function toggleDrawer() {
    if (open) closeDrawer();
    else openDrawer();
  }

  const value = useMemo(
    () => ({ open, progress, drawerW, openDrawer, closeDrawer, toggleDrawer }),
    [open, progress, drawerW]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function DrawerHost() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { open, progress, drawerW, closeDrawer } = useDrawer();

  const drawerX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-drawerW, 0],
  });

  const overlayOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
  });

  // deixa o overlay NÃO cobrir o drawer (fica só no conteúdo)
  const overlayX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, drawerW],
  });

  function isActive(route: string) {
    return pathname === route;
  }

  const sections: DrawerSection[] = [
    {
      title: "Principal",
      items: [
        { label: "Início", route: "/(tabs)/home", icon: "home-outline" },
        { label: "Metas", route: "/(tabs)/goals", icon: "trophy-outline" },
        { label: "Planejamento", route: "/(tabs)/planning", icon: "calendar-outline" },
      ],
    },
    {
      title: "Gestão",
      items: [
        { label: "Fechamentos", route: "/(tabs)/closures", icon: "checkmark-done-outline" },
        { label: "Cartões", route: "/(tabs)/cards", icon: "card-outline" },
        { label: "Histórico", route: "/(tabs)/history", icon: "time-outline" },
      ],
    },
  ];

  async function onPress(it: DrawerItem) {
    closeDrawer();
    setTimeout(() => router.push(it.route), 80);
  }

  const initials = "F";
  const bottomSafe = insets.bottom + 24;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {/* Overlay */}
      <Animated.View
        pointerEvents={open ? "auto" : "none"}
        style={[
          StyleSheet.absoluteFill,
          {
            zIndex: 40,
            elevation: 40,
            backgroundColor: "#000",
            opacity: overlayOpacity,
            transform: [{ translateX: overlayX }],
          },
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={closeDrawer} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        pointerEvents={open ? "auto" : "none"}
        style={[
          styles.drawer,
          {
            width: drawerW,
            transform: [{ translateX: drawerX }],
          },
        ]}
      >
        {/* ✅ IMPORTANTÍSSIMO: View sólida como base (não fica transparente no Android) */}
        <View style={[styles.drawerInner, { paddingTop: insets.top + 12 }]}>
          {/* Blur só como “camada extra” (iOS fica lindo, Android às vezes falha) */}
          {Platform.OS === "ios" ? (
            <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFill} />
          ) : null}

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={styles.title}>FinApp</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>MVP</Text>
                </View>
              </View>
              <Text style={styles.subtitle}>Seu controle financeiro</Text>
            </View>

            <Pressable onPress={closeDrawer} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={18} color={theme.colors.text} />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Conteúdo */}
          <Animated.ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingTop: 12,
              paddingBottom: bottomSafe,
            }}
            showsVerticalScrollIndicator={false}
          >
            {sections.map((sec, idx) => (
              <View key={`${sec.title ?? "sec"}-${idx}`} style={{ marginBottom: 14 }}>
                {sec.title ? <Text style={styles.sectionTitle}>{sec.title}</Text> : null}

                <View style={{ marginTop: 8, gap: 10 }}>
                  {sec.items.map((it) => {
                    const active = isActive(it.route);

                    const iconColor = active ? theme.colors.primary : theme.colors.text;
                    const labelColor = active ? theme.colors.primary : theme.colors.text;

                    return (
                      <Pressable
                        key={`${sec.title}-${it.label}`}
                        onPress={() => onPress(it)}
                        style={[styles.item, active && styles.itemActive]}
                      >
                        <View
                          style={[
                            styles.iconWrap,
                            active && {
                              borderColor: "rgba(0,240,255,0.35)",
                              backgroundColor: "rgba(0,240,255,0.10)",
                            },
                          ]}
                        >
                          <Ionicons name={it.icon} size={18} color={iconColor} />
                        </View>

                        <Text style={[styles.itemText, { color: labelColor }]}>{it.label}</Text>

                        <View style={{ flex: 1 }} />

                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={active ? theme.colors.primary : "rgba(231,234,243,0.55)"}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}

            <View style={{ height: 14 }} />
            <Text style={styles.footer}>v0.1 • MVP</Text>
          </Animated.ScrollView>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 50,
    elevation: 50,
    shadowColor: "#000",
    shadowOpacity: 1,
    shadowRadius: 22,
    shadowOffset: { width: 10, height: 0 },
  },

  // ✅ Fundo sólido garantido
  drawerInner: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: theme.colors.bg0, // <- isso mata o “transparente”
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.10)",
  },

  header: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(0,240,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,240,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: theme.colors.primary, fontWeight: "900", fontSize: 16 },
  title: { color: theme.colors.text, fontWeight: "900", fontSize: 16 },
  subtitle: { color: theme.colors.muted, fontWeight: "800", marginTop: 2, fontSize: 12 },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  badgeText: { color: theme.colors.muted, fontWeight: "900", fontSize: 10, letterSpacing: 0.6 },

  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  divider: {
    height: 1,
    marginHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  sectionTitle: {
    color: "rgba(231,234,243,0.55)",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  itemActive: {
    borderColor: "rgba(0,240,255,0.40)",
    backgroundColor: "rgba(0,240,255,0.08)",
  },

  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },

  itemText: { fontWeight: "900", fontSize: 14 },

  footer: {
    color: theme.colors.muted2,
    fontWeight: "800",
    textAlign: "center",
  },
});
