"use client";

import * as React from "react";
import { RefreshCw, ShieldCheck, Trash2, UserCog, UserPlus } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
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
  { value: "students_only", label: "Students Only" },
];

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
  const [records, setRecords] = React.useState<UserAccess[]>([]);
  const [selectedRoleByUser, setSelectedRoleByUser] = React.useState<Record<string, UserAccessRole>>(
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
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = React.useState<UserAccess | null>(null);
  const [deletingMode, setDeletingMode] = React.useState<UserDeleteMode | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

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
        setRecords(users);
        setSelectedRoleByUser(nextSelection);
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

    if (user?.id === userId && selectedRole !== "admin") {
      setError("You cannot remove your own admin access.");
      return;
    }

    setError(null);
    setSavingUserId(userId);

    try {
      await dataService.updateUserAccessRole(userId, selectedRole);
      setRecords((prev) =>
        prev.map((item) =>
          item.userId === userId
            ? {
                ...item,
                role: selectedRole,
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
    if (!email) {
      setError("Email is required.");
      return;
    }

    if (createPassword.length < 6) {
      setError("Password must be at least 6 characters.");
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

      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("students_only");
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
        setMessage("User deleted successfully.");
      } else {
        setRecords((prev) =>
          prev.map((item) =>
            item.userId === deleteTargetUser.userId ? { ...item, role: null } : item,
          ),
        );
        setSelectedRoleByUser((prev) => ({
          ...prev,
          [deleteTargetUser.userId]: "students_only",
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Access Management</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
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
      (item.role ?? "").toLowerCase().includes(normalized)
    );
  });

  return (
    <Card className="overflow-hidden border border-border/80 bg-white/55 dark:border-white/15 dark:bg-white/[0.04]">
      <CardHeader className="border-b border-border/70 bg-gradient-to-br from-emerald-500/12 via-cyan-500/10 to-sky-500/12 dark:border-white/10 dark:from-emerald-400/16 dark:via-cyan-400/12 dark:to-sky-400/16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-white/50 bg-white/70 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-white/20 dark:bg-white/[0.08]">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base md:text-lg">Access Management</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
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

      <CardContent className="space-y-5 p-6 md:p-7">
        <div className="rounded-xl border border-border/80 bg-white/45 p-5 dark:border-white/15 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Add New User</p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(220px,1fr)_minmax(200px,1fr)_190px_auto]">
            <Input
              value={createEmail}
              onChange={(event) => setCreateEmail(event.target.value)}
              placeholder="user@email.com"
              autoComplete="email"
            />
            <Input
              type="password"
              value={createPassword}
              onChange={(event) => setCreatePassword(event.target.value)}
              placeholder="Temporary password"
              autoComplete="new-password"
            />
            <Select value={createRole} onValueChange={(value: UserAccessRole) => setCreateRole(value)}>
              <SelectTrigger>
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
            <Button
              type="button"
              onClick={() => void handleCreateUser()}
              disabled={creating}
              className="h-[42px]"
            >
              {creating ? "Adding..." : "Add User"}
            </Button>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            This creates a Supabase auth account and assigns selected access immediately.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by email, user id, or role"
            className="max-w-md"
          />
          {message ? (
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{message}</p>
          ) : null}
          {error ? <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p> : null}
        </div>

        {loading ? (
          <div className="rounded-xl border border-border/80 bg-white/40 px-4 py-6 text-sm text-muted-foreground dark:border-white/15 dark:bg-white/[0.03]">
            Loading access records...
          </div>
        ) : (
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Current Access</TableHead>
                <TableHead>Change Access</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length ? (
                filteredRecords.map((item) => {
                  const selectedRole = selectedRoleByUser[item.userId] ?? "students_only";
                  const isSaving = savingUserId === item.userId;
                  const hasChanged = selectedRole !== (item.role ?? "students_only");

                  return (
                    <TableRow key={item.userId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserCog className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{item.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {formatCreatedDate(item.createdAt)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{item.userId}</span>
                      </TableCell>
                      <TableCell>
                        {item.role ? (
                          <Badge
                            variant="outline"
                            className={
                              item.role === "admin"
                                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                                : "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            }
                          >
                            {item.role === "admin" ? "Admin" : "Students Only"}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-slate-500/35 bg-slate-500/15 text-slate-600 dark:text-slate-300"
                          >
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
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void handleSave(item.userId)}
                          disabled={!hasChanged || isSaving}
                          className="min-w-[94px]"
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeleteDialog(item)}
                          disabled={isSaving}
                          className="ml-2 min-w-[86px]"
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
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
        <DialogContent className="max-w-lg">
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

          <div className="rounded-xl border border-border/80 bg-white/45 p-4 text-sm text-muted-foreground dark:border-white/15 dark:bg-white/[0.03]">
            <p>
              <span className="font-medium text-foreground">Remove Access</span>: keeps user account,
              removes app role.
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">Delete User</span>: permanently removes
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
