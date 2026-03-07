"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { parseLocalDate, toLocalDateString } from "@/lib/date";
import type { TaskFormInput, TaskItem, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: TaskFormInput) => Promise<void>;
  initialData?: TaskItem | null;
  defaultDate?: string;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData = null,
  defaultDate,
}: TaskFormDialogProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [eventDate, setEventDate] = React.useState<Date | undefined>(undefined);
  const [status, setStatus] = React.useState<TaskStatus>("pending");
  const [submitting, setSubmitting] = React.useState(false);
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description ?? "");
      setEventDate(parseLocalDate(initialData.eventDate));
      setStatus(initialData.status);
      setError(null);
      return;
    }

    setTitle("");
    setDescription("");
    setEventDate(defaultDate ? parseLocalDate(defaultDate) : new Date());
    setStatus("pending");
    setError(null);
  }, [defaultDate, initialData, open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    if (!eventDate) {
      setError("Task date is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        eventDate: toLocalDateString(eventDate),
        status,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save task.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Task" : "Add Task"}</DialogTitle>
          <DialogDescription>
            Create calendar tasks for the owner and keep the task board aligned with announcements.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Follow up on fee reminders"
              disabled={submitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add context or next steps for this day."
              className="min-h-[120px]"
              disabled={submitting}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Task Date</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !eventDate && "text-muted-foreground",
                    )}
                    disabled={submitting}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {eventDate
                      ? eventDate.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={eventDate}
                    onSelect={(nextDate) => {
                      setEventDate(nextDate);
                      if (nextDate) {
                        setDatePickerOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as TaskStatus)}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (initialData ? "Saving..." : "Creating...") : initialData ? "Save Task" : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
