"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENCY_SYMBOL } from "@/lib/constants";

interface IncomeExpenseChartProps {
  data: Array<{
    month: string;
    income: number;
    expense: number;
  }>;
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Income vs Expense (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 6" stroke="rgba(148, 163, 184, 0.22)" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => `${CURRENCY_SYMBOL}${value.toLocaleString("en-IN")}`}
              contentStyle={{
                borderRadius: "14px",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--popover))",
                color: "hsl(var(--popover-foreground))",
                backdropFilter: "blur(14px)",
              }}
            />
            <Bar dataKey="income" fill="#22c55e" radius={[10, 10, 0, 0]} />
            <Bar dataKey="expense" fill="#f87171" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
