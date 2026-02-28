"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENCY_SYMBOL } from "@/lib/constants";

interface ExpenseBreakdownChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
}

const COLORS = [
  "#ef4444",
  "#f59e0b",
  "#0ea5e9",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#84cc16",
  "#ec4899",
  "#06b6d4",
];

export function ExpenseBreakdownChart({ data }: ExpenseBreakdownChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Expense Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
            No expense data for selected month.
          </div>
        ) : (
          <>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" outerRadius={88} dataKey="value">
                    {data.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `${CURRENCY_SYMBOL}${value.toLocaleString("en-IN")}`}
                    contentStyle={{
                      borderRadius: "14px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                      backdropFilter: "blur(14px)",
                      opacity: 1,
                    }}
                    labelStyle={{
                      color: "hsl(var(--popover-foreground))",
                      fontWeight: 600,
                    }}
                    itemStyle={{
                      color: "hsl(var(--popover-foreground))",
                    }}
                    wrapperStyle={{
                      outline: "none",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
              {data.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-foreground/85">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    {entry.name}
                  </span>
                  <span className="font-medium text-foreground/85">
                    {CURRENCY_SYMBOL}
                    {entry.value.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
