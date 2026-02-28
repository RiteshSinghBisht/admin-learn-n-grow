"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FINANCE_CATEGORIES } from "@/lib/constants";
import type {
  FinanceTransaction,
  PaymentStatus,
  Student,
  TransactionFormInput,
} from "@/lib/types";

interface QuickAddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  onSubmit: (input: TransactionFormInput) => Promise<void>;
  initialData?: FinanceTransaction | null;
}

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const defaultCategory = "Student Fee";

function toFriendlyErrorMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unable to save transaction.";

  const isNetworkFailure =
    message.toLowerCase().includes("fetch failed") ||
    message.toLowerCase().includes("load failed") ||
    message.toLowerCase().includes("failed to fetch") ||
    message.toLowerCase().includes("networkerror");

  if (isNetworkFailure) {
    return "Could not connect to Supabase. Check project URL/key and network access, then try again.";
  }

  return message;
}

export function QuickAddTransactionDialog({
  open,
  onOpenChange,
  students,
  onSubmit,
  initialData,
}: QuickAddTransactionDialogProps) {
  const [category, setCategory] = React.useState(defaultCategory);
  const [amount, setAmount] = React.useState("0");
  const [transactionDate, setTransactionDate] = React.useState(getToday());
  const [note, setNote] = React.useState("");
  const [studentId, setStudentId] = React.useState<string>("");
  const [status, setStatus] = React.useState<PaymentStatus>("paid");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const isEdit = Boolean(initialData);
  const isStudentFee = category === "Student Fee";

  React.useEffect(() => {
    if (!open) return;

    if (initialData) {
      setCategory(initialData.category);
      setAmount(String(initialData.amount));
      setTransactionDate(initialData.transactionDate);
      setNote(initialData.description || initialData.note || "");
      setStudentId(initialData.studentId ?? "");
      setStatus(initialData.status);
      setSubmitError(null);
      return;
    }

    setCategory(defaultCategory);
    setAmount("0");
    setTransactionDate(getToday());
    setNote("");
    setStudentId("");
    setStatus("paid");
    setSubmitError(null);
  }, [open, initialData]);

  function handleCategoryChange(value: string) {
    setCategory(value);

    if (value === "Student Fee") {
      setStatus((current) => current ?? "paid");
    } else {
      setStatus("paid");
      setStudentId("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericAmount = Number(amount);
    if (!category || Number.isNaN(numericAmount) || numericAmount <= 0 || !transactionDate) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload: TransactionFormInput = {
        transactionDate,
        category,
        type: isStudentFee ? "income" : "expense",
        amount: numericAmount,
        status: isStudentFee ? status : "paid",
        description: note.trim() || `${category} transaction`,
        note: note.trim() || undefined,
        studentId: isStudentFee ? studentId || null : null,
      };

      await onSubmit(payload);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(toFriendlyErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Transaction" : "Quick Add Transaction"}</DialogTitle>
          <DialogDescription>
            Add a new transaction with smart category logic.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {FINANCE_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionDate">Date</Label>
              <Input
                id="transactionDate"
                type="date"
                value={transactionDate}
                onChange={(event) => setTransactionDate(event.target.value)}
                required
              />
            </div>
          </div>

          {isStudentFee ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Select Student</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex h-10 items-center justify-between rounded-md border px-3">
                  <span className="text-sm text-muted-foreground">
                    {status === "paid" ? "Paid" : "Pending"}
                  </span>
                  <Switch
                    checked={status === "paid"}
                    onCheckedChange={(checked) => setStatus(checked ? "paid" : "pending")}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Input
              id="note"
              placeholder="Optional transaction note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          {submitError ? (
            <p className="text-sm font-medium text-destructive">{submitError}</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Update" : "Add Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
