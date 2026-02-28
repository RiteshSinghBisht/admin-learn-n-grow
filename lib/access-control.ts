export type AppRole = "admin" | "students_only";

const PUBLIC_PATHS = ["/login"] as const;

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function getDefaultPathForRole(role: AppRole) {
  return role === "students_only" ? "/students" : "/";
}

export function canRoleAccessPath(role: AppRole, pathname: string) {
  if (isPublicPath(pathname)) {
    return true;
  }

  if (role === "admin") {
    return true;
  }

  if (role === "students_only") {
    return pathname === "/students" || pathname.startsWith("/students/");
  }

  return false;
}

export function filterNavItemsByRole<T extends { href: string }>(
  items: readonly T[],
  role: AppRole | null,
  isAuthEnabled: boolean,
) {
  if (!isAuthEnabled || !role) {
    return [...items];
  }

  return items.filter((item) => canRoleAccessPath(role, item.href));
}
