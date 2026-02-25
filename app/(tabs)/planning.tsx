// app/(tabs)/planning.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Screen from "../../src/ui/Screen";
import { Card, H1, H2, P, Row, Pill, Button } from "../../src/ui/components";
import { theme } from "../../src/ui/theme";
import { useSession } from "../../src/providers/SessionProvider";
import { useHouseholdId } from "../../src/hooks/useHousehold";
import { addMonths } from "../../src/lib/date";
import { formatBRLFromCents, formatDateBRFromYMD } from "../../src/lib/format";
import { getMonthlyNet, listTransactionsByMonth, TxRow } from "../../src/lib/transactions";
import { onTxChanged } from "../../src/lib/bus";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function monthKeyFromDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`; // YYYY-MM
}

function monthLabelFromDate(d: Date) {
  const s = d.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function Planning() {
  const { userId } = useSession();
  const { householdId } = useHouseholdId(userId);

  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const monthKey = useMemo(() => monthKeyFromDate(monthDate), [monthDate]);
  const monthLabel = useMemo(() => monthLabelFromDate(monthDate), [monthDate]);

  const [busy, setBusy] = useState(true);
  const [net, setNet] = useState({ income: 0, expense: 0, net: 0 });
  const [txs, setTxs] = useState<TxRow[]>([]);

  async function load() {
    if (!householdId) return;
    try {
      setBusy(true);
      const [n, t] = await Promise.all([
        getMonthlyNet(householdId, monthKey),
        listTransactionsByMonth(householdId, monthKey),
      ]);
      setNet(n);
      setTxs(t);
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao carregar planejamento.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdId, monthKey]);

  useEffect(() => {
    if (!householdId) return;
    const off = onTxChanged((p) => {
      if (!p?.householdId || p.householdId === householdId) load();
    });
    return off;
  }, [householdId, monthKey]);

  return (
    <Screen>
      <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
        <Pressable onPress={() => setMonthDate((d) => startOfMonth(addMonths(d, -1)))} style={{ padding: 10 }}>
          <Text style={{ color: theme.colors.primary, fontWeight: "900" }}>‹</Text>
        </Pressable>

        <View style={{ alignItems: "center" }}>
          <H1>Planejamento</H1>
          <P muted>{monthLabel}</P>
        </View>

        <Pressable onPress={() => setMonthDate((d) => startOfMonth(addMonths(d, 1)))} style={{ padding: 10 }}>
          <Text style={{ color: theme.colors.primary, fontWeight: "900" }}>›</Text>
        </Pressable>
      </Row>

      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <H2>Resumo do mês</H2>
          <Pill text="por data" />
        </Row>

        {busy ? (
          <Row style={{ gap: 10, paddingTop: 10 }}>
            <ActivityIndicator />
            <P muted>Carregando…</P>
          </Row>
        ) : (
          <>
            <Row style={{ justifyContent: "space-between" }}>
              <P muted>Entradas</P>
              <P>{formatBRLFromCents(net.income)}</P>
            </Row>

            <Row style={{ justifyContent: "space-between" }}>
              <P muted>Saídas</P>
              <P>{formatBRLFromCents(net.expense)}</P>
            </Row>

            <View style={{ height: 6 }} />
            <View style={{ height: 1, backgroundColor: theme.colors.border }} />

            <Row style={{ justifyContent: "space-between" }}>
              <P muted>Saldo</P>
              <Text style={{ color: net.net >= 0 ? theme.colors.good : theme.colors.bad, fontWeight: "900" }}>
                {formatBRLFromCents(net.net)}
              </Text>
            </Row>
          </>
        )}
      </Card>

      <Card intensity={18}>
        <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: theme.colors.text, fontWeight: "900" }}>Lançamentos do mês</Text>
          <Pressable onPress={() => router.push("/(tabs)/add-transaction")}>
            <Text style={{ color: theme.colors.primary, fontWeight: "900" }}>+ Lançar</Text>
          </Pressable>
        </Row>

        {busy ? (
          <Row style={{ gap: 10, paddingTop: 10 }}>
            <ActivityIndicator />
            <P muted>Carregando lançamentos…</P>
          </Row>
        ) : txs.length ? (
          txs.slice(0, 30).map((t) => {
            const isIncome = t.type === "income";
            const sign = isIncome ? "+" : "-";
            const color = isIncome ? theme.colors.good : theme.colors.bad;
            const cat = t.category?.name || "Sem categoria";
            return (
              <View key={t.id} style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ maxWidth: "70%" }}>
                    <Text style={{ color: theme.colors.text, fontWeight: "900" }}>{cat}</Text>
                    <Text style={{ color: theme.colors.muted, fontWeight: "700", marginTop: 4 }}>
                      {formatDateBRFromYMD(t.occurred_on)}
                      {t.note ? ` • ${t.note}` : ""}
                    </Text>
                  </View>

                  <Text style={{ color, fontWeight: "900" }}>
                    {sign} {formatBRLFromCents(t.amount_cents)}
                  </Text>
                </Row>
              </View>
            );
          })
        ) : (
          <P muted style={{ marginTop: 10 }}>
            Nenhum lançamento nesse mês ainda.
          </P>
        )}

        <View style={{ height: 10 }} />
        <Button title="Lançar agora" onPress={() => router.push("/(tabs)/add-transaction")} />
      </Card>
    </Screen>
  );
}
