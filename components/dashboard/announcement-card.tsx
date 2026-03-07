"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, Calendar as CalendarIcon, MessageSquare, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { requestJson } from "@/lib/api-client";
import { parseLocalDate, toLocalDateString } from "@/lib/date";
import { cn } from "@/lib/utils";

// Toast types
type ToastVariant = "success" | "error";

interface ToastState {
  message: string;
  variant: ToastVariant;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string;
  created_at: string;
}

interface AnnouncementCardProps {
  className?: string;
  inverted?: boolean;
}

export function AnnouncementCard({ className, inverted = true }: AnnouncementCardProps) {
  const { role, session } = useAuth();
  const [open, setOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dateError, setDateError] = useState(false);

  // Toast state
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, variant: ToastVariant) => {
    setToast({ message, variant });
  };

  const handleDeleteClick = (id: string, title: string) => {
    setConfirmDelete({ id, title });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;

    try {
      await requestJson(`/api/announcements?id=${confirmDelete.id}`, {
        method: "DELETE",
      }, accessToken);
      showToast("Announcement deleted successfully!", "success");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error:", error);
      showToast(error instanceof Error ? error.message : "Failed to delete", "error");
    }
    setConfirmDelete(null);
  };

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const accessToken = session?.access_token ?? null;

  if (role !== "admin") {
    return null;
  }

  // Fetch announcements when dialog opens
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const result = await requestJson<Announcement[]>("/api/announcements", undefined, accessToken);
      setAnnouncements(result.data || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchAnnouncements();
    }
  }, [accessToken, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if date is selected
    if (!date) {
      setDateError(true);
      return;
    }

    if (!message || !title) return;

    setSubmitting(true);
    setDateError(false);

    try {
      const formattedDate = toLocalDateString(date);

      await requestJson("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          date: formattedDate
        })
      }, accessToken);

      showToast("Announcement created successfully!", "success");
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error("Error:", error);
      showToast(error instanceof Error ? error.message : "Failed to create announcement", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setTitle(announcement.title);
    setMessage(announcement.message);
    setDate(parseLocalDate(announcement.date));
    setEditingId(announcement.id);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if date is selected
    if (!date) {
      setDateError(true);
      return;
    }

    if (!message || !title || !editingId) return;

    setSubmitting(true);
    setDateError(false);

    try {
      const formattedDate = toLocalDateString(date);

      await requestJson("/api/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          title,
          message,
          date: formattedDate
        })
      }, accessToken);

      showToast("Announcement updated successfully!", "success");
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error("Error:", error);
      showToast(error instanceof Error ? error.message : "Failed to update", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setDate(undefined);
    setEditingId(null);
    setDateError(false);
  };

  const Icon = MessageSquare;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="group block h-full w-full text-left">
          <Card
            className={cn(
              "relative h-full min-h-[176px] overflow-hidden border border-border/60 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg dark:border-white/20 dark:bg-slate-900",
              inverted && "text-white",
              className,
            )}
          >
            {/* Gradient background for inverted cards */}
            {inverted && (
              <div className="absolute inset-0 bg-gradient-to-br opacity-90" style={{
                background: 'linear-gradient(to bottom right, #dc2626, #f97316, #ea580c)'
              }} />
            )}
            <CardContent className="relative flex h-full flex-col justify-between gap-4 p-5 md:p-6">
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-105",
                    inverted
                      ? "bg-white/20"
                      : "bg-slate-100 dark:bg-white/10",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <ArrowUpRight
                  className={cn(
                    "h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                    inverted ? "opacity-90" : "text-slate-400",
                  )}
                />
              </div>
              <div>
                <p
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wider",
                    inverted ? "text-white/70" : "text-slate-500 dark:text-slate-400",
                  )}
                >
                  Quick Link
                </p>
                <h3 className="mt-1 text-base font-semibold leading-tight md:text-[1.08rem]">Make Announcement</h3>
                <p className={cn("mt-1.5 text-sm leading-relaxed", inverted ? "text-white/80" : "text-slate-600 dark:text-slate-300")}>
                  Create a new announcement
                </p>
              </div>
            </CardContent>
          </Card>
        </button>
      </DialogTrigger>
      <DialogContent className="isolate max-h-[80vh] overflow-y-auto border border-slate-200 bg-white text-slate-900 shadow-xl sm:max-w-[700px] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Manage Announcements</DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            View, create, edit, or delete announcements for your students.
          </DialogDescription>
        </DialogHeader>

        {/* Announcement List */}
        <div className="mt-4 max-h-[250px] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/50">
          <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">Current Announcements</h4>
          {loading ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading...</p>
          ) : announcements.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">No announcements yet. Create one below!</p>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="flex items-start justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{announcement.title}</p>
                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{announcement.message}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {parseLocalDate(announcement.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="ml-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                    onClick={() => handleEdit(announcement)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                    onClick={() => handleDeleteClick(announcement.id, announcement.title)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Form */}
        <form
          onSubmit={editingId ? handleUpdate : handleSubmit}
          className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
        >
          <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {editingId ? 'Edit Announcement' : 'Add New Announcement'}
          </h4>

          {/* Inline Toast Message */}
          {toast && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                toast.variant === "success"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}
            >
              {toast.variant === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {toast.message}
            </div>
          )}

          {/* Delete Confirmation */}
          {confirmDelete && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Delete "{confirmDelete.title}"?
              </p>
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                This action cannot be undone.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(null)}
                  className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmDelete}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter announcement title..."
                className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
                required
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="message" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Message
              </label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your announcement message..."
                className="min-h-[100px] border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-left text-sm font-normal text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700",
                      !date && "text-slate-500 dark:text-slate-400",
                      dateError && "border-red-500 dark:border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto border border-slate-200 bg-white p-0 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      setDate(selectedDate);
                      setDateError(false);
                      setDatePickerOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
              {dateError && (
                <p className="text-sm text-red-500 dark:text-red-400">Please select a date</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={submitting}>
              {submitting
                ? (editingId ? 'Updating...' : 'Creating...')
                : (editingId ? 'Update Announcement' : 'Add Announcement')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
