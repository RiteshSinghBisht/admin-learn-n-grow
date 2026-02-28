import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import type { UserAccessRole } from "@/lib/types";

interface CreateUserBody {
  email?: string;
  password?: string;
  role?: UserAccessRole;
}

const ALLOWED_ROLES: UserAccessRole[] = ["admin", "students_only"];

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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { url, anonKey, serviceRoleKey } = getEnv();
    const verifyClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const adminClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user: requester },
      error: requesterError,
    } = await verifyClient.auth.getUser(token);
    if (requesterError || !requester) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { data: requesterRole, error: requesterRoleError } = await adminClient
      .from("app_user_roles")
      .select("role")
      .eq("user_id", requester.id)
      .maybeSingle();

    if (requesterRoleError) {
      return NextResponse.json({ message: requesterRoleError.message }, { status: 400 });
    }

    if (!requesterRole || requesterRole.role !== "admin") {
      return NextResponse.json({ message: "Only admins can add users." }, { status: 403 });
    }

    const body = (await request.json()) as CreateUserBody;
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const role = body.role;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ message: "Enter a valid email." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ message: "Invalid role selected." }, { status: 400 });
    }

    const { data: created, error: createUserError } = await adminClient.auth.admin.createUser({
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

    const { error: roleUpsertError } = await adminClient.from("app_user_roles").upsert(
      {
        user_id: created.user.id,
        role,
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
      createdAt: created.user.created_at ?? new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error while creating user.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
