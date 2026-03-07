"use client";

import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";

import {
  hasAccessScope as hasScope,
  normalizeAccessScopes,
  type AppRole,
} from "@/lib/access-control";
import type { AppAccessScope } from "@/lib/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const isAuthEnabled = process.env.NEXT_PUBLIC_USE_SUPABASE === "true" && isSupabaseConfigured;

function formatAuthTransportError(action: string, error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown network error";

  const isNetworkFailure =
    message.toLowerCase().includes("fetch failed") ||
    message.toLowerCase().includes("load failed") ||
    message.toLowerCase().includes("failed to fetch") ||
    message.toLowerCase().includes("networkerror");

  if (isNetworkFailure) {
    return `Unable to ${action}. Could not reach Supabase. Check URL/key, internet, and browser network permissions.`;
  }

  return message;
}

interface AppUserRoleRow {
  role: AppRole | "students_only" | "teacher" | null;
  access_scopes?: string[] | null;
  assigned_teachers?: string[] | null;
}

function normalizeTeacherNames(values: string[] | null | undefined) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  (values ?? []).forEach((value) => {
    const next = value.trim();
    if (!next) {
      return;
    }
    const key = next.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    normalized.push(next);
  });

  return normalized;
}

function isMissingAssignedTeachersColumnError(message: string) {
  return (
    message.includes("Could not find the 'assigned_teachers' column of 'app_user_roles'") ||
    message.includes("column app_user_roles.assigned_teachers does not exist")
  );
}

function isMissingAccessScopesColumnError(message: string) {
  return (
    message.includes("Could not find the 'access_scopes' column of 'app_user_roles'") ||
    message.includes("column app_user_roles.access_scopes does not exist")
  );
}

function isInvalidRefreshTokenError(message: string) {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("invalid refresh token") ||
    normalizedMessage.includes("refresh token not found")
  );
}

function normalizeStoredRole(role: AppUserRoleRow["role"]): AppRole | null {
  if (role === "admin") {
    return "admin";
  }

  if (role === "member" || role === "students_only" || role === "teacher") {
    return "member";
  }

  return null;
}

function normalizeStoredAccessScopes(row: AppUserRoleRow | null) {
  if (!row) {
    return [];
  }

  if (row.role === "admin") {
    return [];
  }

  const scopes = normalizeAccessScopes(row.access_scopes);
  if (scopes.length > 0) {
    return scopes;
  }

  if (row.role === "students_only" || row.role === "teacher") {
    return ["students"] satisfies AppAccessScope[];
  }

  return [];
}

interface AuthContextValue {
  isAuthEnabled: boolean;
  loading: boolean;
  roleLoading: boolean;
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  accessScopes: AppAccessScope[];
  assignedTeachers: string[];
  hasAccessScope: (scope: AppAccessScope) => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [role, setRole] = React.useState<AppRole | null>(isAuthEnabled ? null : "admin");
  const [accessScopes, setAccessScopes] = React.useState<AppAccessScope[]>([]);
  const [assignedTeachers, setAssignedTeachers] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(isAuthEnabled);
  const [roleLoading, setRoleLoading] = React.useState(isAuthEnabled);

  const resetAuthState = React.useCallback((nextRole: AppRole | null, nextAccessScopes: AppAccessScope[] = []) => {
    setSession(null);
    setUser(null);
    setRole(nextRole);
    setAccessScopes(nextAccessScopes);
    setAssignedTeachers([]);
    setLoading(false);
    setRoleLoading(false);
  }, []);

  const loadRole = React.useCallback(async (userId: string) => {
    if (!isAuthEnabled || !supabase) {
      setRole("admin");
      setAccessScopes([]);
      setAssignedTeachers([]);
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);

    let data: AppUserRoleRow | null = null;
    let error: { message: string } | null = null;
    try {
      const response = await supabase
        .from("app_user_roles")
        .select("role, access_scopes, assigned_teachers")
        .eq("user_id", userId)
        .maybeSingle();
      data = response.data as AppUserRoleRow | null;
      error = response.error as { message: string } | null;

      if (error && (isMissingAssignedTeachersColumnError(error.message) || isMissingAccessScopesColumnError(error.message))) {
        const fallback = await supabase
          .from("app_user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();
        data = fallback.data as AppUserRoleRow | null;
        error = fallback.error as { message: string } | null;
      }
    } catch (transportError) {
      setRole(null);
      setAssignedTeachers([]);
      setRoleLoading(false);
      throw new Error(formatAuthTransportError("load user role", transportError));
    }

    if (error) {
      setRole(null);
      setAccessScopes([]);
      setAssignedTeachers([]);
      setRoleLoading(false);
      throw new Error(`Failed to load user role: ${error.message}`);
    }

    setRole(normalizeStoredRole(data?.role ?? null));
    setAccessScopes(normalizeStoredAccessScopes(data));
    setAssignedTeachers(normalizeTeacherNames(data?.assigned_teachers));
    setRoleLoading(false);
  }, []);

  React.useEffect(() => {
    if (!isAuthEnabled || !supabase) {
      resetAuthState("admin");
      return;
    }

    const client = supabase;
    let isMounted = true;

    async function bootstrap() {
      let data: { session: Session | null } | null = null;
      let error: { message: string } | null = null;
      try {
        const response = await client.auth.getSession();
        data = response.data as { session: Session | null } | null;
        error = response.error as { message: string } | null;
      } catch (transportError) {
        if (!isMounted) {
          return;
        }
        resetAuthState(null);
        console.error(formatAuthTransportError("load session", transportError));
        return;
      }

      if (!isMounted) {
        return;
      }

      if (error) {
        if (isInvalidRefreshTokenError(error.message)) {
          await client.auth.signOut({ scope: "local" });

          if (!isMounted) {
            return;
          }

          resetAuthState(null);
          return;
        }

        console.error("Failed to load auth session:", error.message);
      }

      const nextSession = data?.session ?? null;
      const nextUser = nextSession?.user ?? null;

      setSession(nextSession);
      setUser(nextUser);
      setLoading(false);

      if (!nextUser) {
        setRole(null);
        setAccessScopes([]);
        setAssignedTeachers([]);
        setRoleLoading(false);
        return;
      }

      try {
        await loadRole(nextUser.id);
      } catch (roleError) {
        console.error(roleError);
      }
    }

    void bootstrap();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      const nextUser = nextSession?.user ?? null;

      setSession(nextSession);
      setUser(nextUser);
      setLoading(false);

      if (!nextUser) {
        setRole(null);
        setAssignedTeachers([]);
        setRoleLoading(false);
        return;
      }

      void loadRole(nextUser.id).catch((roleError) => {
        console.error(roleError);
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadRole, resetAuthState]);

  const signIn = React.useCallback(async (email: string, password: string) => {
    if (!isAuthEnabled || !supabase) {
      return;
    }

    let error: { message: string } | null = null;
    try {
      const response = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      error = response.error as { message: string } | null;
    } catch (transportError) {
      throw new Error(formatAuthTransportError("sign in", transportError));
    }

    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const signOut = React.useCallback(async () => {
    if (!isAuthEnabled || !supabase) {
      resetAuthState("admin");
      return;
    }

    let error: { message: string } | null = null;
    try {
      const response = await supabase.auth.signOut();
      error = response.error as { message: string } | null;
    } catch (transportError) {
      throw new Error(formatAuthTransportError("sign out", transportError));
    }
    if (error) {
      if (isInvalidRefreshTokenError(error.message)) {
        await supabase.auth.signOut({ scope: "local" });
        resetAuthState(null);
        return;
      }

      throw new Error(error.message);
    }

    resetAuthState(null);
  }, [resetAuthState]);

  const refreshRole = React.useCallback(async () => {
    if (!user) {
      setRole(null);
      setAccessScopes([]);
      setAssignedTeachers([]);
      setRoleLoading(false);
      return;
    }

    await loadRole(user.id);
  }, [loadRole, user]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      isAuthEnabled,
      loading,
      roleLoading,
      user,
      session,
      role,
      accessScopes,
      assignedTeachers,
      hasAccessScope: (scope) => role === "admin" || hasScope(accessScopes, scope),
      signIn,
      signOut,
      refreshRole,
    }),
    [accessScopes, assignedTeachers, loading, refreshRole, role, roleLoading, session, signIn, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
