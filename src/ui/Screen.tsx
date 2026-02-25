// src/ui/Screen.tsx
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "./theme";

export default function Screen({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const insets = useSafeAreaInsets();

  const contentStyle = [
    styles.content,
    {
      paddingTop: insets.top + 16,
      paddingBottom: insets.bottom + 20,
    },
  ];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[theme.colors.bg0, theme.colors.bg1]}
        style={StyleSheet.absoluteFill}
      />

      {scroll ? (
        <ScrollView
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={contentStyle}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    // ✅ isso aqui é o que “desgrudou” tudo de novo
    gap: 14,
  },
});
