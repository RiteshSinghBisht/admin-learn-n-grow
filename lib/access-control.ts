import type { AppAccessScope } from "@/lib/types";

export type AppRole = "admin" | "member";

export const ACCESS_SCOPE_OPTIONS = ["students", "tasks"] as const satisfies readonly AppAccessScope[];

const PUBLIC_PATHS = ["/login"] as const;

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function normalizeAccessScopes(values: string[] | null | undefined) {
  const seen = new Set<AppAccessScope>();
  const normalized: AppAccessScope[] = [];

  (values ?? []).forEach((value) => {
    if (value !== "students" && value !== "tasks") {
      return;
    }

    if (seen.has(value)) {
      return;
    }

    seen.add(value);
    normalized.push(value);
  });

  return normalized;
}

export function hasAccessScope(
  accessScopes: AppAccessScope[] | null | undefined,
  scope: AppAccessScope,
) {
  return (accessScopes ?? []).includes(scope);
}

export function getDefaultPathForRole(role: AppRole, accessScopes: AppAccessScope[] = []) {
  if (role === "admin") {
    return "/";
  }

  if (hasAccessScope(accessScopes, "tasks")) {
    return "/tasks";
  }

  if (hasAccessScope(accessScopes, "students")) {
    return "/students";
  }

  return "/login";
}

export function canRoleAccessPath(
  role: AppRole,
  pathname: string,
  accessScopes: AppAccessScope[] = [],
) {
  if (isPublicPath(pathname)) {
    return true;
  }

  if (role === "admin") {
    return true;
  }

  if (
    hasAccessScope(accessScopes, "students") &&
    (pathname === "/students" || pathname.startsWith("/students/"))
  ) {
    return true;
  }

  if (hasAccessScope(accessScopes, "tasks") && (pathname === "/tasks" || pathname.startsWith("/tasks/"))) {
    return true;
  }

  return false;
}

export function filterNavItemsByRole<T extends { href: string }>(
  items: readonly T[],
  role: AppRole | null,
  isAuthEnabled: boolean,
  accessScopes: AppAccessScope[] = [],
) {
  if (!isAuthEnabled || !role) {
    return [...items];
  }

  return items.filter((item) => canRoleAccessPath(role, item.href, accessScopes));
}
