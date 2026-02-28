"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";
import type {
  AttendanceDraft,
  AttendanceRecord,
  AttendanceStatus,
  Student,
  StudentBatch,
} from "@/lib/types";

interface AttendanceTabProps {
  students: Student[];
  getAttendanceForDate: (date: string) => AttendanceRecord[];
  onSaveAttendance: (date: string, entries: AttendanceDraft[]) => Promise<void>;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type MonthlyDayKind = "present" | "absent" | "weekend" | "unmarked";

interface MonthlyDayCell {
  date: Date;
  dateKey: string;
  dayNumber: number;
  kind: MonthlyDayKind;
  note?: string;
}

type SaveToastVariant = "success" | "error";

interface SaveToastState {
  message: string;
  variant: SaveToastVariant;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthValueFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function parseMonthValue(value: string) {
  const [yearRaw, monthRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return new Date();
  }

  return new Date(year, month - 1, 1);
}

function getNearestWeekday(date: Date) {
  const day = date.getDay();
  if (day === 0) {
    const adjusted = new Date(date);
    adjusted.setDate(adjusted.getDate() + 1);
    return adjusted;
  }
  if (day === 6) {
    const adjusted = new Date(date);
    adjusted.setDate(adjusted.getDate() + 2);
    return adjusted;
  }
  return date;
}

function formatBatchLabel(batch: StudentBatch) {
  return batch === "morning" ? "Morning Session" : "Evening Session";
}

function getMonthlyCellTooltip(cell: MonthlyDayCell) {
  const lines = [format(cell.date, "PPP")];

  if (cell.kind === "weekend") {
    lines.push("Status: Weekend / Non-working day");
  } else if (cell.kind === "present") {
    lines.push("Status: Present");
  } else if (cell.kind === "absent") {
    lines.push("Status: Absent");
  } else {
    lines.push("Status: Not marked");
  }

  if (cell.note?.trim()) {
    lines.push(`Note: ${cell.note.trim()}`);
  }

  return lines.join("\n");
}

export function AttendanceTab({
  students,
  getAttendanceForDate,
  onSaveAttendance,
}: AttendanceTabProps) {
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date>(() =>
    getNearestWeekday(new Date()),
  );
  const [selectedMonth, setSelectedMonth] = React.useState<string>(() =>
    monthValueFromDate(getNearestWeekday(new Date())),
  );
  const [selectedBatch, setSelectedBatch] = React.useState<StudentBatch>("morning");
  const [selectedStudentId, setSelectedStudentId] = React.useState<string | null>(null);
  const [statusMap, setStatusMap] = React.useState<Record<string, AttendanceStatus>>({});
  const [noteMap, setNoteMap] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [saveToast, setSaveToast] = React.useState<SaveToastState | null>(null);
  const toastTimeoutRef = React.useRef<number | null>(null);

  const selectedDateKey = React.useMemo(() => toDateKey(selectedDate), [selectedDate]);

  const activeBatchStudents = React.useMemo(
    () =>
      students
        .filter((student) => student.status === "active" && student.batch === selectedBatch)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [students, selectedBatch],
  );

  const existingRecordsForDate = React.useMemo(
    () => getAttendanceForDate(selectedDateKey),
    [getAttendanceForDate, selectedDateKey],
  );

  const existingByStudent = React.useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    existingRecordsForDate.forEach((record) => {
      map.set(record.studentId, record);
    });
    return map;
  }, [existingRecordsForDate]);

  const selectedStudent = React.useMemo(
    () => activeBatchStudents.find((student) => student.id === selectedStudentId) ?? null,
    [activeBatchStudents, selectedStudentId],
  );

  const showSaveToast = React.useCallback((message: string, variant: SaveToastVariant) => {
    setSaveToast({ message, variant });

    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = window.setTimeout(() => {
      setSaveToast(null);
    }, 2200);
  }, []);

  React.useEffect(
    () => () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    },
    [],
  );

  React.useEffect(() => {
    setSelectedStudentId((current) => {
      if (!current) {
        return null;
      }

      return activeBatchStudents.some((student) => student.id === current) ? current : null;
    });
  }, [activeBatchStudents]);

  React.useEffect(() => {
    const nextStatus: Record<string, AttendanceStatus> = {};
    const nextNotes: Record<string, string> = {};

    activeBatchStudents.forEach((student) => {
      const existing = existingByStudent.get(student.id);
      nextStatus[student.id] = existing?.status ?? "present";
      nextNotes[student.id] = existing?.note ?? "";
    });

    setStatusMap(nextStatus);
    setNoteMap(nextNotes);
  }, [activeBatchStudents, existingByStudent]);

  const summary = React.useMemo(() => {
    const total = activeBatchStudents.length;
    const present = activeBatchStudents.reduce((count, student) => {
      return count + (statusMap[student.id] === "absent" ? 0 : 1);
    }, 0);
    const absent = total - present;
    return { total, present, absent };
  }, [activeBatchStudents, statusMap]);

  const hasBatchAttendanceRecorded = React.useMemo(
    () => existingRecordsForDate.some((record) => record.batch === selectedBatch),
    [existingRecordsForDate, selectedBatch],
  );

  const monthlyView = React.useMemo(() => {
    if (!selectedStudent) {
      return null;
    }

    const monthDate = parseMonthValue(selectedMonth);
    const year = monthDate.getFullYear();
    const monthIndex = monthDate.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const leadingEmptyCells = firstDay.getDay();
    const dayCells: MonthlyDayCell[] = [];

    let presentDays = 0;
    let absentDays = 0;
    let workingDays = 0;

    for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
      const date = new Date(year, monthIndex, dayNumber);
      const dateKey = toDateKey(date);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const record = getAttendanceForDate(dateKey).find(
        (entry) => entry.studentId === selectedStudent.id,
      );

      const draftStatus = dateKey === selectedDateKey ? statusMap[selectedStudent.id] : undefined;
      const draftNote = dateKey === selectedDateKey ? noteMap[selectedStudent.id] : undefined;

      const resolvedStatus = draftStatus ?? record?.status;
      const resolvedNote = draftNote ?? record?.note;

      if (isWeekend) {
        dayCells.push({
          date,
          dateKey,
          dayNumber,
          kind: "weekend",
          note: resolvedNote,
        });
        continue;
      }

      workingDays += 1;

      if (resolvedStatus === "present") {
        presentDays += 1;
        dayCells.push({
          date,
          dateKey,
          dayNumber,
          kind: "present",
          note: resolvedNote,
        });
      } else if (resolvedStatus === "absent") {
        absentDays += 1;
        dayCells.push({
          date,
          dateKey,
          dayNumber,
          kind: "absent",
          note: resolvedNote,
        });
      } else {
        dayCells.push({
          date,
          dateKey,
          dayNumber,
          kind: "unmarked",
          note: resolvedNote,
        });
      }
    }

    const trailingEmptyCells = (7 - ((leadingEmptyCells + dayCells.length) % 7)) % 7;
    const attendancePercentage =
      workingDays > 0 ? Math.round((presentDays / workingDays) * 1000) / 10 : 0;

    return {
      dayCells,
      leadingEmptyCells,
      trailingEmptyCells,
      presentDays,
      absentDays,
      workingDays,
      attendancePercentage,
      monthLabel: format(monthDate, "MMMM yyyy"),
    };
  }, [selectedStudent, selectedMonth, getAttendanceForDate, selectedDateKey, statusMap, noteMap]);

  async function handleSave() {
    if (!activeBatchStudents.length) {
      return;
    }

    setSaving(true);

    try {
      const payload: AttendanceDraft[] = activeBatchStudents.map((student) => ({
        studentId: student.id,
        studentName: student.name,
        batch: student.batch,
        status: statusMap[student.id] ?? "present",
        note: noteMap[student.id]?.trim() || undefined,
      }));

      await onSaveAttendance(selectedDateKey, payload);

      const successMessage = `${formatBatchLabel(selectedBatch)} attendance saved for ${format(
        selectedDate,
        "PPP",
      )}.`;

      showSaveToast(successMessage, "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save attendance. Please try again.";
      showSaveToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">Mark Attendance</CardTitle>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Select value={selectedBatch} onValueChange={(value) => setSelectedBatch(value as StudentBatch)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">Morning Session</SelectItem>
              <SelectItem value="evening">Evening Session</SelectItem>
            </SelectContent>
          </Select>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start sm:w-[240px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (!date) {
                    return;
                  }

                  if (date.getDay() === 0 || date.getDay() === 6) {
                    return;
                  }

                  setSelectedDate(date);
                  setCalendarOpen(false);
                }}
                disabled={(date) => date.getDay() === 0 || date.getDay() === 6}
                fixedWeeks
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasBatchAttendanceRecorded ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {format(selectedDate, "PPP")} - {formatBatchLabel(selectedBatch)} attendance has
              already been recorded.
            </span>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/80 bg-white/60 p-3 dark:border-white/15 dark:bg-white/[0.04]">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Total Students</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.total}</p>
          </div>
          <div className="rounded-xl border border-emerald-300/70 bg-emerald-500/10 p-3 dark:border-emerald-500/35 dark:bg-emerald-500/12">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Present</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
              {summary.present}
            </p>
          </div>
          <div className="rounded-xl border border-rose-300/70 bg-rose-500/10 p-3 dark:border-rose-500/35 dark:bg-rose-500/12">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Absent</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-rose-700 dark:text-rose-300">
              {summary.absent}
            </p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeBatchStudents.map((student) => {
              const status = statusMap[student.id] ?? "present";
              const isAbsent = status === "absent";
              const isSelected = selectedStudentId === student.id;

              return (
                <TableRow
                  key={student.id}
                  className={cn(
                    "transition-colors",
                    isAbsent && "bg-rose-50/80 hover:bg-rose-100/60 dark:bg-rose-950/30",
                    isSelected && "ring-1 ring-primary/40",
                  )}
                >
                  <TableCell className="font-medium">
                    <button
                      type="button"
                      onClick={() => setSelectedStudentId(student.id)}
                      className={cn(
                        "text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isSelected ? "text-primary" : "text-foreground/95 hover:text-primary",
                      )}
                    >
                      {student.name}
                    </button>
                  </TableCell>
                  <TableCell>{student.phone}</TableCell>
                  <TableCell>{formatBatchLabel(student.batch)}</TableCell>
                  <TableCell>
                    <div className="inline-flex overflow-hidden rounded-md border border-border/70 dark:border-white/15">
                      <button
                        type="button"
                        className={cn(
                          "px-3 py-1.5 text-sm transition-colors",
                          status === "present"
                            ? "bg-emerald-500 text-white"
                            : "bg-background text-muted-foreground",
                        )}
                        onClick={() =>
                          setStatusMap((prev) => ({
                            ...prev,
                            [student.id]: "present",
                          }))
                        }
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "border-l border-border/70 px-3 py-1.5 text-sm transition-colors dark:border-white/15",
                          status === "absent"
                            ? "bg-rose-500 text-white"
                            : "bg-background text-muted-foreground",
                        )}
                        onClick={() =>
                          setStatusMap((prev) => ({
                            ...prev,
                            [student.id]: "absent",
                          }))
                        }
                      >
                        Absent
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Optional note"
                      value={noteMap[student.id] ?? ""}
                      onChange={(event) =>
                        setNoteMap((prev) => ({
                          ...prev,
                          [student.id]: event.target.value,
                        }))
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })}

            {!activeBatchStudents.length ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No active students found in {formatBatchLabel(selectedBatch).toLowerCase()}.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p
            className={cn(
              "flex min-h-5 items-center gap-2 text-sm transition-colors",
              saveToast
                ? saveToast.variant === "success"
                  ? "text-emerald-600 dark:text-emerald-300"
                  : "text-rose-600 dark:text-rose-300"
                : "text-muted-foreground",
            )}
            role="status"
            aria-live="polite"
          >
            {saveToast ? (
              saveToast.variant === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <CircleAlert className="h-4 w-4 shrink-0" />
              )
            ) : null}
            <span>
              {saveToast
                ? saveToast.message
                : "Click any student name to open their monthly attendance calendar."}
            </span>
          </p>
          <Button onClick={handleSave} disabled={saving || !activeBatchStudents.length}>
            {saving ? "Saving..." : "Save Attendance"}
          </Button>
        </div>

        {selectedStudent && monthlyView ? (
          <div className="space-y-4 rounded-2xl border border-border/80 bg-white/60 p-4 backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.04]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-base font-semibold">Student Attendance Calendar</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedStudent.name} • {formatBatchLabel(selectedStudent.batch)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Month</span>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  className="h-9 w-[170px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="py-1 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: monthlyView.leadingEmptyCells }).map((_, index) => (
                <div
                  key={`leading-empty-${index + 1}`}
                  className="h-20 rounded-xl border border-dashed border-border/45 dark:border-white/10"
                />
              ))}

              {monthlyView.dayCells.map((cell) => (
                <div
                  key={cell.dateKey}
                  title={getMonthlyCellTooltip(cell)}
                  className={cn(
                    "h-20 rounded-xl border p-2 transition-transform duration-200 hover:-translate-y-0.5",
                    cell.kind === "present" &&
                      "border-emerald-300/70 bg-emerald-500/15 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/12 dark:text-emerald-200",
                    cell.kind === "absent" &&
                      "border-rose-300/70 bg-rose-500/15 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/12 dark:text-rose-200",
                    cell.kind === "weekend" &&
                      "border-border/70 bg-slate-200/55 text-muted-foreground dark:border-white/15 dark:bg-white/[0.04]",
                    cell.kind === "unmarked" &&
                      "border-border/70 bg-background/60 text-muted-foreground dark:border-white/12 dark:bg-white/[0.02]",
                  )}
                >
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      cell.kind === "weekend" && "line-through opacity-80",
                    )}
                  >
                    {cell.dayNumber}
                  </p>

                  <p
                    className={cn(
                      "mt-4 text-[10px] font-medium uppercase tracking-[0.14em]",
                      cell.kind === "present" && "text-emerald-700 dark:text-emerald-300",
                      cell.kind === "absent" && "text-rose-700 dark:text-rose-300",
                      (cell.kind === "weekend" || cell.kind === "unmarked") &&
                        "text-muted-foreground",
                    )}
                  >
                    {cell.kind === "weekend"
                      ? "Weekend"
                      : cell.kind === "present"
                        ? "Present"
                        : cell.kind === "absent"
                          ? "Absent"
                          : "Not Marked"}
                  </p>
                </div>
              ))}

              {Array.from({ length: monthlyView.trailingEmptyCells }).map((_, index) => (
                <div
                  key={`trailing-empty-${index + 1}`}
                  className="h-20 rounded-xl border border-dashed border-border/45 dark:border-white/10"
                />
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-emerald-300/70 bg-emerald-500/10 p-3 dark:border-emerald-500/35 dark:bg-emerald-500/12">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Total Present Days</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                  {monthlyView.presentDays}
                </p>
              </div>

              <div className="rounded-xl border border-rose-300/70 bg-rose-500/10 p-3 dark:border-rose-500/35 dark:bg-rose-500/12">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Total Absent Days</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-rose-700 dark:text-rose-300">
                  {monthlyView.absentDays}
                </p>
              </div>

              <div className="rounded-xl border border-blue-300/70 bg-blue-500/10 p-3 dark:border-blue-500/35 dark:bg-blue-500/12">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Attendance Percentage</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-blue-700 dark:text-blue-300">
                  {monthlyView.attendancePercentage.toFixed(1)}% Present
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-white/60 p-3 dark:border-white/15 dark:bg-white/[0.05]">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Working Days in Month</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{monthlyView.workingDays}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Viewing {monthlyView.monthLabel}. Hover any date cell to see detailed status and note.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/80 bg-white/60 p-4 text-sm text-muted-foreground dark:border-white/15 dark:bg-white/[0.04]">
            Click on a student name to open the monthly attendance calendar.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
