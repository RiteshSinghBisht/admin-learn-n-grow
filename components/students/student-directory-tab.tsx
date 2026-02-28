"use client";

import * as React from "react";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";

import { StudentFormDialog } from "@/components/students/student-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import type { Student, StudentBatch, StudentFormInput } from "@/lib/types";

interface StudentDirectoryTabProps {
  students: Student[];
  onAdd: (input: StudentFormInput) => Promise<void>;
  onUpdate: (id: string, input: StudentFormInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatBatchLabel(value: "morning" | "evening") {
  return value === "morning" ? "Morning Session" : "Evening Session";
}

function isValidBatch(value: string): value is StudentBatch {
  return value === "morning" || value === "evening";
}

export function StudentDirectoryTab({
  students,
  onAdd,
  onUpdate,
  onDelete,
}: StudentDirectoryTabProps) {
  const [search, setSearch] = React.useState("");
  const [selectedTeacher, setSelectedTeacher] = React.useState<string>("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingStudent, setEditingStudent] = React.useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = React.useState<Student | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = React.useState<string | null>(null);
  const [batchUpdatingId, setBatchUpdatingId] = React.useState<string | null>(null);

  // Get unique teachers from students
  const teachers = React.useMemo(() => {
    const teacherSet = new Set<string>();
    students.forEach((student) => {
      if (student.teacher) {
        teacherSet.add(student.teacher);
      }
    });
    return Array.from(teacherSet).sort();
  }, [students]);

  const filteredStudents = React.useMemo(() => {
    let result = students;

    // Filter by teacher if selected
    if (selectedTeacher !== "all") {
      result = result.filter((student) => student.teacher === selectedTeacher);
    }

    // Filter by search query
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter(
        (student) =>
          student.name.toLowerCase().includes(query) ||
          student.phone.toLowerCase().includes(query) ||
          student.batch.toLowerCase().includes(query) ||
          (student.teacher && student.teacher.toLowerCase().includes(query)),
      );
    }

    return result;
  }, [students, search, selectedTeacher]);

  async function handleSubmit(input: StudentFormInput) {
    if (editingStudent) {
      await onUpdate(editingStudent.id, input);
      setEditingStudent(null);
      return;
    }

    await onAdd(input);
  }

  function handleOpenCreate() {
    setEditingStudent(null);
    setDialogOpen(true);
  }

  function handleEdit(student: Student) {
    setEditingStudent(student);
    setDialogOpen(true);
  }

  function handleOpenDeleteConfirm(student: Student) {
    setDeletingStudent(student);
    setDeleteConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deletingStudent) {
      return;
    }

    setDeleting(true);
    try {
      await onDelete(deletingStudent.id);
      setDeleteConfirmOpen(false);
      setDeletingStudent(null);
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleStatus(student: Student, checked: boolean) {
    setStatusUpdatingId(student.id);
    try {
      await onUpdate(student.id, {
        name: student.name,
        phone: student.phone,
        batch: student.batch,
        joinDate: student.joinDate,
        status: checked ? "active" : "inactive",
        monthlyFee: student.monthlyFee,
      });
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function handleSetBatch(student: Student, nextBatch: string) {
    if (!isValidBatch(nextBatch) || nextBatch === student.batch) {
      return;
    }

    setBatchUpdatingId(student.id);
    try {
      await onUpdate(student.id, {
        name: student.name,
        phone: student.phone,
        batch: nextBatch,
        joinDate: student.joinDate,
        status: student.status,
        monthlyFee: student.monthlyFee,
      });
    } finally {
      setBatchUpdatingId(null);
    }
  }

  function isStatusUpdating(studentId: string) {
    return statusUpdatingId === studentId;
  }

  function isBatchUpdating(studentId: string) {
    return batchUpdatingId === studentId;
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">Student Directory</CardTitle>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search by name or phone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:w-[260px]"
          />
          <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
            <SelectTrigger className="w-full border-cyan-300 bg-cyan-100/70 text-cyan-900 hover:bg-cyan-100 dark:border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-200 dark:hover:bg-cyan-500/20 sm:w-[210px]">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                <SelectValue placeholder="All Teachers" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teachers</SelectItem>
              {teachers.map((teacher) => (
                <SelectItem key={teacher} value={teacher}>
                  {teacher}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>{student.phone}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isBatchUpdating(student.id)}
                    onClick={() => {
                      const nextBatch = student.batch === "morning" ? "evening" : "morning";
                      void handleSetBatch(student, nextBatch);
                    }}
                    className={
                      student.batch === "morning"
                        ? "h-8 border-sky-300 bg-sky-100 px-3 text-sky-800 hover:bg-sky-100 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300 dark:hover:bg-sky-500/20"
                        : "h-8 border-violet-300 bg-violet-100 px-3 text-violet-800 hover:bg-violet-100 dark:border-violet-500/40 dark:bg-violet-500/15 dark:text-violet-300 dark:hover:bg-violet-500/20"
                    }
                  >
                    {isBatchUpdating(student.id) ? "Updating..." : formatBatchLabel(student.batch)}
                  </Button>
                </TableCell>
                <TableCell>
                  {student.teacher ? (
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-cyan-300 bg-cyan-100 px-3 text-xs font-semibold text-cyan-900 shadow-sm shadow-cyan-200/50 dark:border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-200 dark:shadow-none">
                      <UserRound className="h-3.5 w-3.5" />
                      {student.teacher}
                    </span>
                  ) : (
                    <span className="inline-flex h-8 items-center rounded-full border border-dashed border-muted-foreground/40 px-3 text-xs text-muted-foreground">
                      Unassigned
                    </span>
                  )}
                </TableCell>
                <TableCell>{formatDate(student.joinDate)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={student.status === "active"}
                      disabled={isStatusUpdating(student.id)}
                      onCheckedChange={(checked) => {
                        void handleToggleStatus(student, checked);
                      }}
                      aria-label={`Set ${student.name} status`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isStatusUpdating(student.id)}
                      onClick={() => {
                        void handleToggleStatus(student, student.status !== "active");
                      }}
                      className={
                        student.status === "active"
                          ? "h-8 border-emerald-300 bg-emerald-100 px-3 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                          : "h-8 border-orange-300 bg-orange-100 px-3 text-orange-800 hover:bg-orange-100 dark:border-orange-500/40 dark:bg-orange-500/15 dark:text-orange-300 dark:hover:bg-orange-500/20"
                      }
                    >
                      {isStatusUpdating(student.id)
                        ? "Updating..."
                        : student.status === "active"
                          ? "Active"
                          : "Inactive"}
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(student)}
                      aria-label="Edit student"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleOpenDeleteConfirm(student)}
                      aria-label="Delete student"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <StudentFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingStudent(null);
          }
        }}
        onSubmit={handleSubmit}
        initialData={editingStudent}
      />

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) {
            setDeletingStudent(null);
          }
        }}
        title="Delete Student?"
        description={
          deletingStudent
            ? `Are you sure you want to delete this student record?`
            : "Are you sure you want to delete this student?"
        }
        itemLabel={deletingStudent?.name}
        deleting={deleting}
        onConfirm={handleConfirmDelete}
      />
    </Card>
  );
}
