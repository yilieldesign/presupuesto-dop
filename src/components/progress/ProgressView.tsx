"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatDOP } from "@/lib/currency/format";
import { EXPENSE_CATEGORIES } from "@/lib/budget/categories";
import {
  getOriginalDebtTotal,
  getTotalDebtBalance,
} from "@/lib/budget/stats";
import type { AppState } from "@/types";
import { Card } from "@/components/ui/Card";
import { MonthlyCashflowCard } from "./MonthlyCashflowCard";

const CHART_COLORS = [
  "#007aff",
  "#34c759",
  "#ff9500",
  "#ff3b30",
  "#af52de",
  "#5ac8fa",
  "#ff2d55",
  "#8e8e93",
];

interface ProgressViewProps {
  state: AppState;
}

export function ProgressView({ state }: ProgressViewProps) {
  const debtHistory = buildDebtHistory(state);
  const expenseData = buildExpenseDistribution(state);

  return (
    <div className="space-y-4 pb-4">
      <MonthlyCashflowCard transactions={state.transactions} />

      <Card>
        <h3 className="mb-3 text-sm font-semibold">Reducción de deuda</h3>
        {debtHistory.length < 2 ? (
          <p className="text-sm text-[var(--ios-muted)]">
            Aplica inyecciones desde el Optimizador para ver la curva de
            progreso.
          </p>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={debtHistory}>
                <defs>
                  <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#007aff" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#007aff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#8e8e93" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#8e8e93" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => [formatDOP(value), "Deuda"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#007aff"
                  strokeWidth={2}
                  fill="url(#debtGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold">Gastos por categoría</h3>
        {expenseData.length === 0 ? (
          <p className="text-sm text-[var(--ios-muted)]">
            Registra gastos en Presupuesto para ver la distribución.
          </p>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {expenseData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatDOP(value)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
              {expenseData.map((d, i) => (
                <span
                  key={d.name}
                  className="text-[10px] text-[var(--ios-muted)]"
                >
                  <span
                    className="mr-1 inline-block h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                  {d.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card padding="sm">
        <p className="text-xs text-[var(--ios-muted)]">Deuda actual total</p>
        <p className="text-xl font-bold">
          {formatDOP(getTotalDebtBalance(state.debts, state.exchangeRate))}
        </p>
        <p className="mt-1 text-xs text-[var(--ios-muted)]">
          {state.injections.length} inyecciones registradas
        </p>
      </Card>
    </div>
  );
}

function buildDebtHistory(state: AppState) {
  const original = getOriginalDebtTotal(state.debts, state.exchangeRate);
  if (original <= 0) return [];

  const points: { label: string; balance: number }[] = [
    { label: "Inicio", balance: original },
  ];

  let running = original;
  const sorted = [...state.injections].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sorted.forEach((inj, i) => {
    running = Math.max(0, running - inj.totalToDebts);
    points.push({
      label: `#${i + 1}`,
      balance: running,
    });
  });

  const current = getTotalDebtBalance(state.debts, state.exchangeRate);
  if (points[points.length - 1].balance !== current) {
    points.push({ label: "Hoy", balance: current });
  }

  return points;
}

function buildExpenseDistribution(state: AppState) {
  const map = new Map<string, number>();

  state.transactions
    .filter((t) => t.type === "expense" && t.category)
    .forEach((t) => {
      const key = t.category!;
      map.set(key, (map.get(key) ?? 0) + t.amount);
    });

  return Array.from(map.entries()).map(([id, value]) => ({
    name: EXPENSE_CATEGORIES.find((c) => c.id === id)?.label ?? id,
    value,
  }));
}
