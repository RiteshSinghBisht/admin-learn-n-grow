"use client";

import { useTheme } from "next-themes";
import { MoonStar, Sun } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function PreferencesCard() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Card className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <CardHeader className="border-b border-slate-200 bg-slate-50 pb-4 dark:border-slate-700 dark:bg-slate-800/50">
        <CardTitle className="text-lg text-slate-900 dark:text-white">Theme</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 pb-6 md:pt-7 md:pb-7">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Toggle between light and dark mode</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Current: {isDark ? 'Dark' : 'Light'} mode</p>
          </div>
          <div className="flex items-center gap-3">
            <Sun className="h-5 w-5 text-amber-500" />
            <Switch checked={isDark} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
            <MoonStar className="h-5 w-5 text-indigo-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
