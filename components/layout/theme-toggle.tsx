"use client";

import * as React from "react";
import { MoonStar, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? theme === "dark" : false;

  if (compact) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Toggle theme"
        className={cn("h-10 w-10", className)}
        onClick={() => setTheme(isDark ? "light" : "dark")}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      </Button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "group flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-sidebar-foreground/90 transition hover:bg-white/15",
        className,
      )}
    >
      <span className="font-medium">{isDark ? "Dark mode" : "Light mode"}</span>
      <span className="inline-flex items-center gap-2 text-sidebar-foreground/85">
        <Sun className={cn("h-4 w-4 transition", isDark && "opacity-40")} />
        <MoonStar className={cn("h-4 w-4 transition", !isDark && "opacity-40")} />
      </span>
    </button>
  );
}
