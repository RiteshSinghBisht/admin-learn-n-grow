import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { UserDeleteMode } from "@/lib/types";

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

function extractBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}

function parseMode(request: Request): UserDeleteMode | null {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode");

  if (!mode || mode === "access") {
    return "access";
  }
  if (mode === "user") {
    return "user";
  }
  return null;
}

async function ensureRequesterIsAdmin(token: string) {
  const { url, anonKey, serviceRoleKey } = getEnv();
  const verifyClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as SupabaseClient;

  const {
    data: { user: requester },
    error: requesterError,
  } = await verifyClient.auth.getUser(token);
  if (requesterError || !requester) {
    return {
      ok: false as const,
      status: 401,
      message: "Unauthorized.",
      requesterId: null,
      adminClient,
    };
  }

  const { data: requesterRole, error: requesterRoleError } = await adminClient
    .from("app_user_roles")
    .select("role")
    .eq("user_id", requester.id)
    .maybeSingle();

  if (requesterRoleError) {
    return {
      ok: false as const,
      status: 400,
      message: requesterRoleError.message,
      requesterId: requester.id,
      adminClient,
    };
  }

  if (!requesterRole || requesterRole.role !== "admin") {
    return {
      ok: false as const,
      status: 403,
      message: "Only admins can manage user access.",
      requesterId: requester.id,
      adminClient,
    };
  }

  return {
    ok: true as const,
    status: 200,
    message: "",
    requesterId: requester.id,
    adminClient,
  };
}

async function ensureNotLastAdmin(
  adminClient: SupabaseClient,
  targetUserId: string,
) {
  const { data: targetRole } = await adminClient
    .from("app_user_roles")
    .select("role")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!targetRole || targetRole.role !== "admin") {
    return { ok: true as const, message: "" };
  }

  const { count, error } = await adminClient
    .from("app_user_roles")
    .select("user_id", { count: "exact", head: true })
    .eq("role", "admin");

  if (error) {
    return { ok: false as const, message: error.message };
  }

  if ((count ?? 0) <= 1) {
    return {
      ok: false as const,
      message: "At least one admin is required. Add another admin before removing this one.",
    };
  }

  return { ok: true as const, message: "" };
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const mode = parseMode(request);
    if (!mode) {
      return NextResponse.json(
        { message: "Invalid delete mode. Use mode=access or mode=user." },
        { status: 400 },
      );
    }

    const resolvedParams = await params;
    const targetUserId = resolvedParams.userId?.trim();
    if (!targetUserId) {
      return NextResponse.json({ message: "User ID is required." }, { status: 400 });
    }

    const authCheck = await ensureRequesterIsAdmin(token);
    if (!authCheck.ok) {
      return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
    }

    if (authCheck.requesterId === targetUserId) {
      return NextResponse.json(
        { message: "You cannot delete your own account or access." },
        { status: 400 },
      );
    }

    const adminSafety = await ensureNotLastAdmin(authCheck.adminClient, targetUserId);
    if (!adminSafety.ok) {
      return NextResponse.json({ message: adminSafety.message }, { status: 400 });
    }

    if (mode === "access") {
      const { error } = await authCheck.adminClient
        .from("app_user_roles")
        .delete()
        .eq("user_id", targetUserId);

      if (error) {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }

      return NextResponse.json({ message: "Access removed." });
    }

    const { error: deleteUserError } =
      await authCheck.adminClient.auth.admin.deleteUser(targetUserId);

    if (deleteUserError) {
      return NextResponse.json({ message: deleteUserError.message }, { status: 400 });
    }

    return NextResponse.json({ message: "User deleted." });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error while deleting user/access.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
