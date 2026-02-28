"use client";

import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";

import type { AppRole } from "@/lib/access-control";
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
  role: AppRole | "teacher" | null;
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

function normalizeStoredRole(role: AppUserRoleRow["role"]): AppRole | null {
  if (role === "admin") {
    return "admin";
  }
  if (role === "students_only" || role === "teacher") {
    return "students_only";
  }
  return null;
}

interface AuthContextValue {
  isAuthEnabled: boolean;
  loading: boolean;
  roleLoading: boolean;
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  assignedTeachers: string[];
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
  const [assignedTeachers, setAssignedTeachers] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(isAuthEnabled);
  const [roleLoading, setRoleLoading] = React.useState(isAuthEnabled);

  const loadRole = React.useCallback(async (userId: string) => {
    if (!isAuthEnabled || !supabase) {
      setRole("admin");
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
        .select("role, assigned_teachers")
        .eq("user_id", userId)
        .maybeSingle();
      data = response.data as AppUserRoleRow | null;
      error = response.error as { message: string } | null;

      if (error && isMissingAssignedTeachersColumnError(error.message)) {
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
      setAssignedTeachers([]);
      setRoleLoading(false);
      throw new Error(`Failed to load user role: ${error.message}`);
    }

    setRole(normalizeStoredRole(data?.role ?? null));
    setAssignedTeachers(normalizeTeacherNames(data?.assigned_teachers));
    setRoleLoading(false);
  }, []);

  React.useEffect(() => {
    if (!isAuthEnabled || !supabase) {
      setLoading(false);
      setRoleLoading(false);
      setRole("admin");
      setAssignedTeachers([]);
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
        setSession(null);
        setUser(null);
        setRole(null);
        setAssignedTeachers([]);
        setLoading(false);
        setRoleLoading(false);
        console.error(formatAuthTransportError("load session", transportError));
        return;
      }

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Failed to load auth session:", error.message);
      }

      const nextSession = data?.session ?? null;
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
  }, [loadRole]);

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
      setSession(null);
      setUser(null);
      setRole("admin");
      setAssignedTeachers([]);
      setLoading(false);
      setRoleLoading(false);
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
      throw new Error(error.message);
    }
  }, []);

  const refreshRole = React.useCallback(async () => {
    if (!user) {
      setRole(null);
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
      assignedTeachers,
      signIn,
      signOut,
      refreshRole,
    }),
    [assignedTeachers, loading, refreshRole, role, roleLoading, session, signIn, signOut, user],
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
