// src/ui/SideMenu.tsx
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "./theme";
import { useDrawerOptional } from "./drawer";

export default function SideMenu() {
  const drawer = useDrawerOptional();
  if (!drawer) return null;

  return (
    <Pressable onPress={drawer.toggleDrawer} style={styles.btn} hitSlop={10}>
      <BlurView intensity={18} tint="dark" style={styles.inner}>
        <Ionicons name="menu" size={20} color={theme.colors.text} />
      </BlurView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 44, height: 44, borderRadius: 16, overflow: "hidden" },
  inner: {
    flex: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
});
