// app/(tabs)/home.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Screen from "../../src/ui/Screen";
import SideMenu from "../../src/ui/SideMenu";
import ProfileAvatarMenu from "../../src/ui/ProfileAvatarMenu";
import { Button, Card, H1, P, Row } from "../../src/ui/components";
import { theme } from "../../src/ui/theme";
import { useSession } from "../../src/providers/SessionProvider";
import { useHouseholdId } from "../../src/hooks/useHousehold";
import { formatBRLFromCents } from "../../src/lib/format";
import { getMonthlyNet } from "../../src/lib/transactions";
import { listGoals, Goal } from "../../src/lib/goals";
import { onTxChanged, onGoalsChanged } from "../../src/lib/bus";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function pct(p: number) {
  return `${Math.round(clamp01(p) * 100)}%`;
}

function ProgressBar({ value }: { value: number }) {
  const p = clamp01(value);
  return (
    <View
      style={{
        height: 8,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.08)",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <View
        style={{
          width: `${p * 100}%`,
          height: "100%",
          borderRadius: 999,
          backgroundColor: theme.colors.primary,
        }}
      />
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
        backgroundColor: "rgba(255,255,255,0.03)",
        flex: 1,
      }}
    >
      <Text style={{ color: theme.colors.muted, fontWeight: "800", fontSize: 12 }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontWeight: "900", fontSize: 15, marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
      <Text style={{ color: theme.colors.text, fontWeight: "900", fontSize: 16 }}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={{ paddingVertical: 6, paddingHorizontal: 10 }}>
          <Text style={{ color: theme.colors.primary, fontWeight: "900" }}>{actionLabel}</Text>
        </Pressable>
      ) : (
        <View />
      )}
    </Row>
  );
}

export default function HomeTab() {
  const { userId } = useSession();
  const { householdId, loading: hhLoading } = useHouseholdId(userId);

  const [busy, setBusy] = useState(true);
  const [net, setNet] = useState<{ income: number; expense: number; net: number }>({
    income: 0,
    expense: 0,
    net: 0,
  });

  const [goals, setGoals] = useState<Goal[]>([]);

  const topGoals = useMemo(() => {
    const arr = [...(goals ?? [])];
    arr.sort((a: any, b: any) => String(a.desired_date || "").localeCompare(String(b.desired_date || "")));
    return arr.slice(0, 3);
  }, [goals]);

  const load = useCallback(async () => {
    if (!householdId) return;
    try {
      setBusy(true);
      const [m, g] = await Promise.all([getMonthlyNet(householdId), listGoals(householdId)]);
      setNet(m);
      setGoals(g);
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao carregar dados.");
    } finally {
      setBusy(false);
    }
  }, [householdId]);

  useEffect(() => {
    if (!hhLoading && householdId) load();
  }, [hhLoading, householdId, load]);

  useEffect(() => {
    const off1 = onTxChanged(() => load());
    const off2 = onGoalsChanged(() => load());
    return () => {
      try {
        off1?.();
        off2?.();
      } catch {}
    };
  }, [load]);

  const netLabelColor = net.net > 0 ? theme.colors.good : net.net < 0 ? theme.colors.bad : theme.colors.text;

  return (
    <Screen>
      {/* Header */}
      <Row style={{ alignItems: "center", justifyContent: "space-between" }}>
        <Row style={{ alignItems: "center", gap: 12, flex: 1 }}>
          <SideMenu />
          <View style={{ flex: 1 }}>
            <H1>Início</H1>
            <P muted>Visão rápida do mês e das suas metas.</P>
          </View>
        </Row>

        {/* Avatar menu (Perfil + Sair) */}
        <ProfileAvatarMenu />
      </Row>

      {/* RESUMO */}
      <Card intensity={18}>
        <SectionHeader title="Resumo do mês" actionLabel="Ver histórico" onAction={() => router.push("/(tabs)/history")} />

        <View style={{ height: 10 }} />

        <Text style={{ color: theme.colors.muted, fontWeight: "800" }}>Saldo do mês</Text>
        <Text style={{ color: netLabelColor, fontWeight: "900", fontSize: 30, marginTop: 6 }}>
          {formatBRLFromCents(net.net)}
        </Text>

        <View style={{ height: 12 }} />

        <Row style={{ gap: 10 }}>
          <StatPill label="Entradas" value={formatBRLFromCents(net.income)} />
          <StatPill label="Saídas" value={formatBRLFromCents(net.expense)} />
        </Row>

        <View style={{ height: 14 }} />

        <Row style={{ gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button title="+ Lançar" onPress={() => router.push("/(tabs)/add-transaction")} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Metas" onPress={() => router.push("/(tabs)/goals")} />
          </View>
        </Row>

        <View style={{ height: 10 }} />

        <Row style={{ gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button title="Cartões" onPress={() => router.push("/(tabs)/cards")} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Planejamento" onPress={() => router.push("/(tabs)/planning")} />
          </View>
        </Row>
      </Card>

      {/* METAS (TOP 3) */}
      <Card intensity={18}>
        <SectionHeader
          title="Metas em destaque"
          actionLabel={goals.length ? "Ver todas" : undefined}
          onAction={() => router.push("/(tabs)/goals")}
        />

        <View style={{ height: 8 }} />

        {busy ? (
          <Row style={{ gap: 10, paddingVertical: 8 }}>
            <ActivityIndicator />
            <P muted>Carregando…</P>
          </Row>
        ) : !goals.length ? (
          <View style={{ paddingTop: 8 }}>
            <P muted>Você ainda não tem metas.</P>
            <View style={{ height: 12 }} />
            <Button title="Criar minha primeira meta" onPress={() => router.push("/(tabs)/goals")} />
          </View>
        ) : (
          <View>
            {topGoals.map((g: any) => {
              const current = Number(g.current_cents ?? 0) || 0;
              const target = Math.max(1, Number(g.target_cents ?? 1) || 1);
              const progress = current / target;
              const missing = Math.max(0, target - current);

              return (
                <Pressable
                  key={g.id}
                  onPress={() => router.push("/(tabs)/goals")}
                  style={{
                    paddingVertical: 12,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                  }}
                >
                  <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={{ color: theme.colors.text, fontWeight: "900" }}>{g.title}</Text>

                      <Text style={{ color: theme.colors.muted, fontWeight: "800", marginTop: 4 }}>
                        {pct(progress)} • faltam {formatBRLFromCents(missing)}
                      </Text>

                      <View style={{ height: 10 }} />
                      <ProgressBar value={progress} />
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ color: theme.colors.text, fontWeight: "900" }}>{formatBRLFromCents(current)}</Text>
                      <Text style={{ color: theme.colors.muted, fontWeight: "800", marginTop: 4 }}>
                        de {formatBRLFromCents(target)}
                      </Text>
                    </View>
                  </Row>
                </Pressable>
              );
            })}

            {goals.length > 3 ? (
              <View style={{ marginTop: 12 }}>
                <Button title="Ver todas as metas" onPress={() => router.push("/(tabs)/goals")} />
              </View>
            ) : null}
          </View>
        )}
      </Card>

      {!busy && householdId ? (
        <Text style={{ color: theme.colors.muted2, fontWeight: "700", textAlign: "center", marginTop: 4 }}>
          {goals.length} metas • atualizado automaticamente
        </Text>
      ) : null}
    </Screen>
  );
}
