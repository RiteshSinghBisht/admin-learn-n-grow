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
import { Textarea } from "@/components/ui/textarea";
import { parseLocalDate, toLocalDateString } from "@/lib/date";
import type { AnnouncementItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface AnnouncementFormInput {
    title: string;
    message: string;
    date: string;
}

interface AnnouncementFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (input: AnnouncementFormInput) => Promise<void>;
    initialData?: AnnouncementItem | null;
    defaultDate?: string;
}

export function AnnouncementFormDialog({
    open,
    onOpenChange,
    onSubmit,
    initialData = null,
    defaultDate,
}: AnnouncementFormDialogProps) {
    const [title, setTitle] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [eventDate, setEventDate] = React.useState<Date | undefined>(undefined);
    const [submitting, setSubmitting] = React.useState(false);
    const [datePickerOpen, setDatePickerOpen] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        if (initialData) {
            setTitle(initialData.title);
            setMessage(initialData.message ?? "");
            setEventDate(parseLocalDate(initialData.date));
            setError(null);
            return;
        }

        setTitle("");
        setMessage("");
        setEventDate(defaultDate ? parseLocalDate(defaultDate) : new Date());
        setError(null);
    }, [defaultDate, initialData, open]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!title.trim()) {
            setError("Announcement title is required.");
            return;
        }

        if (!message.trim()) {
            setError("Announcement message is required.");
            return;
        }

        if (!eventDate) {
            setError("Announcement date is required.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await onSubmit({
                title: title.trim(),
                message: message.trim(),
                date: toLocalDateString(eventDate),
            });
            onOpenChange(false);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Failed to save announcement.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Announcement" : "Create Announcement"}</DialogTitle>
                    <DialogDescription>
                        Broadcast an announcement to keep everyone informed.
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="grid gap-2">
                        <Label htmlFor="announcement-title">Title</Label>
                        <Input
                            id="announcement-title"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="System Maintenance Notice"
                            disabled={submitting}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="announcement-message">Message</Label>
                        <Textarea
                            id="announcement-message"
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            placeholder="Add details about this announcement..."
                            className="min-h-[120px]"
                            disabled={submitting}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Date</Label>
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
                            {submitting ? (initialData ? "Saving..." : "Creating...") : initialData ? "Save Announcement" : "Create Announcement"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
