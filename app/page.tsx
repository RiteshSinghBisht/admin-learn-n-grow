"use client";

import {
  Database,
  MessageCircle,
  MessageSquare,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Wallet,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { ToolCard } from "@/components/dashboard/tool-card";
import { AnnouncementCard } from "@/components/dashboard/announcement-card";
import { Card, CardContent } from "@/components/ui/card";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { calculateDashboardMetrics } from "@/lib/dashboard-metrics";
import { useAppData } from "@/components/providers/app-data-provider";

function formatCurrency(amount: number) {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString("en-IN")}`;
}

export default function DashboardPage() {
  const { students, finances, loading } = useAppData();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Loading dashboard...</CardContent>
      </Card>
    );
  }

  const metrics = calculateDashboardMetrics(finances, students);

  return (
    <div className="space-y-9">
      <div>
        <h1 className="page-title text-gradient">Dashboard</h1>
        <p className="page-subtitle">Control center for your coaching business</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          icon={TrendingUp}
          accentClass="bg-gradient-to-br from-emerald-500 to-emerald-600"
          subtitle="Paid income this month"
        />
        <MetricCard
          title="Total Expenses"
          value={formatCurrency(metrics.totalExpenses)}
          icon={TrendingDown}
          accentClass="bg-gradient-to-br from-rose-500 to-rose-600"
          subtitle="All expenses this month"
        />
        <MetricCard
          title="Net Profit"
          value={formatCurrency(metrics.netProfit)}
          icon={Wallet}
          accentClass="bg-gradient-to-br from-blue-500 to-indigo-500"
          subtitle="Revenue minus expenses"
        />
        <MetricCard
          title="Active Students"
          value={String(metrics.activeStudents)}
          icon={UserCheck}
          accentClass="bg-gradient-to-br from-slate-600 to-slate-700"
          subtitle="Currently enrolled"
        />
        <MetricCard
          title="Fees Pending"
          value={formatCurrency(metrics.feesPending)}
          icon={Wallet}
          accentClass="bg-gradient-to-br from-amber-500 to-orange-500"
          subtitle="Pending student payments"
        />
      </section>

      <section className="rounded-3xl border border-border/80 bg-white/50 p-5 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.03] md:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Quick Access</h2>
            <p className="mt-1 text-sm text-muted-foreground">Jump directly to your key workflows</p>
          </div>
          <span className="hidden rounded-full border border-border/80 bg-white/65 px-3 py-1 text-xs font-medium text-muted-foreground dark:border-white/15 dark:bg-white/[0.06] md:inline-flex">
            5 Tools
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <ToolCard
            title="Khushi Bot"
            description="Open your personalized assistant"
            href="https://airtable.com/appMNv0wyADbJeYQe/pagtHDMrBEZlP6c4r"
            icon={Sparkles}
            className="bg-gradient-to-br from-[#7c3aed] via-[#d946ef] to-[#4338ca] text-white"
            inverted
          />
          <ToolCard
            title="Fluent Bot"
            description="Practice and polish English communication"
            href="https://airtable.com/appMNv0wyADbJeYQe/pagVFqrJnVnsmwrVf"
            icon={MessageSquare}
            className="bg-gradient-to-br from-[#2563eb] via-[#6366f1] to-[#8b5cf6] text-white"
            inverted
          />
          <ToolCard
            title="User Data"
            description="Student directory and attendance"
            href="https://airtable.com/appMNv0wyADbJeYQe/pagok38tuc6MjBucA"
            icon={Database}
            className="bg-gradient-to-br from-[#0f766e] via-[#0ea5e9] to-[#1d4ed8] text-white"
            inverted
          />
          <ToolCard
            title="User Feedback"
            description="Feedback inbox placeholder"
            href="https://airtable.com/appMNv0wyADbJeYQe/pagXsXOwDGWReB4Gn"
            icon={MessageCircle}
            className="bg-gradient-to-br from-[#b45309] via-[#d97706] to-[#be185d] text-white"
            inverted
          />
          <AnnouncementCard
            className="bg-gradient-to-br from-[#dc2626] via-[#f97316] to-[#ea580c] text-white"
          />
        </div>
      </section>
    </div>
  );
}
