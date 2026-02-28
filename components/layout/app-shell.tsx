"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { MobileHeader } from "@/components/layout/mobile-header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import { canRoleAccessPath, getDefaultPathForRole, isPublicPath } from "@/lib/access-control";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthEnabled, loading: authLoading, roleLoading, user, role, signOut } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const onPublicRoute = isPublicPath(pathname);

  React.useEffect(() => {
    const storedValue = window.localStorage.getItem("sidebar-collapsed");
    if (storedValue === "true") {
      setIsSidebarCollapsed(true);
    }
  }, []);

  function handleToggleSidebar() {
    setIsSidebarCollapsed((prev) => {
      const nextState = !prev;
      window.localStorage.setItem("sidebar-collapsed", String(nextState));
      return nextState;
    });
  }

  React.useEffect(() => {
    if (!isAuthEnabled) {
      return;
    }

    if (authLoading) {
      return;
    }

    if (!user) {
      if (!onPublicRoute) {
        router.replace("/login");
      }
      return;
    }

    if (onPublicRoute) {
      if (roleLoading) {
        return;
      }

      router.replace(getDefaultPathForRole(role ?? "students_only"));
      return;
    }

    if (roleLoading || !role) {
      return;
    }

    if (!canRoleAccessPath(role, pathname)) {
      router.replace(getDefaultPathForRole(role));
    }
  }, [authLoading, isAuthEnabled, onPublicRoute, pathname, role, roleLoading, router, user]);

  if (onPublicRoute) {
    return <>{children}</>;
  }

  if (isAuthEnabled && (authLoading || (user && roleLoading))) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="rounded-2xl border border-border/70 bg-white/70 px-5 py-4 text-sm text-muted-foreground backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.06]">
          Loading access...
        </div>
      </div>
    );
  }

  if (isAuthEnabled && !user) {
    return null;
  }

  if (isAuthEnabled && user && !roleLoading && !role) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-white/75 p-6 backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.06]">
          <h1 className="text-xl font-semibold">Access Not Assigned</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is authenticated, but no role is assigned yet. Ask admin to assign
            access.
          </p>
          <Button
            className="mt-5"
            onClick={() => {
              void signOut();
            }}
          >
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  if (isAuthEnabled && role && !canRoleAccessPath(role, pathname)) {
    return null;
  }

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-float-slow absolute -top-24 left-[10%] h-72 w-72 rounded-full bg-sky-300/25 blur-[96px] dark:bg-sky-400/15" />
        <div className="animate-float-delayed absolute right-[6%] top-[18%] h-72 w-72 rounded-full bg-indigo-300/25 blur-[110px] dark:bg-indigo-400/18" />
        <div className="animate-float-slow absolute bottom-[-10rem] left-[30%] h-80 w-80 rounded-full bg-cyan-300/20 blur-[120px] dark:bg-cyan-400/14" />
      </div>

      <div
        className={cn(
          "hidden md:fixed md:inset-y-0 md:left-0 md:block md:transition-all md:duration-300",
          isSidebarCollapsed ? "md:w-20" : "md:w-64",
        )}
      >
        <SidebarNav collapsed={isSidebarCollapsed} onToggle={handleToggleSidebar} />
      </div>

      <div
        className={cn(
          "md:transition-all md:duration-300",
          isSidebarCollapsed ? "md:pl-20" : "md:pl-64",
        )}
      >
        <MobileHeader />
        <main className="container relative max-w-[1440px] py-7 md:py-9 lg:py-10">
          <div className="animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
