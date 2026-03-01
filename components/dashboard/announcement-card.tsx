"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, Calendar as CalendarIcon, MessageSquare, Edit, Trash2 } from "lucide-react";

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
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dateError, setDateError] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch announcements when dialog opens
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/announcements');
      const result = await response.json();
      if (result.success) {
        setAnnouncements(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchAnnouncements();
    }
  }, [open]);

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
      const formattedDate = date.toISOString().split("T")[0];

      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          date: formattedDate
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Announcement created successfully!');
        resetForm();
        fetchAnnouncements();
      } else {
        alert('Failed: ' + result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const response = await fetch(`/api/announcements?id=${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (result.success) {
        fetchAnnouncements();
      } else {
        alert('Failed to delete: ' + result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to delete');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setTitle(announcement.title);
    setMessage(announcement.message);
    setDate(new Date(announcement.date));
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
      const formattedDate = date.toISOString().split("T")[0];

      // Delete old and create new (since we don't have update endpoint)
      await fetch(`/api/announcements?id=${editingId}`, { method: 'DELETE' });

      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          date: formattedDate
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Announcement updated successfully!');
        resetForm();
        fetchAnnouncements();
      } else {
        alert('Failed: ' + result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update');
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
                    {new Date(announcement.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                    onClick={() => handleDelete(announcement.id)}
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
