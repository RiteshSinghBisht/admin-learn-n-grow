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
          "relative h-full min-h-[176px] overflow-hidden border border-border/80 bg-white/65 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_52px_-30px_rgba(15,23,42,0.68)] dark:border-white/15 dark:bg-white/[0.06]",
          inverted && "border-white/25 shadow-[0_24px_48px_-30px_rgba(39,27,86,0.8)]",
          className,
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute -inset-[38%] blur-[68px] mix-blend-screen transition-opacity duration-500",
            inverted
              ? "animate-liquid-orb opacity-62 group-hover:opacity-88"
              : "animate-liquid-orb opacity-28 group-hover:opacity-52",
          )}
          style={{
            background: inverted
              ? "conic-gradient(from 180deg at 50% 50%, rgba(255,255,255,0.34), rgba(56,189,248,0.42), rgba(236,72,153,0.38), rgba(99,102,241,0.42), rgba(255,255,255,0.34))"
              : "conic-gradient(from 180deg at 50% 50%, rgba(96,165,250,0.22), rgba(148,163,184,0.12), rgba(59,130,246,0.2), rgba(96,165,250,0.2))",
          }}
        />
        <div
          className={cn(
            "pointer-events-none absolute -inset-[30%] blur-[62px] mix-blend-screen transition-opacity duration-500",
            inverted
              ? "animate-liquid-orb-delayed opacity-42 group-hover:opacity-78"
              : "animate-liquid-orb-delayed opacity-20 group-hover:opacity-42",
          )}
          style={{
            background: inverted
              ? "radial-gradient(circle at 20% 22%, rgba(255,255,255,0.48), transparent 52%), radial-gradient(circle at 75% 70%, rgba(96,165,250,0.36), transparent 58%)"
              : "radial-gradient(circle at 24% 24%, rgba(191,219,254,0.38), transparent 50%), radial-gradient(circle at 72% 68%, rgba(147,197,253,0.24), transparent 56%)",
          }}
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-[length:220%_220%] transition-opacity duration-500",
            inverted
              ? "animate-liquid-sheen opacity-35 bg-[linear-gradient(120deg,transparent_24%,rgba(255,255,255,0.3)_50%,transparent_76%)] group-hover:opacity-95"
              : "animate-liquid-sheen opacity-12 bg-[linear-gradient(120deg,transparent_25%,rgba(255,255,255,0.24)_50%,transparent_75%)] group-hover:opacity-70",
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            inverted
              ? "bg-[radial-gradient(120%_100%_at_10%_5%,rgba(255,255,255,0.2),transparent_60%)]"
              : "bg-[radial-gradient(120%_120%_at_10%_10%,rgba(96,165,250,0.16),transparent_60%)] dark:bg-[radial-gradient(120%_120%_at_10%_10%,rgba(147,197,253,0.14),transparent_60%)]",
          )}
        />
        <CardContent className="relative flex h-full flex-col justify-between gap-7 p-5 md:p-6">
          <div className="flex items-start justify-between">
            <div
              className={cn(
                "rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-105",
                inverted
                  ? "bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
                  : "bg-white/65 dark:bg-white/[0.08]",
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <ArrowUpRight
              className={cn(
                "h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                inverted ? "opacity-90" : "opacity-70",
              )}
            />
          </div>
          <div>
            <p
              className={cn(
                "text-[10px] font-medium uppercase tracking-[0.16em]",
                inverted ? "text-white/75" : "text-muted-foreground/85",
              )}
            >
              Quick Link
            </p>
            <h3 className="mt-1 text-base font-semibold leading-tight md:text-[1.08rem]">{title}</h3>
            <p className={cn("mt-2 text-sm leading-relaxed", inverted ? "text-white/82" : "text-muted-foreground")}>
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
