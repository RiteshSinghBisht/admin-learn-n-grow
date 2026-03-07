import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeAccessScopes } from "@/lib/access-control";
import { authenticateRequest } from "@/lib/server-access";
import type { AppAccessScope, UserAccessRole, UserDeleteMode } from "@/lib/types";

interface UpdateUserAccessBody {
  role?: UserAccessRole;
  accessScopes?: AppAccessScope[];
  assignedTeachers?: string[];
}

function normalizeTeacherNames(values: unknown) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  const source = Array.isArray(values) ? values : [];

  source.forEach((value) => {
    if (typeof value !== "string") {
      return;
    }

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

function validateAccessConfig(
  role: UserAccessRole | undefined,
  accessScopes: AppAccessScope[],
  assignedTeachers: string[],
) {
  if (!role || (role !== "admin" && role !== "member")) {
    return "Invalid role selected.";
  }

  if (role === "member" && accessScopes.length === 0) {
    return "Select at least one access permission.";
  }

  if (role === "member" && accessScopes.includes("students") && assignedTeachers.length === 0) {
    return "Assign at least one teacher for Student Access.";
  }

  return null;
}

async function ensureNotLastAdmin(adminClient: SupabaseClient, targetUserId: string) {
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const authCheck = await authenticateRequest(request);
    if (!authCheck.ok || !authCheck.access) {
      return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
    }

    if (!authCheck.access.isAdmin) {
      return NextResponse.json({ message: "Only admins can manage user access." }, { status: 403 });
    }

    const resolvedParams = await params;
    const targetUserId = resolvedParams.userId?.trim();
    if (!targetUserId) {
      return NextResponse.json({ message: "User ID is required." }, { status: 400 });
    }

    const body = (await request.json()) as UpdateUserAccessBody;
    const role = body.role;
    const accessScopes = role === "admin" ? [] : normalizeAccessScopes(body.accessScopes);
    const assignedTeachers =
      role === "admin" || !accessScopes.includes("students")
        ? []
        : normalizeTeacherNames(body.assignedTeachers);

    const validationError = validateAccessConfig(role, accessScopes, assignedTeachers);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    if (authCheck.access.userId === targetUserId && role !== "admin") {
      return NextResponse.json(
        { message: "You cannot remove your own admin access." },
        { status: 400 },
      );
    }

    const adminSafety = await ensureNotLastAdmin(authCheck.access.adminClient, targetUserId);
    if (!adminSafety.ok && role !== "admin") {
      return NextResponse.json({ message: adminSafety.message }, { status: 400 });
    }

    const { data: targetUser, error: getUserError } =
      await authCheck.access.adminClient.auth.admin.getUserById(targetUserId);

    if (getUserError || !targetUser.user || targetUser.user.deleted_at) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const { error: roleUpsertError } = await authCheck.access.adminClient.from("app_user_roles").upsert(
      {
        user_id: targetUserId,
        role,
        access_scopes: accessScopes,
        assigned_teachers: assignedTeachers,
      },
      { onConflict: "user_id" },
    );

    if (roleUpsertError) {
      return NextResponse.json({ message: roleUpsertError.message }, { status: 400 });
    }

    return NextResponse.json({
      userId: targetUserId,
      email: targetUser.user.email ?? "",
      role,
      accessScopes,
      assignedTeachers,
      createdAt: targetUser.user.created_at ?? new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error while updating access.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const authCheck = await authenticateRequest(request);
    if (!authCheck.ok || !authCheck.access) {
      return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
    }

    if (!authCheck.access.isAdmin) {
      return NextResponse.json({ message: "Only admins can manage user access." }, { status: 403 });
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

    if (authCheck.access.userId === targetUserId) {
      return NextResponse.json(
        { message: "You cannot delete your own account or access." },
        { status: 400 },
      );
    }

    const adminSafety = await ensureNotLastAdmin(authCheck.access.adminClient, targetUserId);
    if (!adminSafety.ok) {
      return NextResponse.json({ message: adminSafety.message }, { status: 400 });
    }

    if (mode === "access") {
      const { error } = await authCheck.access.adminClient
        .from("app_user_roles")
        .delete()
        .eq("user_id", targetUserId);

      if (error) {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }

      return NextResponse.json({ message: "Access removed." });
    }

    const { error: deleteUserError } =
      await authCheck.access.adminClient.auth.admin.deleteUser(targetUserId);

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
