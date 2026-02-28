"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import type { Student, StudentBatch, StudentFormInput } from "@/lib/types";

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: StudentFormInput) => Promise<void>;
  initialData?: Student | null;
}

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function StudentFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: StudentFormDialogProps) {
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [batch, setBatch] = React.useState<StudentBatch>("morning");
  const [monthlyFee, setMonthlyFee] = React.useState("3000");
  const [joinDate, setJoinDate] = React.useState(getToday());
  const [teacher, setTeacher] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const isEdit = Boolean(initialData);

  React.useEffect(() => {
    if (!open) return;

    if (initialData) {
      setName(initialData.name);
      setPhone(initialData.phone);
      setBatch(initialData.batch);
      setMonthlyFee(String(initialData.monthlyFee));
      setJoinDate(initialData.joinDate);
      setTeacher(initialData.teacher || "");
      return;
    }

    setName("");
    setPhone("");
    setBatch("morning");
    setMonthlyFee("3000");
    setJoinDate(getToday());
    setTeacher("");
  }, [open, initialData]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericMonthlyFee = Number(monthlyFee);
    if (
      !name.trim() ||
      !phone.trim() ||
      !batch ||
      !joinDate ||
      Number.isNaN(numericMonthlyFee) ||
      numericMonthlyFee < 0
    ) {
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        name: name.trim(),
        phone: phone.trim(),
        batch,
        joinDate,
        status: initialData?.status,
        monthlyFee: numericMonthlyFee,
        teacher: teacher.trim() || undefined,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Student" : "Add Student"}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="student-name">Name</Label>
            <Input
              id="student-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Student name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-phone">Phone</Label>
            <Input
              id="student-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Phone number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-batch">Batch</Label>
            <Select value={batch} onValueChange={(value) => setBatch(value as StudentBatch)}>
              <SelectTrigger id="student-batch">
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning Session</SelectItem>
                <SelectItem value="evening">Evening Session</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-monthly-fee">Monthly Fee</Label>
            <Input
              id="student-monthly-fee"
              type="number"
              min="0"
              step="1"
              value={monthlyFee}
              onChange={(event) => setMonthlyFee(event.target.value)}
              placeholder="3000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-join-date">Join Date</Label>
            <Input
              id="student-join-date"
              type="date"
              value={joinDate}
              onChange={(event) => setJoinDate(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-teacher">Teacher</Label>
            <Input
              id="student-teacher"
              value={teacher}
              onChange={(event) => setTeacher(event.target.value)}
              placeholder="Assign a teacher (optional)"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Update Student" : "Add Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
