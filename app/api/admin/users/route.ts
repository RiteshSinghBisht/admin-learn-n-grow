import { NextResponse } from "next/server";

import { normalizeAccessScopes } from "@/lib/access-control";
import { authenticateRequest } from "@/lib/server-access";
import type { AppAccessScope, UserAccessRole } from "@/lib/types";

interface UserAccessRow {
  user_id: string;
  role: UserAccessRole | "students_only" | "teacher" | null;
  access_scopes?: string[] | null;
  assigned_teachers?: string[] | null;
}

interface CreateUserBody {
  email?: string;
  password?: string;
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

function normalizeStoredRole(role: UserAccessRow["role"]): UserAccessRole | null {
  if (role === "admin") {
    return "admin";
  }

  if (role === "member" || role === "students_only" || role === "teacher") {
    return "member";
  }

  return null;
}

function normalizeStoredAccessScopes(row: UserAccessRow) {
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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

export async function GET(request: Request) {
  try {
    const authCheck = await authenticateRequest(request);
    if (!authCheck.ok || !authCheck.access) {
      return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
    }

    if (!authCheck.access.isAdmin) {
      return NextResponse.json({ message: "Only admins can view user access." }, { status: 403 });
    }

    const [{ data: usersPage, error: usersError }, { data: roles, error: rolesError }] =
      await Promise.all([
        authCheck.access.adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        authCheck.access.adminClient
          .from("app_user_roles")
          .select("user_id, role, access_scopes, assigned_teachers"),
      ]);

    if (usersError) {
      return NextResponse.json({ message: usersError.message }, { status: 400 });
    }

    if (rolesError) {
      return NextResponse.json({ message: rolesError.message }, { status: 400 });
    }

    const roleByUserId = new Map<string, UserAccessRow>();
    ((roles ?? []) as UserAccessRow[]).forEach((entry) => {
      roleByUserId.set(entry.user_id, entry);
    });

    const data = (usersPage.users ?? [])
      .filter((user) => !user.deleted_at)
      .map((user) => {
        const accessRow = roleByUserId.get(user.id);
        return {
          user_id: user.id,
          email: user.email ?? "",
          role: normalizeStoredRole(accessRow?.role ?? null),
          access_scopes: accessRow ? normalizeStoredAccessScopes(accessRow) : [],
          assigned_teachers: normalizeTeacherNames(accessRow?.assigned_teachers),
          created_at: user.created_at ?? new Date().toISOString(),
        };
      });

    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error while loading users.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authCheck = await authenticateRequest(request);
    if (!authCheck.ok || !authCheck.access) {
      return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
    }

    if (!authCheck.access.isAdmin) {
      return NextResponse.json({ message: "Only admins can add users." }, { status: 403 });
    }

    const body = (await request.json()) as CreateUserBody;
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const role = body.role;
    const accessScopes = role === "admin" ? [] : normalizeAccessScopes(body.accessScopes);
    const assignedTeachers =
      role === "admin" || !accessScopes.includes("students")
        ? []
        : normalizeTeacherNames(body.assignedTeachers);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ message: "Enter a valid email." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    const validationError = validateAccessConfig(role, accessScopes, assignedTeachers);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const { data: created, error: createUserError } =
      await authCheck.access.adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createUserError || !created.user) {
      return NextResponse.json(
        { message: createUserError?.message ?? "Unable to create user." },
        { status: 400 },
      );
    }

    const { error: roleUpsertError } = await authCheck.access.adminClient.from("app_user_roles").upsert(
      {
        user_id: created.user.id,
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
      userId: created.user.id,
      email: created.user.email ?? email,
      role,
      accessScopes,
      assignedTeachers,
      createdAt: created.user.created_at ?? new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error while creating user.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
