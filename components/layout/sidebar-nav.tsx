"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  Bot,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  LogOut,
  LayoutDashboard,
  Settings,
  Wallet,
  GraduationCap,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { NAV_ITEMS } from "@/lib/constants";
import { filterNavItemsByRole } from "@/lib/access-control";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

const navIconMap: Record<string, ComponentType<{ className?: string }>> = {
  Dashboard: LayoutDashboard,
  Finance: Wallet,
  Students: GraduationCap,
  "Access Management": ShieldCheck,
  "AI Agents": Bot,
  Settings,
};

interface SidebarNavProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function SidebarNav({ collapsed, onToggle }: SidebarNavProps) {
  const pathname = usePathname();
  const { isAuthEnabled, role, user, signOut } = useAuth();
  const visibleNavItems = filterNavItemsByRole(NAV_ITEMS, role, isAuthEnabled);

  return (
    <aside
      className={cn(
        "h-screen border-r border-sidebar-border bg-sidebar/90 text-sidebar-foreground backdrop-blur-2xl transition-all duration-300",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div className="flex h-full flex-col">
        <div className={cn("border-b border-sidebar-border", collapsed ? "px-3 py-4" : "px-6 py-7")}>
          <div
            className={cn(
              "flex",
              collapsed ? "flex-col items-center gap-2" : "items-center justify-between gap-3",
            )}
          >
            <div className={cn("flex items-center gap-3 min-w-0", collapsed && "flex-col gap-2")}>
              <div className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-white/30">
                <Image
                  src="/learn-n-grow-logo.svg"
                  alt="Learn N Grow logo"
                  fill
                  sizes="40px"
                  className="object-cover"
                  priority
                />
              </div>

              <div className={cn("min-w-0", collapsed && "hidden")}>
                <p className="text-[11px] uppercase tracking-[0.22em] text-sidebar-foreground/55">
                  Admin Panel
                </p>
                <h1 className="mt-2 text-lg font-semibold leading-tight text-sidebar-foreground">
                  Learn N Grow
                </h1>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "text-sidebar-foreground/85 hover:bg-white/10 hover:text-sidebar-foreground",
                collapsed ? "h-9 w-9" : "h-8 w-8",
              )}
              onClick={onToggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-3 py-4">
          {visibleNavItems.map((item) => {
            const Icon = navIconMap[item.title];
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.title}
                className={cn(
                  "group flex items-center rounded-xl text-sm font-medium transition-all duration-300",
                  collapsed ? "justify-center px-2.5 py-3" : "gap-3 px-3 py-2.5",
                  isActive
                    ? "border border-white/25 bg-sidebar-primary/90 text-sidebar-primary-foreground shadow-[0_14px_30px_-18px_rgba(59,130,246,0.9)]"
                    : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                <span className={cn("whitespace-nowrap", collapsed && "hidden")}>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border px-3 py-4">
          {isAuthEnabled ? (
            <div className={cn("mb-3 space-y-2", collapsed && "flex flex-col items-center")}>
              {!collapsed ? (
                <p className="truncate px-1 text-xs text-sidebar-foreground/70">{user?.email}</p>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                className={cn(
                  "w-full text-sidebar-foreground/85 hover:bg-white/10 hover:text-sidebar-foreground",
                  collapsed ? "h-9 w-9 px-0" : "justify-start",
                )}
                onClick={() => {
                  void signOut();
                }}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className={cn("ml-2", collapsed && "hidden")}>Sign Out</span>
              </Button>
            </div>
          ) : null}
          <ThemeToggle compact={collapsed} />
        </div>
      </div>
    </aside>
  );
}
