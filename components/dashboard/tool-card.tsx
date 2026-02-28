import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  className?: string;
  inverted?: boolean;
}

export function ToolCard({
  title,
  description,
  href,
  icon: Icon,
  className,
  inverted = false,
}: ToolCardProps) {
  const isExternalLink = /^https?:\/\//i.test(href);

  return (
    <Link
      href={href}
      target={isExternalLink ? "_blank" : undefined}
      rel={isExternalLink ? "noopener noreferrer" : undefined}
      className="group block h-full"
    >
      <Card
        className={cn(
          "relative h-full min-h-[176px] overflow-hidden border border-border/60 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg dark:border-white/20 dark:bg-slate-900",
          inverted && "text-white",
          className,
        )}
      >
        {/* Subtle gradient background for inverted cards */}
        {inverted && (
          <div className="absolute inset-0 bg-gradient-to-br opacity-90" style={{
            background: className?.includes('from-[#7c3aed]')
              ? 'linear-gradient(to bottom right, #7c3aed, #d946ef, #4338ca)'
              : className?.includes('from-[#2563eb]')
              ? 'linear-gradient(to bottom right, #2563eb, #6366f1, #8b5cf6)'
              : className?.includes('from-[#0f766e]')
              ? 'linear-gradient(to bottom right, #0f766e, #0ea5e9, #1d4ed8)'
              : className?.includes('from-[#b45309]')
              ? 'linear-gradient(to bottom right, #b45309, #d97706, #be185d)'
              : 'linear-gradient(to bottom right, #dc2626, #f97316, #ea580c)'
          }} />
        )}

        <CardContent className="relative flex h-full flex-col justify-between gap-4 p-5 md:p-6">
          <div className="flex items-start justify-between">
            <div
              className={cn(
                "rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-105",
                inverted
                  ? "bg-white/20"
                  : "bg-slate-100 dark:bg-white/10",
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <ArrowUpRight
              className={cn(
                "h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                inverted ? "opacity-90" : "text-slate-400",
              )}
            />
          </div>
          <div>
            <p
              className={cn(
                "text-[10px] font-medium uppercase tracking-wider",
                inverted ? "text-white/70" : "text-slate-500 dark:text-slate-400",
              )}
            >
              Quick Link
            </p>
            <h3 className="mt-1 text-base font-semibold leading-tight md:text-[1.08rem]">{title}</h3>
            <p className={cn("mt-1.5 text-sm leading-relaxed", inverted ? "text-white/80" : "text-slate-600 dark:text-slate-300")}>
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
