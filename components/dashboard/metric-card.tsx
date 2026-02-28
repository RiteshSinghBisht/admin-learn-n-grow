import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  accentClass: string;
  subtitle?: string;
}

export function MetricCard({ title, value, icon: Icon, accentClass, subtitle }: MetricCardProps) {
  return (
    <Card className="glass-elevated group hover:-translate-y-1">
      <CardHeader className="space-y-0 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground/90">
            {title}
          </CardTitle>
          <div className={cn("rounded-xl p-2.5 shadow-lg transition-transform duration-300 group-hover:scale-105", accentClass)}>
            <Icon className="h-4 w-4 text-white/95" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-[1.65rem] font-semibold tracking-tight text-foreground">{value}</p>
        {subtitle ? <p className="mt-1 text-xs text-muted-foreground/90">{subtitle}</p> : null}
      </CardContent>
    </Card>
  );
}
