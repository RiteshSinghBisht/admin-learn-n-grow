"use client";

import { useTheme } from "next-themes";
import { MoonStar, Sun } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function PreferencesCard() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-white/45 p-4 backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.03]">
          <div>
            <p className="font-medium">Theme</p>
            <p className="text-sm text-muted-foreground">Toggle between light and dark mode</p>
          </div>
          <div className="flex items-center gap-3">
            <Sun className="h-4 w-4 text-amber-500" />
            <Switch checked={isDark} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
            <MoonStar className="h-4 w-4 text-indigo-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
