import { NextRequest, NextResponse } from "next/server";

import { hasAccessScope } from "@/lib/access-control";
import { authenticateRequest } from "@/lib/server-access";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function buildResponse(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

function normalizeDateValue(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeStatus(value: unknown) {
  if (value === "completed") {
    return "completed";
  }

  if (value === "in_progress" || value === "inProgress" || value === "in progress") {
    return "in_progress";
  }

  return "pending";
}

async function requireTaskAccess(request: Request) {
  const authCheck = await authenticateRequest(request);
  if (!authCheck.ok || !authCheck.access) {
    return authCheck;
  }

  if (!authCheck.access.isAdmin && !hasAccessScope(authCheck.access.accessScopes, "tasks")) {
    return {
      ok: false,
      status: 403,
      message: "Task access is required.",
      access: null,
    };
  }

  return authCheck;
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireTaskAccess(request);
    if (!authCheck.ok || !authCheck.access) {
      return buildResponse({ error: authCheck.message }, { status: authCheck.status });
    }

    const { data, error } = await authCheck.access.adminClient
      .from("tasks")
      .select("*")
      .eq("owner_user_id", authCheck.access.userId)
      .order("event_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      return buildResponse(
        { error: "Failed to fetch tasks", details: error.message },
        { status: 500 },
      );
    }

    return buildResponse({
      success: true,
      count: data?.length || 0,
      data,
    });
  } catch (error) {
    return buildResponse(
      {
        error: "Failed to fetch tasks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireTaskAccess(request);
    if (!authCheck.ok || !authCheck.access) {
      return buildResponse({ error: authCheck.message }, { status: authCheck.status });
    }

    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const eventDate = normalizeDateValue(body.eventDate ?? body.event_date);
    const description = String(body.description ?? "").trim();
    const status = normalizeStatus(body.status);

    if (!title || !eventDate) {
      return buildResponse(
        { error: "Missing required fields: title, eventDate" },
        { status: 400 },
      );
    }

    const { data, error } = await authCheck.access.adminClient
      .from("tasks")
      .insert([
        {
          title,
          description: description || null,
          event_date: eventDate,
          status,
          owner_user_id: authCheck.access.userId,
        },
      ])
      .select()
      .single();

    if (error) {
      return buildResponse(
        { error: "Failed to create task", details: error.message },
        { status: 500 },
      );
    }

    return buildResponse({
      success: true,
      message: "Task created successfully",
      data,
    });
  } catch (error) {
    return buildResponse(
      {
        error: "Failed to create task",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authCheck = await requireTaskAccess(request);
    if (!authCheck.ok || !authCheck.access) {
      return buildResponse({ error: authCheck.message }, { status: authCheck.status });
    }

    const body = await request.json();
    const id = body.id;

    if (!id) {
      return buildResponse({ error: "Missing required field: id" }, { status: 400 });
    }

    const updateData: {
      title?: string;
      description?: string | null;
      event_date?: string;
      status?: "pending" | "in_progress" | "completed";
    } = {};

    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) {
        return buildResponse({ error: "Title cannot be empty" }, { status: 400 });
      }

      updateData.title = title;
    }

    if (body.description !== undefined) {
      const description = String(body.description ?? "").trim();
      updateData.description = description || null;
    }

    if (body.eventDate !== undefined || body.event_date !== undefined) {
      const eventDate = normalizeDateValue(body.eventDate ?? body.event_date);
      if (!eventDate) {
        return buildResponse({ error: "Event date cannot be empty" }, { status: 400 });
      }

      updateData.event_date = eventDate;
    }

    if (body.status !== undefined) {
      updateData.status = normalizeStatus(body.status);
    }

    if (Object.keys(updateData).length === 0) {
      return buildResponse({ error: "No fields provided for update" }, { status: 400 });
    }

    const { data, error } = await authCheck.access.adminClient
      .from("tasks")
      .update(updateData)
      .eq("id", id)
      .eq("owner_user_id", authCheck.access.userId)
      .select()
      .maybeSingle();

    if (error) {
      return buildResponse(
        { error: "Failed to update task", details: error.message },
        { status: 500 },
      );
    }

    if (!data) {
      return buildResponse({ error: "Task not found." }, { status: 404 });
    }

    return buildResponse({
      success: true,
      message: "Task updated successfully",
      data,
    });
  } catch (error) {
    return buildResponse(
      {
        error: "Failed to update task",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await requireTaskAccess(request);
    if (!authCheck.ok || !authCheck.access) {
      return buildResponse({ error: authCheck.message }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return buildResponse({ error: "Missing task ID" }, { status: 400 });
    }

    const { data, error } = await authCheck.access.adminClient
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("owner_user_id", authCheck.access.userId)
      .select("id")
      .maybeSingle();

    if (error) {
      return buildResponse(
        { error: "Failed to delete task", details: error.message },
        { status: 500 },
      );
    }

    if (!data) {
      return buildResponse({ error: "Task not found." }, { status: 404 });
    }

    return buildResponse({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    return buildResponse(
      {
        error: "Failed to delete task",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return buildResponse({ success: true });
}
