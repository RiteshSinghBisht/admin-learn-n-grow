import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { normalizeAccessScopes, type AppRole } from "@/lib/access-control";
import type { AppAccessScope } from "@/lib/types";

interface AppUserRoleRow {
  role: AppRole | "students_only" | "teacher" | null;
  access_scopes?: string[] | null;
  assigned_teachers?: string[] | null;
}

export interface RequesterAccess {
  userId: string;
  role: AppRole | null;
  accessScopes: AppAccessScope[];
  assignedTeachers: string[];
  isAdmin: boolean;
  adminClient: SupabaseClient;
}

export interface RequesterAccessResult {
  ok: boolean;
  status: number;
  message: string;
  access: RequesterAccess | null;
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

function isMissingAccessScopesColumnError(message: string) {
  return (
    message.includes("Could not find the 'access_scopes' column of 'app_user_roles'") ||
    message.includes("column app_user_roles.access_scopes does not exist")
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

  const explicitScopes = normalizeAccessScopes(row.access_scopes);
  if (explicitScopes.length > 0) {
    return explicitScopes;
  }

  if (row.role === "students_only" || row.role === "teacher") {
    return ["students"] satisfies AppAccessScope[];
  }

  return [];
}

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error(
      "Supabase server setup is incomplete. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return { url, anonKey, serviceRoleKey };
}

export function extractBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}

export async function authenticateRequest(request: Request): Promise<RequesterAccessResult> {
  const token = extractBearerToken(request);
  if (!token) {
    return {
      ok: false,
      status: 401,
      message: "Unauthorized.",
      access: null,
    };
  }

  const { url, anonKey, serviceRoleKey } = getEnv();
  const verifyClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as SupabaseClient;

  const {
    data: { user },
    error: requesterError,
  } = await verifyClient.auth.getUser(token);

  if (requesterError || !user) {
    return {
      ok: false,
      status: 401,
      message: "Unauthorized.",
      access: null,
    };
  }

  let data: AppUserRoleRow | null = null;
  let error: { message: string } | null = null;

  const response = await adminClient
    .from("app_user_roles")
    .select("role, access_scopes, assigned_teachers")
    .eq("user_id", user.id)
    .maybeSingle();

  data = response.data as AppUserRoleRow | null;
  error = response.error as { message: string } | null;

  if (error && isMissingAccessScopesColumnError(error.message)) {
    const fallback = await adminClient
      .from("app_user_roles")
      .select("role, assigned_teachers")
      .eq("user_id", user.id)
      .maybeSingle();
    data = fallback.data as AppUserRoleRow | null;
    error = fallback.error as { message: string } | null;
  }

  if (error) {
    return {
      ok: false,
      status: 400,
      message: error.message,
      access: null,
    };
  }

  const role = normalizeStoredRole(data?.role ?? null);
  const accessScopes = normalizeStoredAccessScopes(data);

  return {
    ok: true,
    status: 200,
    message: "",
    access: {
      userId: user.id,
      role,
      accessScopes,
      assignedTeachers: normalizeTeacherNames(data?.assigned_teachers),
      isAdmin: role === "admin",
      adminClient,
    },
  };
}
