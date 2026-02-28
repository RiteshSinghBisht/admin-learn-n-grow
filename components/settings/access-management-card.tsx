"use client";

import * as React from "react";
import {
  CircleSlash,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { useAppData } from "@/components/providers/app-data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dataService } from "@/lib/data-service";
import type { UserAccess, UserAccessRole, UserDeleteMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS: Array<{ value: UserAccessRole; label: string }> = [
  { value: "admin", label: "Full Access (Admin)" },
  { value: "students_only", label: "Student Only" },
];

function parseTeacherNames(value: string) {
  const seen = new Set<string>();
  const parsed: string[] = [];

  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      parsed.push(item);
    });

  return parsed;
}

function formatTeacherNames(values: string[] | undefined) {
  return (values ?? []).join(", ");
}

function roleLabel(value: UserAccessRole | null) {
  if (value === "admin") return "Full Access";
  if (value === "students_only") return "Student Only";
  return "Unassigned";
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function formatCreatedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function AccessManagementCard() {
  const { isAuthEnabled, role, user, refreshRole } = useAuth();
  const { students } = useAppData();
  const [records, setRecords] = React.useState<UserAccess[]>([]);
  const [selectedRoleByUser, setSelectedRoleByUser] = React.useState<Record<string, UserAccessRole>>(
    {},
  );
  const [selectedTeachersByUser, setSelectedTeachersByUser] = React.useState<Record<string, string>>(
    {},
  );
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [savingUserId, setSavingUserId] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [createEmail, setCreateEmail] = React.useState("");
  const [createPassword, setCreatePassword] = React.useState("");
  const [createRole, setCreateRole] = React.useState<UserAccessRole>("students_only");
  const [createAssignedTeachers, setCreateAssignedTeachers] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = React.useState<UserAccess | null>(null);
  const [deletingMode, setDeletingMode] = React.useState<UserDeleteMode | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const teacherOptions = React.useMemo(() => {
    const set = new Set<string>();
    students.forEach((student) => {
      if (student.teacher?.trim()) {
        set.add(student.teacher.trim());
      }
    });
    return Array.from(set).sort();
  }, [students]);

  const loadUsers = React.useCallback(
    async (isManualRefresh = false) => {
      if (!isAuthEnabled || role !== "admin") {
        setLoading(false);
        return;
      }

      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const users = await dataService.listUserAccess();
        const nextSelection = users.reduce<Record<string, UserAccessRole>>((acc, item) => {
          acc[item.userId] = item.role ?? "students_only";
          return acc;
        }, {});
        const nextTeachers = users.reduce<Record<string, string>>((acc, item) => {
          acc[item.userId] = formatTeacherNames(item.assignedTeachers);
          return acc;
        }, {});
        setRecords(users);
        setSelectedRoleByUser(nextSelection);
        setSelectedTeachersByUser(nextTeachers);
      } catch (loadError) {
        setError(getErrorMessage(loadError, "Failed to load access records."));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthEnabled, role],
  );

  React.useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  React.useEffect(() => {
    if (!message) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMessage(null);
    }, 2800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [message]);

  async function handleSave(userId: string) {
    const selectedRole = selectedRoleByUser[userId];
    if (!selectedRole) {
      return;
    }
    const assignedTeachers = parseTeacherNames(selectedTeachersByUser[userId] ?? "");

    if (user?.id === userId && selectedRole !== "admin") {
      setError("You cannot remove your own admin access.");
      return;
    }

    if (selectedRole === "students_only" && !assignedTeachers.length) {
      setError("Assign at least one teacher for Student Only access.");
      return;
    }

    setError(null);
    setSavingUserId(userId);

    try {
      await dataService.updateUserAccessRole(
        userId,
        selectedRole,
        selectedRole === "students_only" ? assignedTeachers : [],
      );
      setRecords((prev) =>
        prev.map((item) =>
          item.userId === userId
            ? {
                ...item,
                role: selectedRole,
                assignedTeachers: selectedRole === "students_only" ? assignedTeachers : [],
              }
            : item,
        ),
      );

      if (user?.id === userId) {
        await refreshRole();
      }

      setMessage("Access role updated.");
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Failed to update access role."));
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleCreateUser() {
    const email = createEmail.trim().toLowerCase();
    const assignedTeachers = parseTeacherNames(createAssignedTeachers);
    if (!email) {
      setError("Email is required.");
      return;
    }

    if (createPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (createRole === "students_only" && !assignedTeachers.length) {
      setError("Assign at least one teacher for Student Only access.");
      return;
    }

    setError(null);
    setMessage(null);
    setCreating(true);

    try {
      const created = await dataService.createUserAccess({
        email,
        password: createPassword,
        role: createRole,
        assignedTeachers: createRole === "students_only" ? assignedTeachers : [],
      });

      setRecords((prev) => {
        const index = prev.findIndex((item) => item.userId === created.userId);
        if (index === -1) {
          return [created, ...prev];
        }

        const next = [...prev];
        next[index] = created;
        return next;
      });

      setSelectedRoleByUser((prev) => ({
        ...prev,
        [created.userId]: created.role ?? "students_only",
      }));
      setSelectedTeachersByUser((prev) => ({
        ...prev,
        [created.userId]: formatTeacherNames(created.assignedTeachers),
      }));

      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("students_only");
      setCreateAssignedTeachers("");
      setMessage("New user added successfully.");
    } catch (createError) {
      setError(getErrorMessage(createError, "Failed to add user."));
    } finally {
      setCreating(false);
    }
  }

  function openDeleteDialog(item: UserAccess) {
    setDeleteTargetUser(item);
    setDeleteDialogOpen(true);
    setError(null);
  }

  async function handleDelete(mode: UserDeleteMode) {
    if (!deleteTargetUser) {
      return;
    }

    if (user?.id === deleteTargetUser.userId) {
      setError("You cannot delete your own account or access.");
      setDeleteDialogOpen(false);
      setDeleteTargetUser(null);
      return;
    }

    setError(null);
    setMessage(null);
    setDeletingMode(mode);

    try {
      await dataService.deleteUserAccess(deleteTargetUser.userId, mode);

      if (mode === "user") {
        setRecords((prev) => prev.filter((item) => item.userId !== deleteTargetUser.userId));
        setSelectedRoleByUser((prev) => {
          const next = { ...prev };
          delete next[deleteTargetUser.userId];
          return next;
        });
        setSelectedTeachersByUser((prev) => {
          const next = { ...prev };
          delete next[deleteTargetUser.userId];
          return next;
        });
        setMessage("User deleted successfully.");
      } else {
        setRecords((prev) =>
          prev.map((item) =>
            item.userId === deleteTargetUser.userId
              ? { ...item, role: null, assignedTeachers: [] }
              : item,
          ),
        );
        setSelectedRoleByUser((prev) => ({
          ...prev,
          [deleteTargetUser.userId]: "students_only",
        }));
        setSelectedTeachersByUser((prev) => ({
          ...prev,
          [deleteTargetUser.userId]: "",
        }));
        setMessage("Access removed successfully.");
      }

      setDeleteDialogOpen(false);
      setDeleteTargetUser(null);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Failed to delete user/access."));
    } finally {
      setDeletingMode(null);
    }
  }

  if (!isAuthEnabled) {
    return (
      <Card className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <CardHeader className="border-b border-slate-200 bg-slate-50 pb-4 dark:border-slate-700 dark:bg-slate-800/50">
          <CardTitle className="text-lg text-slate-900 dark:text-white">Access Management</CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-sm text-slate-600 dark:text-slate-400">
          Enable Supabase auth to manage user access.
        </CardContent>
      </Card>
    );
  }

  if (role !== "admin") {
    return null;
  }

  const filteredRecords = records.filter((item) => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return true;
    }

    return (
      item.email.toLowerCase().includes(normalized) ||
      item.userId.toLowerCase().includes(normalized) ||
      (item.role ?? "").toLowerCase().includes(normalized) ||
      (item.assignedTeachers ?? []).some((teacher) => teacher.toLowerCase().includes(normalized))
    );
  });

  return (
    <Card className="overflow-hidden border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <CardHeader className="border-b border-slate-200 bg-slate-50 pb-6 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-600 dark:bg-slate-700">
              <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-900 dark:text-white">Access Management</CardTitle>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Admin-only control panel for assigning and updating app access.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => void loadUsers(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900 dark:text-white">Add New User</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Create a new user with access permissions</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Email Address</label>
              <Input
                value={createEmail}
                onChange={(event) => setCreateEmail(event.target.value)}
                placeholder="user@email.com"
                autoComplete="email"
                className="h-10 border-slate-300 dark:border-slate-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Temporary Password</label>
              <Input
                type="password"
                value={createPassword}
                onChange={(event) => setCreatePassword(event.target.value)}
                placeholder="Min 6 characters"
                autoComplete="new-password"
                className="h-10 border-slate-300 dark:border-slate-600"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                onClick={() => void handleCreateUser()}
                disabled={creating}
                className="h-10 rounded-lg bg-emerald-600 px-6 font-medium text-white hover:bg-emerald-700"
              >
                {creating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Access Role</label>
              <Select value={createRole} onValueChange={(value: UserAccessRole) => setCreateRole(value)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((roleOption) => (
                    <SelectItem key={roleOption.value} value={roleOption.value}>
                      {roleOption.value === "admin" ? (
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                          {roleOption.label}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-sky-500" />
                          {roleOption.label}
                        </div>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {createRole === "students_only" ? (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Assign Teachers</label>
                <div className="flex flex-wrap gap-2">
                  {teacherOptions.length > 0 ? (
                    teacherOptions.map((teacher) => {
                      const isSelected = createAssignedTeachers.split(",").map(t => t.trim()).filter(Boolean).includes(teacher);
                      return (
                        <button
                          key={teacher}
                          type="button"
                          onClick={() => {
                            const current = createAssignedTeachers.split(",").map(t => t.trim()).filter(Boolean);
                            if (isSelected) {
                              setCreateAssignedTeachers(current.filter(t => t !== teacher).join(", "));
                            } else {
                              setCreateAssignedTeachers([...current, teacher].join(", "));
                            }
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                            isSelected
                              ? "bg-cyan-500 text-white"
                              : "border border-dashed border-cyan-300 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:border-cyan-700/50 dark:bg-cyan-950/30 dark:text-cyan-300 dark:hover:bg-cyan-900/50"
                          )}
                        >
                          {isSelected && <ShieldCheck className="h-3.5 w-3.5" />}
                          {teacher}
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500 italic dark:text-slate-400">
                      No teachers available. Add teachers to students first.
                    </p>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select one or more teachers
                </p>
              </div>
            ) : (
              <div className="flex items-end">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Full access to all features and settings
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by email, user id, role, or teacher"
            className="max-w-md border-slate-300 dark:border-slate-600"
          />
          {message ? (
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{message}</p>
          ) : null}
          {error ? <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p> : null}
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            Loading access records...
          </div>
        ) : (
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className="border-slate-200 dark:border-slate-700">
                <TableHead className="text-slate-600 dark:text-slate-400">User</TableHead>
                <TableHead className="text-slate-600 dark:text-slate-400">Current Access</TableHead>
                <TableHead className="text-slate-600 dark:text-slate-400">Change Access</TableHead>
                <TableHead className="text-slate-600 dark:text-slate-400">Teacher Scope</TableHead>
                <TableHead className="text-right text-slate-600 dark:text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length ? (
                filteredRecords.map((item) => {
                  const selectedRole = selectedRoleByUser[item.userId] ?? "students_only";
                  const selectedTeachersRaw = selectedTeachersByUser[item.userId] ?? "";
                  const isSaving = savingUserId === item.userId;
                  const originalTeachers = parseTeacherNames(formatTeacherNames(item.assignedTeachers));
                  const selectedTeachers = parseTeacherNames(selectedTeachersRaw);
                  const hasRoleChanged = selectedRole !== (item.role ?? "students_only");
                  const hasTeachersChanged =
                    selectedRole === "students_only" &&
                    originalTeachers.join("|") !== selectedTeachers.join("|");
                  const hasChanged = hasRoleChanged || hasTeachersChanged;

                  return (
                    <TableRow key={item.userId} className="border-slate-200 dark:border-slate-700">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                            <UserCog className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900 dark:text-white">{item.email}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Joined {formatCreatedDate(item.createdAt)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.role ? (
                          <Badge
                            variant="outline"
                            className={
                              item.role === "admin"
                                ? "inline-flex items-center gap-1.5 rounded-full border-emerald-500/45 bg-emerald-500/15 px-2.5 py-1 font-medium text-emerald-700 dark:text-emerald-300"
                                : "inline-flex items-center gap-1.5 rounded-full border-sky-500/45 bg-sky-500/15 px-2.5 py-1 font-medium text-sky-700 dark:text-sky-300"
                            }
                          >
                            {item.role === "admin" ? (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            ) : (
                              <Users className="h-3.5 w-3.5" />
                            )}
                            {roleLabel(item.role)}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="inline-flex items-center gap-1.5 rounded-full border-slate-500/35 bg-slate-500/15 px-2.5 py-1 font-medium text-slate-600 dark:text-slate-300"
                          >
                            <CircleSlash className="h-3.5 w-3.5" />
                            Unassigned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={selectedRole}
                          onValueChange={(value: UserAccessRole) =>
                            setSelectedRoleByUser((prev) => ({ ...prev, [item.userId]: value }))
                          }
                        >
                          <SelectTrigger className="w-[190px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((roleOption) => (
                              <SelectItem key={roleOption.value} value={roleOption.value}>
                                {roleOption.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {selectedRole === "students_only" ? (
                          teacherOptions.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {teacherOptions.map((teacher) => {
                                const isSelected = selectedTeachersRaw.split(",").map(t => t.trim()).filter(Boolean).includes(teacher);
                                return (
                                  <button
                                    key={teacher}
                                    type="button"
                                    onClick={() => {
                                      const current = selectedTeachersRaw.split(",").map(t => t.trim()).filter(Boolean);
                                      const newTeachers = isSelected
                                        ? current.filter(t => t !== teacher)
                                        : [...current, teacher];
                                      setSelectedTeachersByUser((prev) => ({
                                        ...prev,
                                        [item.userId]: newTeachers.join(", "),
                                      }));
                                    }}
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-all",
                                      isSelected
                                        ? "bg-cyan-500 text-white"
                                        : "border border-dashed border-cyan-300 bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300 dark:hover:bg-cyan-900/50 dark:border-cyan-700/50"
                                    )}
                                  >
                                    {teacher}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic dark:text-slate-400">No teachers available</span>
                          )
                        ) : (
                          <span className="text-xs text-slate-500 dark:text-slate-400">Not required</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openDeleteDialog(item)}
                            disabled={isSaving}
                            className="h-8 w-8 rounded-full p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void handleSave(item.userId)}
                            disabled={!hasChanged || isSaving}
                            className="h-8 rounded-full px-4 text-xs font-medium"
                          >
                            {isSaving ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Save"
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-slate-500 dark:text-slate-400">
                    No users matched your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(nextOpen) => {
          setDeleteDialogOpen(nextOpen);
          if (!nextOpen) {
            setDeleteTargetUser(null);
            setDeletingMode(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User or Remove Access</DialogTitle>
            <DialogDescription>
              {deleteTargetUser ? (
                <>
                  Select action for <span className="font-medium text-foreground">{deleteTargetUser.email}</span>.
                </>
              ) : (
                "Select a delete action."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <p>
              <span className="font-medium text-slate-900 dark:text-white">Remove Access</span>: keeps user account,
              removes app role.
            </p>
            <p className="mt-2">
              <span className="font-medium text-slate-900 dark:text-white">Delete User</span>: permanently removes
              auth user and access.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleDelete("access")}
              disabled={
                Boolean(deletingMode) ||
                !deleteTargetUser ||
                deleteTargetUser.role === null
              }
            >
              {deletingMode === "access" ? "Removing..." : "Remove Access"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="gap-2"
              onClick={() => void handleDelete("user")}
              disabled={Boolean(deletingMode) || !deleteTargetUser}
            >
              <Trash2 className="h-4 w-4" />
              {deletingMode === "user" ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
