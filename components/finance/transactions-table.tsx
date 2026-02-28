"use client";

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import type { FinanceTransaction, Student } from "@/lib/types";

interface TransactionsTableProps {
  transactions: FinanceTransaction[];
  students: Student[];
  onEdit: (item: FinanceTransaction) => void;
  onDelete: (id: string) => Promise<void>;
  onToggleStatus: (id: string) => Promise<void>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function TransactionsTable({
  transactions,
  students,
  onEdit,
  onDelete,
  onToggleStatus,
}: TransactionsTableProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    React.useState<FinanceTransaction | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [togglingStatusIds, setTogglingStatusIds] = React.useState<Record<string, true>>({});
  const [showProcessingIds, setShowProcessingIds] = React.useState<Record<string, true>>({});
  const [statusErrorById, setStatusErrorById] = React.useState<Record<string, string>>({});
  const processingTimersRef = React.useRef<Record<string, number>>({});
  const studentsMap = new Map(students.map((student) => [student.id, student]));

  React.useEffect(() => {
    return () => {
      Object.values(processingTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      processingTimersRef.current = {};
    };
  }, []);

  function isTogglingStatus(id: string) {
    return Boolean(togglingStatusIds[id]);
  }

  function isShowingProcessing(id: string) {
    return Boolean(showProcessingIds[id]);
  }

  async function handleToggleStatus(id: string) {
    if (isTogglingStatus(id)) {
      return;
    }

    setStatusErrorById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setTogglingStatusIds((prev) => ({ ...prev, [id]: true }));

    const timerId = window.setTimeout(() => {
      setShowProcessingIds((prev) => ({ ...prev, [id]: true }));
    }, 1200);
    processingTimersRef.current[id] = timerId;

    try {
      await onToggleStatus(id);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Failed to update status. Please retry.";
      setStatusErrorById((prev) => ({ ...prev, [id]: message }));
    } finally {
      if (processingTimersRef.current[id]) {
        window.clearTimeout(processingTimersRef.current[id]);
        delete processingTimersRef.current[id];
      }

      setTogglingStatusIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      setShowProcessingIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  function openDeleteConfirmation(transaction: FinanceTransaction) {
    setSelectedTransaction(transaction);
    setConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    if (!selectedTransaction) {
      return;
    }

    setDeleting(true);
    try {
      await onDelete(selectedTransaction.id);
      setConfirmOpen(false);
      setSelectedTransaction(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-foreground/65 dark:text-foreground/80">Date</TableHead>
            <TableHead className="text-foreground/65 dark:text-foreground/80">Category</TableHead>
            <TableHead className="text-foreground/65 dark:text-foreground/80">Description</TableHead>
            <TableHead className="text-foreground/65 dark:text-foreground/80">Amount</TableHead>
            <TableHead className="text-foreground/65 dark:text-foreground/80">Status</TableHead>
            <TableHead className="text-right text-foreground/65 dark:text-foreground/80">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((item) => {
            const isStudentFee = item.category === "Student Fee";
            const studentName = item.studentId ? studentsMap.get(item.studentId)?.name : null;
            const isToggling = isTogglingStatus(item.id);
            const showProcessing = isShowingProcessing(item.id);
            const statusError = statusErrorById[item.id];

            return (
              <TableRow key={item.id}>
                <TableCell>{formatDate(item.transactionDate)}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>
                  <p className="font-medium">{item.description}</p>
                  {studentName ? (
                    <p className="text-xs text-muted-foreground">Student: {studentName}</p>
                  ) : null}
                </TableCell>
                <TableCell
                  className={
                    item.type === "income"
                      ? "font-semibold text-emerald-600 dark:text-emerald-400"
                      : "font-semibold text-rose-600 dark:text-rose-400"
                  }
                >
                  {item.type === "income" ? "+" : "-"}
                  {CURRENCY_SYMBOL}
                  {item.amount.toLocaleString("en-IN")}
                </TableCell>
                <TableCell>
                  {isStudentFee ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={item.status === "paid"}
                          disabled={isToggling}
                          onCheckedChange={() => {
                            void handleToggleStatus(item.id);
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              item.status === "paid"
                                ? "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
                                : "border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-500/40 dark:bg-orange-500/15 dark:text-orange-300"
                            }
                            variant="outline"
                          >
                            {item.status === "paid" ? "Paid" : "Pending"}
                          </Badge>
                          {showProcessing ? (
                            <span className="animate-pulse text-xs font-medium text-muted-foreground">
                              Processing...
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {statusError ? (
                        <span className="text-xs font-medium text-destructive">
                          {statusError}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <Badge
                      className="border-border/80 bg-white/60 text-foreground/90 dark:border-white/15 dark:bg-white/[0.06] dark:text-foreground/85"
                      variant="outline"
                    >
                      {item.status === "paid" ? "Paid" : "Pending"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(item)}
                      aria-label="Edit transaction"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => openDeleteConfirmation(item)}
                      aria-label="Delete transaction"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <DeleteConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) {
            setSelectedTransaction(null);
          }
        }}
        title="Delete Transaction?"
        description={
          selectedTransaction
            ? `Are you sure you want to delete this ${selectedTransaction.category.toLowerCase()} transaction?`
            : "Are you sure you want to delete this transaction?"
        }
        itemLabel={
          selectedTransaction
            ? `${selectedTransaction.category} (${CURRENCY_SYMBOL}${selectedTransaction.amount.toLocaleString("en-IN")})`
            : undefined
        }
        deleting={deleting}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
