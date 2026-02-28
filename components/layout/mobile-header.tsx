"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  Bot,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { NAV_ITEMS } from "@/lib/constants";
import { filterNavItemsByRole } from "@/lib/access-control";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const navIconMap: Record<string, ComponentType<{ className?: string }>> = {
  Dashboard: LayoutDashboard,
  Finance: Wallet,
  Students: GraduationCap,
  "Access Management": ShieldCheck,
  "AI Agents": Bot,
  Settings,
};

export function MobileHeader() {
  const pathname = usePathname();
  const { isAuthEnabled, role, signOut } = useAuth();
  const visibleNavItems = filterNavItemsByRole(NAV_ITEMS, role, isAuthEnabled);

  const activeTitle =
    visibleNavItems.find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    )?.title ?? "Dashboard";

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-white/65 px-4 py-3 backdrop-blur-2xl dark:border-white/15 dark:bg-slate-950/55 md:hidden">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 overflow-hidden rounded-full ring-1 ring-border/70 dark:ring-white/20">
            <Image
              src="/learn-n-grow-logo.svg"
              alt="Learn N Grow logo"
              fill
              sizes="36px"
              className="object-cover"
              priority
            />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80">Learn N Grow</p>
            <h2 className="text-base font-semibold">{activeTitle}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="border-b border-border/80 px-5 py-6 dark:border-white/15">
                <SheetTitle className="flex items-center gap-2.5">
                  <span className="relative h-8 w-8 overflow-hidden rounded-full ring-1 ring-border/70 dark:ring-white/20">
                    <Image
                      src="/learn-n-grow-logo.svg"
                      alt="Learn N Grow logo"
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </span>
                  <span>Learn N Grow</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="space-y-2 p-3">
                {visibleNavItems.map((item) => {
                  const Icon = navIconMap[item.title];
                  const isActive =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                        isActive
                          ? "border border-border/80 bg-primary text-primary-foreground dark:border-white/20"
                          : "text-foreground/80 hover:bg-accent/70",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.title}
                    </Link>
                  );
                })}
              </nav>
              {isAuthEnabled ? (
                <div className="border-t border-border/80 p-3 dark:border-white/15">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      void signOut();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
