"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentMonthKey } from "@/lib/dashboard-metrics";
import type {
  FinanceTransaction,
  PaymentStatus,
  Student,
  StudentFormInput,
  TransactionFormInput,
} from "@/lib/types";

interface StudentFinanceTabProps {
  students: Student[];
  finances: FinanceTransaction[];
  onAddTransaction: (input: TransactionFormInput) => Promise<void>;
  onUpdateTransaction: (id: string, input: TransactionFormInput) => Promise<void>;
  onUpdateStudent: (id: string, input: StudentFormInput) => Promise<void>;
}

interface StudentFinanceRow {
  student: Student;
  primaryTransaction: FinanceTransaction | null;
  isPaid: boolean;
}

function formatMonthKey(dateInput: string | Date) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return `${date.toLocaleString("en-US", { month: "long" })} ${year}`;
}

function getMonthOptions(finances: FinanceTransaction[]) {
  const monthKeys = new Set(
    finances
      .filter((item) => item.category === "Student Fee")
      .map((item) => formatMonthKey(item.transactionDate)),
  );
  monthKeys.add(getCurrentMonthKey());

  return Array.from(monthKeys)
    .sort()
    .reverse()
    .map((key) => ({
      value: key,
      label: formatMonthLabel(key),
    }));
}

function getNewTransactionDate(monthKey: string) {
  const currentMonth = getCurrentMonthKey();
  if (monthKey === currentMonth) {
    return getTodayDateKey();
  }
  return `${monthKey}-01`;
}

function formatBatchLabel(batch: Student["batch"]) {
  return batch === "morning" ? "Morning Session" : "Evening Session";
}

function buildStudentFeePayload(
  student: Student,
  status: PaymentStatus,
  monthKey: string,
): TransactionFormInput {
  return {
    transactionDate: getNewTransactionDate(monthKey),
    category: "Student Fee",
    type: "income",
    amount: student.monthlyFee,
    status,
    description: `${formatMonthLabel(monthKey)} fee status`,
    note: undefined,
    studentId: student.id,
  };
}

function toActionErrorMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Action failed. Please try again.";

  const isNetworkFailure =
    message.toLowerCase().includes("fetch failed") ||
    message.toLowerCase().includes("load failed") ||
    message.toLowerCase().includes("failed to fetch") ||
    message.toLowerCase().includes("networkerror");

  if (isNetworkFailure) {
    return "Could not reach server while updating payment status. Please retry.";
  }

  return message;
}

export function StudentFinanceTab({
  students,
  finances,
  onAddTransaction,
  onUpdateTransaction,
  onUpdateStudent,
}: StudentFinanceTabProps) {
  const monthOptions = React.useMemo(() => getMonthOptions(finances), [finances]);
  const [selectedMonth, setSelectedMonth] = React.useState(getCurrentMonthKey());
  const [search, setSearch] = React.useState("");
  const [updatingStudentId, setUpdatingStudentId] = React.useState<string | null>(null);
  const [updatingFeeStudentId, setUpdatingFeeStudentId] = React.useState<string | null>(null);
  const [feeDrafts, setFeeDrafts] = React.useState<Record<string, string>>({});
  const [actionError, setActionError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!monthOptions.some((option) => option.value === selectedMonth)) {
      setSelectedMonth(monthOptions[0]?.value ?? getCurrentMonthKey());
    }
  }, [monthOptions, selectedMonth]);

  const activeStudents = React.useMemo(
    () => students.filter((student) => student.status === "active"),
    [students],
  );

  const filteredStudents = React.useMemo(() => {
    if (!search.trim()) {
      return activeStudents;
    }
    const query = search.trim().toLowerCase();
    return activeStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.phone.toLowerCase().includes(query) ||
        student.batch.toLowerCase().includes(query),
    );
  }, [activeStudents, search]);

  const monthTransactions = React.useMemo(
    () =>
      finances.filter(
        (item) =>
          item.category === "Student Fee" &&
          Boolean(item.studentId) &&
          formatMonthKey(item.transactionDate) === selectedMonth,
      ),
    [finances, selectedMonth],
  );

  const rows = React.useMemo<StudentFinanceRow[]>(() => {
    return filteredStudents.map((student) => {
      const studentTransactions = monthTransactions
        .filter((item) => item.studentId === student.id)
        .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));

      const primaryTransaction = studentTransactions[0] ?? null;

      return {
        student,
        primaryTransaction,
        isPaid: primaryTransaction?.status === "paid",
      };
    });
  }, [filteredStudents, monthTransactions]);

  async function handleTogglePayment(row: StudentFinanceRow, checked: boolean) {
    const nextStatus: PaymentStatus = checked ? "paid" : "pending";
    setActionError(null);
    setUpdatingStudentId(row.student.id);

    try {
      if (row.primaryTransaction) {
        await onUpdateTransaction(row.primaryTransaction.id, {
          transactionDate: row.primaryTransaction.transactionDate,
          category: "Student Fee",
          type: "income",
          amount: row.primaryTransaction.amount || row.student.monthlyFee,
          status: nextStatus,
          description:
            row.primaryTransaction.description ||
            `${formatMonthLabel(selectedMonth)} fee status`,
          note: row.primaryTransaction.note,
          studentId: row.student.id,
        });
      } else {
        await onAddTransaction(buildStudentFeePayload(row.student, nextStatus, selectedMonth));
      }
    } catch (error) {
      setActionError(toActionErrorMessage(error));
    } finally {
      setUpdatingStudentId(null);
    }
  }

  function getFeeDraft(student: Student) {
    return feeDrafts[student.id] ?? String(student.monthlyFee);
  }

  async function handleSaveMonthlyFee(student: Student) {
    const raw = getFeeDraft(student).trim();
    const nextMonthlyFee = Number(raw);
    if (!raw || Number.isNaN(nextMonthlyFee) || nextMonthlyFee < 0) {
      return;
    }
    if (nextMonthlyFee === student.monthlyFee) {
      return;
    }

    setActionError(null);
    setUpdatingFeeStudentId(student.id);
    try {
      await onUpdateStudent(student.id, {
        name: student.name,
        phone: student.phone,
        batch: student.batch,
        joinDate: student.joinDate,
        status: student.status,
        monthlyFee: nextMonthlyFee,
      });
      setFeeDrafts((prev) => ({
        ...prev,
        [student.id]: String(nextMonthlyFee),
      }));
    } catch (error) {
      setActionError(toActionErrorMessage(error));
    } finally {
      setUpdatingFeeStudentId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">Student Finance</CardTitle>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Input
            placeholder="Search by name, phone, or batch"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:w-[260px]"
          />
          <div className="w-full sm:w-[220px]">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {actionError ? (
          <p className="mb-3 text-sm font-medium text-destructive">{actionError}</p>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Monthly Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Update</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const monthlyFeeDraft = getFeeDraft(row.student);
              const parsedDraft = Number(monthlyFeeDraft);
              const canSaveFee =
                monthlyFeeDraft.trim() !== "" &&
                !Number.isNaN(parsedDraft) &&
                parsedDraft >= 0 &&
                parsedDraft !== row.student.monthlyFee &&
                updatingFeeStudentId !== row.student.id;

              return (
                <TableRow key={row.student.id}>
                  <TableCell>
                    <p className="font-medium">{row.student.name}</p>
                    <p className="text-xs text-muted-foreground">{row.student.phone}</p>
                  </TableCell>
                  <TableCell>{formatBatchLabel(row.student.batch)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={monthlyFeeDraft}
                        onChange={(event) => {
                          setFeeDrafts((prev) => ({
                            ...prev,
                            [row.student.id]: event.target.value,
                          }));
                        }}
                        className="h-8 w-24"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!canSaveFee}
                        onClick={() => {
                          void handleSaveMonthlyFee(row.student);
                        }}
                      >
                        {updatingFeeStudentId === row.student.id ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        row.isPaid
                          ? "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-500/40 dark:bg-orange-500/15 dark:text-orange-300"
                      }
                    >
                      {row.isPaid ? "Paid" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={row.isPaid}
                        disabled={updatingStudentId === row.student.id}
                        onCheckedChange={(checked) => {
                          void handleTogglePayment(row, checked);
                        }}
                        aria-label={`Toggle payment status for ${row.student.name}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {updatingStudentId === row.student.id
                          ? "Updating..."
                          : row.isPaid
                            ? "Mark Pending"
                            : "Mark Paid"}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {!rows.length ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                  No active students found for this filter.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
