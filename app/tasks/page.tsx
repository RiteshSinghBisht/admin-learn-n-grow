"use client";

import * as React from "react";
import {
  BookOpen,
  CalendarDays,
  Calendar as CalendarIcon,
  CheckCheck,
  CheckCircle2,
  Clock3,
  ListTodo,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
  FileText,
} from "lucide-react";
import { format, formatDistanceToNowStrict, isToday, parseISO, startOfDay } from "date-fns";

import { useAppData } from "@/components/providers/app-data-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { AnnouncementFormDialog, type AnnouncementFormInput } from "@/components/tasks/announcement-form-dialog";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { requestJson } from "@/lib/api-client";
import { parseLocalDate, toLocalDateString } from "@/lib/date";
import type { AnnouncementItem, TaskFormInput, TaskItem, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskRow {
  id: string | number;
  title: string;
  description: string | null;
  event_date: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  owner_user_id?: string | null;
}

interface AnnouncementRow {
  id: string | number;
  title: string;
  message: string;
  date: string;
  created_at: string;
}

type TaskStage = "completed" | "inProgress" | "notStarted";
type OpenBoardTone = "announcement" | "inProgress" | "notStarted";

interface OpenBoardItem {
  id: string;
  source: "task" | "announcement";
  title: string;
  description: string;
  eventDate: string;
  createdAt: string;
  statusLabel: string;
  priorityLabel: string;
  tone: OpenBoardTone;
  task?: TaskItem;
  announcement?: AnnouncementItem;
}

interface CalendarAgendaItem {
  id: string;
  source: "task" | "announcement";
  title: string;
  description: string;
  statusLabel: string;
  badgeClassName: string;
  accent: string;
  task?: TaskItem;
  announcement?: AnnouncementItem;
}

const toneStyles: Record<
  TaskStage | OpenBoardTone,
  {
    accent: string;
    badgeClassName: string;
    thumbnailClassName: string;
    thumbnailBadgeClassName: string;
    thumbnailMetaClassName: string;
    thumbnailDateClassName: string;
    thumbnailText: string;
  }
> = {
  completed: {
    accent: "#05A301",
    badgeClassName: "bg-[#ecffef] text-[#05A301]",
    thumbnailClassName:
      "bg-[linear-gradient(145deg,#e7ffe9_0%,#88d79f_55%,#05A301_100%)] text-[#064e3b]",
    thumbnailBadgeClassName: "bg-white/35 text-[#166534]",
    thumbnailMetaClassName: "text-[#166534]",
    thumbnailDateClassName: "text-[#064e3b]",
    thumbnailText: "Done",
  },
  inProgress: {
    accent: "#EAB308",
    badgeClassName: "bg-[#fff8d9] text-[#a16207]",
    thumbnailClassName:
      "bg-[linear-gradient(145deg,#fff8d9_0%,#f9dd74_52%,#EAB308_100%)] text-[#6b4f00]",
    thumbnailBadgeClassName: "bg-white/35 text-[#6b4f00]",
    thumbnailMetaClassName: "text-[#8a6500]",
    thumbnailDateClassName: "text-[#5a4300]",
    thumbnailText: "Focus",
  },
  notStarted: {
    accent: "#F21E1E",
    badgeClassName: "bg-[#fff0f0] text-[#F21E1E]",
    thumbnailClassName:
      "bg-[linear-gradient(145deg,#ffe7e7_0%,#ff9f9f_52%,#F21E1E_100%)] text-[#7f1d1d]",
    thumbnailBadgeClassName: "bg-white/35 text-[#b91c1c]",
    thumbnailMetaClassName: "text-[#b91c1c]",
    thumbnailDateClassName: "text-[#7f1d1d]",
    thumbnailText: "Plan",
  },
  announcement: {
    accent: "#38BDF8",
    badgeClassName: "bg-[#e0f2fe] text-[#0369a1]",
    thumbnailClassName:
      "bg-[linear-gradient(145deg,#e0f2fe_0%,#7dd3fc_52%,#38BDF8_100%)] text-[#0c4a6e]",
    thumbnailBadgeClassName: "bg-white/35 text-[#075985]",
    thumbnailMetaClassName: "text-[#0369a1]",
    thumbnailDateClassName: "text-[#0c4a6e]",
    thumbnailText: "News",
  },
};

function mapTaskRow(row: TaskRow): TaskItem {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description ?? undefined,
    eventDate: row.event_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ownerUserId: row.owner_user_id ?? undefined,
  };
}

function mapAnnouncementRow(row: AnnouncementRow): AnnouncementItem {
  return {
    id: String(row.id),
    title: row.title,
    message: row.message,
    date: row.date,
    createdAt: row.created_at,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === "string" ? error : "Something went wrong.";
}

function getSafeDate(value: string) {
  const parsed = parseISO(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const fallback = new Date(value);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback;
  }

  return new Date();
}

function truncateText(value: string, limit: number) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 1).trimEnd()}…`;
}

function getTaskStage(task: TaskItem): TaskStage {
  if (task.status === "completed") {
    return "completed";
  }

  if (task.status === "in_progress") {
    return "inProgress";
  }

  return "notStarted";
}

function formatTaskStatusLabel(status: TaskStatus) {
  if (status === "completed") {
    return "Completed";
  }

  if (status === "in_progress") {
    return "In Progress";
  }

  return "Pending";
}

function formatCreatedOn(value: string) {
  return format(getSafeDate(value), "dd/MM/yyyy");
}

function formatCompletedAgo(value: string) {
  return formatDistanceToNowStrict(getSafeDate(value), { addSuffix: true });
}

function formatTaskDateLabel(value: string) {
  const date = parseLocalDate(value);
  if (isToday(date)) {
    return "Today";
  }

  return format(date, "dd MMM");
}

function getMonthKeyFromDate(date: Date) {
  return format(date, "yyyy-MM");
}

function getMonthKeyFromDateString(value: string) {
  return format(parseLocalDate(value), "yyyy-MM");
}

function formatMonthOptionLabel(monthKey: string) {
  return format(parseLocalDate(`${monthKey}-01`), "MMMM yyyy");
}

function ProgressRing({
  label,
  count,
  percentage,
  color,
}: {
  label: string;
  count: number;
  percentage: number;
  color: string;
}) {
  const degrees = Math.max(percentage, count > 0 ? 4 : 0) * 3.6;

  return (
    <div className="flex min-w-[110px] flex-col items-center text-center">
      <div
        className="grid h-[76px] w-[76px] place-items-center rounded-full shadow-sm"
        style={{
          background:
            degrees === 0
              ? "#D9D9D9"
              : `conic-gradient(${color} 0deg ${degrees}deg, #D9D9D9 ${degrees}deg 360deg)`,
        }}
      >
        <div className="grid h-[54px] w-[54px] place-items-center rounded-full bg-white text-[16px] font-semibold tracking-tight text-black dark:bg-slate-900 dark:text-white">
          {percentage}%
        </div>
      </div>

      <div className="mt-3 flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[14px] font-medium text-black dark:text-white">{label}</span>
        </div>
        <p className="text-[11px] text-[#747474] dark:text-slate-300">
          {count} task{count === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}

function BoardPreview({
  item,
  onEdit,
  onToggleStatus,
  onDelete,
  onClick,
  onAnnouncementClick,
}: {
  item: OpenBoardItem;
  onEdit: (task: TaskItem) => void;
  onToggleStatus: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
  onClick?: (task: TaskItem) => void;
  onAnnouncementClick?: (announcement: AnnouncementItem) => void;
}) {
  const style = toneStyles[item.tone];
  const isClickable = (onClick && item.task) || (onAnnouncementClick && item.source === "announcement");

  return (
    <article
      className={cn(
        "rounded-[14px] border border-[#A1A3AB] bg-white px-[14px] py-[12px] transition-all dark:border-white/15 dark:bg-slate-950/70",
        isClickable && "cursor-pointer hover:border-[#FF6767] hover:shadow-md"
      )}
      onClick={() => {
        if (item.task && onClick) {
          onClick(item.task);
        } else if (item.source === "announcement" && item.announcement && onAnnouncementClick) {
          onAnnouncementClick(item.announcement);
        }
      }}
    >
      <div className="flex gap-4">
        <div className="pt-1">
          <span
            className="block h-3 w-3 rounded-full border-2"
            style={{ borderColor: style.accent }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate pr-2 text-[16px] font-semibold leading-[19px] text-black dark:text-white">
                {item.title}
              </h3>
            </div>

            {item.source === "task" && item.task ? (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-[#A1A3AB] hover:bg-black/[0.04] hover:text-black dark:hover:bg-white/5 dark:hover:text-white"
                  onClick={(e) => { e.stopPropagation(); onEdit(item.task!); }}
                  aria-label={`Edit ${item.title}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-[#A1A3AB] hover:bg-black/[0.04] hover:text-black dark:hover:bg-white/5 dark:hover:text-white"
                  onClick={(e) => { e.stopPropagation(); onToggleStatus(item.task!); }}
                  aria-label={`Complete ${item.title}`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-[#A1A3AB] hover:bg-black/[0.04] hover:text-black dark:hover:bg-white/5 dark:hover:text-white"
                  onClick={(e) => { e.stopPropagation(); onDelete(item.task!); }}
                  aria-label={`Delete ${item.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-[#A1A3AB] dark:text-slate-300">
                <MoreHorizontal className="h-4 w-4" />
              </div>
            )}
          </div>

          <p className="mt-3 text-[14px] leading-[17px] text-[#747474] dark:text-slate-300">
            {truncateText(item.description || "No description added yet.", 92)}
          </p>

          <div className="mt-6 flex flex-wrap gap-x-3 gap-y-1 text-[10px] leading-3 text-black dark:text-white">
            <span>Priority: {item.priorityLabel}</span>
            <span>Status: {item.statusLabel}</span>
            <span className="text-[#A1A3AB] dark:text-slate-300">
              Created on: {formatCreatedOn(item.createdAt)}
            </span>
          </div>
        </div>

        <div
          className={cn(
            "hidden h-[88px] w-[88px] shrink-0 rounded-[14px] p-3 shadow-[0_18px_24px_-22px_rgba(0,0,0,0.55)] md:flex md:flex-col md:justify-between",
            style.thumbnailClassName,
          )}
        >
          <div className="flex justify-end">
            <span
              className={cn(
                "rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em]",
                style.thumbnailBadgeClassName,
              )}
            >
              {style.thumbnailText}
            </span>
          </div>
          <div>
            <p
              className={cn(
                "text-[10px] font-medium uppercase tracking-[0.18em]",
                style.thumbnailMetaClassName,
              )}
            >
              {formatTaskDateLabel(item.eventDate)}
            </p>
            <p className={cn("mt-1 text-sm font-semibold leading-4", style.thumbnailDateClassName)}>
              {format(parseLocalDate(item.eventDate), "dd MMM")}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function CompletedPreview({
  task,
  onEdit,
  onToggleStatus,
  onDelete,
  onClick,
}: {
  task: TaskItem;
  onEdit: (task: TaskItem) => void;
  onToggleStatus: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
  onClick?: (task: TaskItem) => void;
}) {
  const style = toneStyles.completed;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[14px] border border-[#A1A3AB] bg-white px-3.5 py-3 transition-all dark:border-white/15 dark:bg-slate-950/70",
        onClick && "cursor-pointer hover:border-[#FF6767] hover:shadow-md"
      )}
      onClick={() => {
        if (onClick) {
          onClick(task);
        }
      }}
    >
      <div className="flex gap-3">
        <div className="pt-1">
          <span
            className="block h-3 w-3 rounded-full border-2"
            style={{ borderColor: style.accent }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate pr-2 text-[15px] font-semibold leading-[18px] text-black dark:text-white">
                {task.title}
              </h3>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-[#A1A3AB] hover:bg-black/[0.04] hover:text-black dark:hover:bg-white/5 dark:hover:text-white"
                onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                aria-label={`Edit ${task.title}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-[#A1A3AB] hover:bg-black/[0.04] hover:text-black dark:hover:bg-white/5 dark:hover:text-white"
                onClick={(e) => { e.stopPropagation(); onToggleStatus(task); }}
                aria-label={`Reopen ${task.title}`}
              >
                <Clock3 className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-[#A1A3AB] hover:bg-black/[0.04] hover:text-black dark:hover:bg-white/5 dark:hover:text-white"
                onClick={(e) => { e.stopPropagation(); onDelete(task); }}
                aria-label={`Delete ${task.title}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <p className="mt-2 text-[12px] leading-[15px] text-[#747474] dark:text-slate-300">
            {truncateText(task.description?.trim() || "No description added yet.", 62)}
          </p>

          <div className="mt-3 space-y-1 text-[10px] leading-3">
            <p className="text-black dark:text-white">Status: Completed</p>
            <p className="font-medium text-[#747474] dark:text-slate-300">
              Completed {formatCompletedAgo(task.updatedAt)}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "hidden h-[72px] w-[72px] shrink-0 rounded-[14px] p-2.5 shadow-[0_18px_24px_-22px_rgba(0,0,0,0.55)] xl:flex xl:flex-col xl:justify-between",
            style.thumbnailClassName,
          )}
        >
          <div className="flex justify-end">
            <span
              className={cn(
                "rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em]",
                style.thumbnailBadgeClassName,
              )}
            >
              {style.thumbnailText}
            </span>
          </div>
          <div>
            <p
              className={cn(
                "text-[10px] font-medium uppercase tracking-[0.18em]",
                style.thumbnailMetaClassName,
              )}
            >
              {formatTaskDateLabel(task.eventDate)}
            </p>
            <p className={cn("mt-1 text-xs font-semibold leading-4", style.thumbnailDateClassName)}>
              {format(parseLocalDate(task.eventDate), "dd MMM")}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function ExpandedTaskView({
  task,
  onClose,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  task: TaskItem;
  onClose: () => void;
  onEdit: (task: TaskItem) => void;
  onToggleStatus: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
}) {
  const style = task.status === "completed" ? toneStyles.completed : toneStyles[task.status === "in_progress" ? "inProgress" : "notStarted"];

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg border border-slate-300 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:border-white/20 dark:bg-slate-950 [&>button]:hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="block h-4 w-4 rounded-full border-2"
              style={{ borderColor: style.accent }}
            />
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider", style.badgeClassName)}>
              {task.status === "completed" ? "Completed" : task.status === "in_progress" ? "In Progress" : "Pending"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-slate-300 bg-white/50 text-slate-700 shadow-sm backdrop-blur-sm hover:bg-black/[0.08] hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => onEdit(task)}
              aria-label={`Edit ${task.title}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-slate-300 bg-white/50 text-slate-700 shadow-sm backdrop-blur-sm hover:bg-black/[0.08] hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => onToggleStatus(task)}
              aria-label={task.status === "completed" ? `Reopen ${task.title}` : `Complete ${task.title}`}
            >
              {task.status === "completed" ? <Clock3 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-slate-300 bg-white/50 text-slate-700 shadow-sm backdrop-blur-sm hover:bg-black/[0.08] hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => onDelete(task)}
              aria-label={`Delete ${task.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-slate-300 bg-white/50 text-slate-700 shadow-sm backdrop-blur-sm hover:bg-black/[0.08] hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DialogTitle className="mt-6 text-2xl font-semibold leading-tight text-black dark:text-white">
          {task.title}
        </DialogTitle>

        {task.description && (
          <div className="mt-4 flex gap-2">
            <FileText className="h-5 w-5 shrink-0 text-[#A1A3AB] dark:text-slate-300" />
            <p className="text-[15px] leading-relaxed text-[#555] dark:text-slate-300">
              {task.description}
            </p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg bg-[#F5F8FF] p-4 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-[#A1A3AB] dark:text-slate-300" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#A1A3AB] dark:text-slate-300">Task Date</p>
              <p className="mt-1 text-sm font-semibold text-black dark:text-white">
                {format(parseLocalDate(task.eventDate), "EEEE, dd MMMM yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-[#A1A3AB] dark:text-slate-300" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#A1A3AB] dark:text-slate-300">Created</p>
              <p className="mt-1 text-sm font-semibold text-black dark:text-white">
                {formatCreatedOn(task.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {task.status === "completed" && (
          <div className="mt-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Completed {formatCompletedAgo(task.updatedAt)}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ExpandedAnnouncementView({
  announcement,
  onClose,
  onEdit,
  onDelete,
}: {
  announcement: AnnouncementItem;
  onClose: () => void;
  onEdit?: (a: AnnouncementItem) => void;
  onDelete?: (a: AnnouncementItem) => void;
}) {
  const style = toneStyles.announcement;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg border border-slate-300 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:border-white/20 dark:bg-slate-950 [&>button]:hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="block h-4 w-4 rounded-full border-2" style={{ borderColor: style.accent }} />
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider", style.badgeClassName)}>
              Announcement
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-slate-300 bg-white/50 text-slate-700 shadow-sm backdrop-blur-sm hover:bg-black/[0.08] hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                onClick={() => onEdit(announcement)}
                aria-label={`Edit ${announcement.title}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-slate-300 bg-white/50 text-slate-700 shadow-sm backdrop-blur-sm hover:bg-black/[0.08] hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                onClick={() => onDelete(announcement)}
                aria-label={`Delete ${announcement.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-slate-300 bg-white/50 text-slate-700 shadow-sm backdrop-blur-sm hover:bg-black/[0.08] hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <DialogTitle className="mt-6 text-2xl font-semibold leading-tight text-black dark:text-white">
          {announcement.title}
        </DialogTitle>
        <div className="mt-4 flex gap-2">
          <FileText className="h-5 w-5 shrink-0 text-[#A1A3AB]" />
          <p className="text-[15px] leading-relaxed text-[#555] dark:text-slate-300">{announcement.message}</p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg bg-[#F5F8FF] p-4 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-[#A1A3AB]" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#A1A3AB]">Date</p>
              <p className="mt-1 text-sm font-semibold text-black dark:text-white">{format(parseLocalDate(announcement.date), "EEEE, dd MMMM yyyy")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-[#A1A3AB]" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#A1A3AB]">Created</p>
              <p className="mt-1 text-sm font-semibold text-black dark:text-white">{formatCreatedOn(announcement.createdAt)}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TasksPage() {
  useAppData();
  const { role, session } = useAuth();
  const [tasks, setTasks] = React.useState<TaskItem[]>([]);
  const [announcements, setAnnouncements] = React.useState<AnnouncementItem[]>([]);
  const [selectedDate, setSelectedDate] = React.useState(() => new Date());
  const [visibleMonth, setVisibleMonth] = React.useState(() => new Date());
  const [monthFilter, setMonthFilter] = React.useState("all");
  const [loading, setLoading] = React.useState(true);
  const [loadErrors, setLoadErrors] = React.useState<string[]>([]);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<TaskItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<TaskItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const [announcementDialogOpen, setAnnouncementDialogOpen] = React.useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = React.useState<AnnouncementItem | null>(null);
  const [deleteAnnouncementTarget, setDeleteAnnouncementTarget] = React.useState<AnnouncementItem | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = React.useState(false);

  const [expandedTask, setExpandedTask] = React.useState<TaskItem | null>(null);
  const [expandedAnnouncement, setExpandedAnnouncement] = React.useState<AnnouncementItem | null>(null);
  const todayStart = React.useMemo(() => startOfDay(new Date()), []);
  const todayKey = React.useMemo(() => toLocalDateString(todayStart), [todayStart]);
  const selectedDateKey = React.useMemo(() => toLocalDateString(selectedDate), [selectedDate]);
  const visibleMonthKey = React.useMemo(() => getMonthKeyFromDate(visibleMonth), [visibleMonth]);
  const accessToken = session?.access_token ?? null;
  const isAdmin = role === "admin";

  const loadBoardData = React.useCallback(async () => {
    setLoading(true);
    setActionError(null);

    const [taskResult, announcementResult] = await Promise.allSettled([
      requestJson<TaskRow[]>("/api/tasks", undefined, accessToken),
      requestJson<AnnouncementRow[]>("/api/announcements", undefined, accessToken),
    ]);

    const nextErrors: string[] = [];

    if (taskResult.status === "fulfilled") {
      setTasks((taskResult.value.data ?? []).map(mapTaskRow));
    } else {
      setTasks([]);
      nextErrors.push(`Tasks: ${getErrorMessage(taskResult.reason)}`);
    }

    if (announcementResult.status === "fulfilled") {
      setAnnouncements((announcementResult.value.data ?? []).map(mapAnnouncementRow));
    } else {
      setAnnouncements([]);
      nextErrors.push(`Announcements: ${getErrorMessage(announcementResult.reason)}`);
    }

    setLoadErrors(nextErrors);
    setLoading(false);
  }, [accessToken]);

  React.useEffect(() => {
    void loadBoardData();
  }, [loadBoardData]);

  const monthOptions = React.useMemo(() => {
    const monthKeys = new Set<string>([
      getMonthKeyFromDate(todayStart),
      visibleMonthKey,
    ]);

    tasks.forEach((task) => monthKeys.add(getMonthKeyFromDateString(task.eventDate)));
    announcements.forEach((announcement) => monthKeys.add(getMonthKeyFromDateString(announcement.date)));

    if (monthFilter !== "all") {
      monthKeys.add(monthFilter);
    }

    return Array.from(monthKeys)
      .sort((left, right) => right.localeCompare(left))
      .map((value) => ({
        value,
        label: formatMonthOptionLabel(value),
      }));
  }, [announcements, monthFilter, tasks, todayStart, visibleMonthKey]);

  const filteredTasks = React.useMemo(
    () =>
      monthFilter === "all"
        ? tasks
        : tasks.filter((task) => getMonthKeyFromDateString(task.eventDate) === monthFilter),
    [monthFilter, tasks],
  );

  const filteredAnnouncements = React.useMemo(
    () =>
      monthFilter === "all"
        ? announcements
        : announcements.filter(
            (announcement) => getMonthKeyFromDateString(announcement.date) === monthFilter,
          ),
    [announcements, monthFilter],
  );

  React.useEffect(() => {
    if (monthFilter === "all") {
      return;
    }

    const nextMonth = parseLocalDate(`${monthFilter}-01`);
    if (visibleMonthKey !== monthFilter) {
      setVisibleMonth(nextMonth);
    }

    if (selectedDateKey.slice(0, 7) === monthFilter) {
      return;
    }

    const firstRelevantDate =
      [
        ...tasks.map((task) => task.eventDate),
        ...announcements.map((announcement) => announcement.date),
      ]
        .filter((value) => getMonthKeyFromDateString(value) === monthFilter)
        .sort()[0] ?? `${monthFilter}-01`;

    setSelectedDate(parseLocalDate(firstRelevantDate));
  }, [announcements, monthFilter, selectedDateKey, tasks, visibleMonthKey]);

  const completedTasks = React.useMemo(
    () =>
      [...filteredTasks.filter((task) => task.status === "completed")].sort(
        (left, right) => getSafeDate(right.updatedAt).getTime() - getSafeDate(left.updatedAt).getTime(),
      ),
    [filteredTasks],
  );

  const inProgressTasks = React.useMemo(
    () => filteredTasks.filter((task) => task.status === "in_progress"),
    [filteredTasks],
  );

  const notStartedTasks = React.useMemo(
    () => filteredTasks.filter((task) => task.status === "pending"),
    [filteredTasks],
  );

  const openBoardItems = React.useMemo<OpenBoardItem[]>(() => {
    const openTasks = filteredTasks
      .filter((task) => task.status !== "completed")
      .map((task) => {
        const stage = getTaskStage(task);
        const tone: OpenBoardTone = stage === "inProgress" ? "inProgress" : "notStarted";
        return {
          id: task.id,
          source: "task" as const,
          title: task.title,
          description: task.description?.trim() || "No extra notes added for this task yet.",
          eventDate: task.eventDate,
          createdAt: task.createdAt,
          statusLabel: formatTaskStatusLabel(task.status),
          priorityLabel: "Moderate",
          tone,
          task,
        };
      });

    const announcementItems = filteredAnnouncements.map((announcement) => ({
      id: announcement.id,
      source: "announcement" as const,
      title: announcement.title,
      description: announcement.message.trim() || "Announcement details are not available.",
      eventDate: announcement.date,
      createdAt: announcement.createdAt,
      statusLabel: "Announcement",
      priorityLabel: "Important",
      tone: "announcement" as const,
      announcement,
    }));

    return [...openTasks, ...announcementItems].sort((left, right) => {
      const leftRank =
        left.source === "announcement" ? 2 : left.tone === "inProgress" ? 0 : 1;
      const rightRank =
        right.source === "announcement" ? 2 : right.tone === "inProgress" ? 0 : 1;

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      if (left.eventDate !== right.eventDate) {
        return left.eventDate.localeCompare(right.eventDate);
      }

      return getSafeDate(right.createdAt).getTime() - getSafeDate(left.createdAt).getTime();
    });
  }, [filteredAnnouncements, filteredTasks]);

  const taskDates = React.useMemo(() => {
    const unique = new Set<string>();
    filteredTasks.forEach((task) => unique.add(task.eventDate));
    return Array.from(unique).map(parseLocalDate);
  }, [filteredTasks]);

  const announcementDates = React.useMemo(() => {
    const unique = new Set<string>();
    filteredAnnouncements.forEach((announcement) => unique.add(announcement.date));
    return Array.from(unique).map(parseLocalDate);
  }, [filteredAnnouncements]);

  const selectedDateItemsCount = React.useMemo(
    () =>
      filteredTasks.filter((task) => task.eventDate === selectedDateKey).length +
      filteredAnnouncements.filter((announcement) => announcement.date === selectedDateKey).length,
    [filteredAnnouncements, filteredTasks, selectedDateKey],
  );

  const selectedDateTaskCount = React.useMemo(
    () => filteredTasks.filter((task) => task.eventDate === selectedDateKey).length,
    [filteredTasks, selectedDateKey],
  );

  const selectedDateAnnouncementCount = React.useMemo(
    () => filteredAnnouncements.filter((announcement) => announcement.date === selectedDateKey).length,
    [filteredAnnouncements, selectedDateKey],
  );

  const selectedDateAgenda = React.useMemo<CalendarAgendaItem[]>(() => {
    const statusOrder: Record<TaskStatus, number> = {
      in_progress: 0,
      pending: 1,
      completed: 2,
    };

    const taskItems = filteredTasks
      .filter((task) => task.eventDate === selectedDateKey)
      .sort((left, right) => {
        const rankDelta = statusOrder[left.status] - statusOrder[right.status];
        if (rankDelta !== 0) {
          return rankDelta;
        }

        return getSafeDate(right.updatedAt).getTime() - getSafeDate(left.updatedAt).getTime();
      })
      .map((task) => {
        const stage = getTaskStage(task);
        const tone = toneStyles[stage];

        return {
          id: `task-${task.id}`,
          source: "task" as const,
          title: task.title,
          description: task.description?.trim() || "No description added yet.",
          statusLabel: formatTaskStatusLabel(task.status),
          badgeClassName: tone.badgeClassName,
          accent: tone.accent,
          task,
        };
      });

    const announcementItems = filteredAnnouncements
      .filter((announcement) => announcement.date === selectedDateKey)
      .sort(
        (left, right) =>
          getSafeDate(right.createdAt).getTime() - getSafeDate(left.createdAt).getTime(),
      )
      .map((announcement) => ({
        id: `announcement-${announcement.id}`,
        source: "announcement" as const,
        title: announcement.title,
        description: announcement.message.trim() || "Announcement details are not available.",
        statusLabel: "Announcement",
        badgeClassName: toneStyles.announcement.badgeClassName,
        accent: toneStyles.announcement.accent,
        announcement,
      }));

    return [...taskItems, ...announcementItems];
  }, [filteredAnnouncements, filteredTasks, selectedDateKey]);

  const totalTasks = filteredTasks.length;
  const statusBuckets = React.useMemo(
    () => [
      {
        label: "Completed",
        count: completedTasks.length,
        percentage: totalTasks ? Math.round((completedTasks.length / totalTasks) * 100) : 0,
        color: "#05A301",
      },
      {
        label: "In Progress",
        count: inProgressTasks.length,
        percentage: totalTasks ? Math.round((inProgressTasks.length / totalTasks) * 100) : 0,
        color: "#EAB308",
      },
      {
        label: "Pending",
        count: notStartedTasks.length,
        percentage: totalTasks ? Math.round((notStartedTasks.length / totalTasks) * 100) : 0,
        color: "#F21E1E",
      },
    ],
    [completedTasks.length, inProgressTasks.length, notStartedTasks.length, totalTasks],
  );

  function handleJumpToToday() {
    const today = new Date();
    setSelectedDate(today);
    setVisibleMonth(today);
    if (monthFilter !== "all") {
      setMonthFilter(getMonthKeyFromDate(today));
    }
  }

  async function handleTaskSubmit(input: TaskFormInput) {
    setActionError(null);

    const method = editingTask ? "PATCH" : "POST";
    const body = editingTask ? { id: editingTask.id, ...input } : input;

    await requestJson("/api/tasks", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, accessToken);

    await loadBoardData();
    setEditingTask(null);
  }

  async function updateTaskStatus(task: TaskItem, nextStatus: TaskStatus) {
    setActionError(null);

    try {
      await requestJson("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          status: nextStatus,
        }),
      }, accessToken);
      await loadBoardData();
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  }

  async function handleDeleteTask() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setActionError(null);

    try {
      await requestJson(`/api/tasks?id=${deleteTarget.id}`, { method: "DELETE" }, accessToken);
      setDeleteTarget(null);
      await loadBoardData();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  async function handleAnnouncementSubmit(input: AnnouncementFormInput) {
    setActionError(null);

    const method = editingAnnouncement ? "PATCH" : "POST";
    const body = editingAnnouncement ? { id: editingAnnouncement.id, ...input } : input;

    await requestJson("/api/announcements", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, accessToken);

    await loadBoardData();
    setEditingAnnouncement(null);
  }

  async function handleDeleteAnnouncement() {
    if (!deleteAnnouncementTarget) {
      return;
    }

    setDeletingAnnouncement(true);
    setActionError(null);

    try {
      await requestJson(`/api/announcements?id=${deleteAnnouncementTarget.id}`, { method: "DELETE" }, accessToken);
      setDeleteAnnouncementTarget(null);
      setExpandedAnnouncement(null);
      await loadBoardData();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setDeletingAnnouncement(false);
    }
  }

  function handleEdit(task: TaskItem) {
    setEditingTask(task);
    setDialogOpen(true);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/70 bg-white/70 px-6 py-5 text-sm text-muted-foreground backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.04]">
        Loading tasks...
      </div>
    );
  }

  return (
    <>
      <div className="w-full space-y-5">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#A1A3AB] dark:text-slate-300">
              Tasks
            </p>
            <div className="mt-2">
              <h1 className="text-[36px] font-medium leading-[34px] text-black dark:text-white">
                Task Board
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={monthFilter}
              onValueChange={(value) => {
                setMonthFilter(value);

                if (value === "all") {
                  return;
                }

                setVisibleMonth(parseLocalDate(`${value}-01`));
              }}
            >
              <SelectTrigger className="h-11 w-[170px] rounded-full border border-[#A1A3AB]/40 bg-white/70 px-4 text-sm text-[#747474] shadow-[0_14px_30px_-24px_rgba(0,0,0,0.28)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
                <SelectValue placeholder="All months" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">All months</SelectItem>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="w-fit rounded-full border border-[#A1A3AB]/40 bg-white/70 px-4 py-2 text-sm text-[#747474] shadow-[0_14px_30px_-24px_rgba(0,0,0,0.28)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
              {format(todayStart, "EEEE, dd MMM yyyy")}
            </div>
          </div>
        </section>

        {loadErrors.length || actionError ? (
          <div className="space-y-3">
            {loadErrors.map((errorMessage) => (
              <div
                key={errorMessage}
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
              >
                {errorMessage}
              </div>
            ))}
            {actionError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                {actionError}
              </div>
            ) : null}
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[minmax(360px,1fr)_minmax(360px,1fr)_420px] xl:grid-rows-[220px_calc(100vh-376px)] xl:items-start" style={{ maxHeight: "calc(100vh - 140px)" }}>
          <div className="flex min-h-[600px] flex-col overflow-hidden rounded-[14px] bg-[#F5F8FF] p-5 shadow-[0px_77px_31px_rgba(0,0,0,0.01),0px_44px_26px_rgba(0,0,0,0.02),0px_19px_19px_rgba(0,0,0,0.03),0px_5px_11px_rgba(0,0,0,0.04)] dark:bg-slate-950/65 xl:col-start-3 xl:row-start-1 xl:row-span-2 xl:h-[calc(100vh-140px)] xl:min-h-[600px]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ListTodo className="h-5 w-5 text-[#A1A3AB] dark:text-slate-300" />
                <h2 className="text-[22px] font-semibold tracking-tight text-black dark:text-white">
                  To-Do
                </h2>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="group h-auto items-center gap-3 rounded-[18px] border border-[#F24E1E]/12 bg-white/88 px-3 py-2 text-left shadow-[0_18px_30px_-26px_rgba(15,23,42,0.38)] transition-all duration-300 hover:border-[#F24E1E]/30 hover:bg-white hover:shadow-[0_22px_38px_-24px_rgba(242,78,30,0.28)] dark:border-white/10 dark:bg-white/[0.06] dark:hover:border-[#F24E1E]/30 dark:hover:bg-white/[0.1]"
                onClick={() => {
                  setEditingTask(null);
                  setDialogOpen(true);
                }}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(145deg,#fff5f1_0%,#ffd1bf_100%)] text-[#F24E1E] shadow-[0_10px_20px_-16px_rgba(242,78,30,0.7)] dark:bg-[linear-gradient(145deg,rgba(242,78,30,0.22)_0%,rgba(251,146,60,0.12)_100%)]">
                  <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                </span>
                <span className="flex flex-col items-start">
                  <span className="text-[15px] font-semibold tracking-[-0.02em] text-slate-900 dark:text-white">
                    Add task
                  </span>
                  <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A1A3AB] group-hover:text-[#F24E1E] dark:text-slate-300 dark:group-hover:text-[#ffb196]">
                    Quick Create
                  </span>
                </span>
              </Button>
            </div>

            <div className="mt-5 flex items-center gap-3 text-[12px] leading-[15px] text-black dark:text-white">
              <span>{format(todayStart, "dd MMMM")}</span>
              <span className="h-2 w-2 rounded-full bg-[#A1A3AB]" />
              <span className="text-[#A1A3AB] dark:text-slate-300">Today</span>
              <span className="ml-auto rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-[#747474] shadow-[0_8px_18px_-14px_rgba(0,0,0,0.28)] dark:border dark:border-white/15 dark:bg-white/[0.18] dark:text-white">
                {openBoardItems.length} active item{openBoardItems.length === 1 ? "" : "s"}
              </span>
            </div>

            <ScrollArea className="mt-4 h-[615px] pr-3 xl:h-auto xl:min-h-0 xl:flex-1">
              <div className="space-y-4">
                {openBoardItems.length === 0 ? (
                  <div className="rounded-[14px] border border-dashed border-[#A1A3AB] bg-white px-5 py-16 text-center dark:border-white/15 dark:bg-slate-950/60">
                    <p className="text-[16px] font-semibold text-black dark:text-white">
                      Nothing open right now
                    </p>
                    <p className="mt-2 text-sm text-[#747474] dark:text-slate-300">
                      {isAdmin
                        ? "Add a new task or create an announcement to see it here."
                        : "Add a new task to see it here. Announcements from admins will also appear automatically."}
                    </p>
                  </div>
                ) : (
                  openBoardItems.map((item) => (
                    <BoardPreview
                      key={`${item.source}-${item.id}`}
                      item={item}
                      onEdit={handleEdit}
                      onToggleStatus={(task) => {
                        void updateTaskStatus(task, "completed");
                      }}
                      onDelete={(task) => setDeleteTarget(task)}
                      onClick={item.task ? (task) => setExpandedTask(task) : undefined}
                      onAnnouncementClick={(announcement) => setExpandedAnnouncement(announcement)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex min-h-[200px] flex-col overflow-hidden rounded-[14px] bg-[#F5F8FF] p-5 shadow-[0px_53px_21px_rgba(0,0,0,0.01),0px_30px_18px_rgba(0,0,0,0.02),0px_13px_13px_rgba(0,0,0,0.03),0px_3px_7px_rgba(0,0,0,0.04)] dark:bg-slate-950/65 xl:col-start-2 xl:row-start-1 xl:h-[220px] xl:min-h-0 xl:self-stretch">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-[#A1A3AB] dark:text-slate-300" />
              <h2 className="text-[22px] font-semibold tracking-tight text-black dark:text-white">
                Completed Tasks
              </h2>
            </div>

            <ScrollArea className="mt-4 h-[220px] flex-1 pr-3 xl:h-auto xl:min-h-0 xl:flex-1">
              <div className="space-y-4">
                {completedTasks.length === 0 ? (
                  <div className="rounded-[14px] border border-dashed border-[#A1A3AB] bg-white px-5 py-10 text-center dark:border-white/15 dark:bg-slate-950/60">
                    <p className="text-[16px] font-semibold text-black dark:text-white">
                      No completed tasks yet
                    </p>
                    <p className="mt-2 text-sm text-[#747474] dark:text-slate-300">
                      Completed tasks will appear here automatically.
                    </p>
                  </div>
                ) : (
                  completedTasks.map((task) => (
                    <CompletedPreview
                      key={task.id}
                      task={task}
                      onEdit={handleEdit}
                      onToggleStatus={(nextTask) => {
                        void updateTaskStatus(nextTask, "in_progress");
                      }}
                      onDelete={(nextTask) => setDeleteTarget(nextTask)}
                      onClick={(task) => setExpandedTask(task)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex min-h-[200px] flex-col rounded-[14px] bg-[#F5F8FF] p-5 pb-4 shadow-[0px_53px_21px_rgba(0,0,0,0.01),0px_30px_18px_rgba(0,0,0,0.02),0px_13px_13px_rgba(0,0,0,0.03),0px_3px_7px_rgba(0,0,0,0.04)] dark:bg-slate-950/65 xl:col-start-1 xl:row-start-1 xl:h-[220px] xl:min-h-0 xl:self-stretch">
            <div className="flex items-center gap-3">
              <CheckCheck className="h-6 w-6 text-[#A1A3AB] dark:text-slate-300" />
              <h2 className="text-[22px] font-semibold tracking-tight text-black dark:text-white">
                Task Status
              </h2>
            </div>

            <div className="mt-4 grid justify-items-center gap-2 sm:grid-cols-3">
              {statusBuckets.map((bucket) => (
                <ProgressRing
                  key={bucket.label}
                  label={bucket.label}
                  count={bucket.count}
                  percentage={bucket.percentage}
                  color={bucket.color}
                />
              ))}
            </div>
          </div>

          <div className="flex min-h-[480px] flex-col overflow-hidden rounded-[14px] bg-[#F5F8FF] p-5 pb-4 shadow-[0px_45px_18px_rgba(0,0,0,0.01),0px_26px_15px_rgba(0,0,0,0.02),0px_11px_11px_rgba(0,0,0,0.03),0px_3px_6px_rgba(0,0,0,0.04)] dark:bg-slate-950/65 xl:col-start-1 xl:row-start-2 xl:h-[calc(100vh-376px)] xl:min-h-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-6 w-6 text-[#A1A3AB] dark:text-slate-300" />
                <h2 className="text-[22px] font-semibold tracking-tight text-black dark:text-white">
                  Calendar
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 rounded-full border border-[#A1A3AB]/35 bg-white px-3 text-xs font-medium text-[#555] hover:border-[#38BDF8]/45 hover:bg-[#f0f9ff] dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-sky-500/10"
                  onClick={handleJumpToToday}
                >
                  Today
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-1 flex-col overflow-hidden rounded-[20px] border border-[#A1A3AB]/40 bg-white p-3.5 shadow-[0_20px_28px_-24px_rgba(0,0,0,0.38)] dark:border-white/10 dark:bg-slate-950/60">
              <Calendar
                mode="single"
                fixedWeeks
                month={visibleMonth}
                onMonthChange={(nextMonth) => {
                  setVisibleMonth(nextMonth);

                  if (monthFilter !== "all") {
                    setMonthFilter(getMonthKeyFromDate(nextMonth));
                  }
                }}
                selected={selectedDate}
                onSelect={(nextDate) => {
                  if (!nextDate) {
                    return;
                  }

                  setSelectedDate(nextDate);
                  setVisibleMonth(nextDate);

                  if (monthFilter !== "all") {
                    setMonthFilter(getMonthKeyFromDate(nextDate));
                  }
                }}
                modifiers={{
                  hasTasks: taskDates,
                  hasAnnouncements: announcementDates,
                }}
                modifiersClassNames={{
                  hasTasks:
                    "[&>button]:relative [&>button]:font-semibold [&>button]:after:absolute [&>button]:after:bottom-1 [&>button]:after:left-1/2 [&>button]:after:h-1.5 [&>button]:after:w-1.5 [&>button]:after:-translate-x-1/2 [&>button]:after:rounded-full [&>button]:after:bg-[#F59E0B] [&[data-selected=true]>button]:after:bg-white",
                  hasAnnouncements:
                    "[&>button]:before:absolute [&>button]:before:top-1 [&>button]:before:right-1 [&>button]:before:h-1.5 [&>button]:before:w-1.5 [&>button]:before:rounded-full [&>button]:before:bg-[#38BDF8] [&[data-selected=true]>button]:before:bg-white",
                }}
                classNames={{
                  root: "relative flex w-full flex-col p-0",
                  months: "w-full",
                  month: "relative flex flex-col",
                  month_caption: "mb-1 flex h-8 items-center justify-start pl-2 pr-16",
                  caption_label: "text-[18px] font-semibold tracking-tight text-black dark:text-white",
                  nav: "absolute right-0 top-0 z-10 flex items-center gap-1",
                  button_previous:
                    "h-6 w-6 rounded-full border border-[#A1A3AB]/35 bg-white p-0 text-black transition-colors hover:border-[#38BDF8]/40 hover:bg-[#f0f9ff] dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-sky-500/10",
                  button_next:
                    "h-6 w-6 rounded-full border border-[#A1A3AB]/35 bg-white p-0 text-black transition-colors hover:border-[#38BDF8]/40 hover:bg-[#f0f9ff] dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-sky-500/10",
                  month_grid: "w-full border-collapse table-fixed mt-1",
                  weekdays: "border-b border-[#A1A3AB]/30",
                  weekday:
                    "h-7 px-0 pb-1 text-center align-middle text-[10px] font-medium tracking-[0.02em] text-[#747474] dark:text-slate-300",
                  weeks: "",
                  week: "",
                  day: "p-0 pb-0.5 text-center align-middle",
                  day_button:
                    "relative mx-auto flex h-8 w-8 items-center justify-center rounded-lg p-0 text-[14px] font-medium leading-none tabular-nums text-[#555] transition-colors duration-150 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10",
                  selected:
                    "[&>button]:bg-[#E0F2FE] [&>button]:text-[#0369A1] [&>button]:shadow-[0_12px_20px_-16px_rgba(56,189,248,0.65)] [&>button]:hover:bg-[#d5effd] dark:[&>button]:bg-sky-500/20 dark:[&>button]:text-sky-100",
                  today: "[&>button]:font-bold [&>button]:text-[#38BDF8] dark:[&>button]:text-[#38BDF8]",
                  outside: "text-[#b8b8b8] dark:text-slate-600",
                }}
              />

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#747474] dark:text-slate-300">
                <span className="font-medium">{format(selectedDate, "dd MMMM yyyy")}</span>
                <span className="h-1 w-1 rounded-full bg-[#A1A3AB]" />
                <span>
                  {selectedDateItemsCount} item{selectedDateItemsCount === 1 ? "" : "s"} scheduled
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                  {selectedDateTaskCount} task{selectedDateTaskCount === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#38BDF8]" />
                  {selectedDateAnnouncementCount} announcement
                  {selectedDateAnnouncementCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex min-h-[480px] flex-col overflow-hidden rounded-[14px] bg-[#F5F8FF] p-5 pb-4 shadow-[0px_45px_18px_rgba(0,0,0,0.01),0px_26px_15px_rgba(0,0,0,0.02),0px_11px_11px_rgba(0,0,0,0.03),0px_3px_6px_rgba(0,0,0,0.04)] dark:bg-slate-950/65 xl:col-start-2 xl:row-start-2 xl:h-[calc(100vh-376px)] xl:min-h-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-[22px] font-semibold tracking-tight text-black dark:text-white uppercase tracking-[0.18em] text-[#A1A3AB] text-[11px] !font-semibold">
                  Day Agenda
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-white px-3 py-1 text-[10px] font-medium text-[#747474] shadow-[0_8px_18px_-14px_rgba(0,0,0,0.28)] dark:border dark:border-white/15 dark:bg-white/[0.18] dark:text-white">
                  {selectedDateItemsCount} item{selectedDateItemsCount === 1 ? "" : "s"} on{" "}
                  {format(selectedDate, "dd MMM")}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-1 flex-col overflow-hidden rounded-[20px] border border-[#A1A3AB]/30 bg-[#FAFCFF] p-3.5 dark:border-white/10 dark:bg-slate-950/50">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A1A3AB] dark:text-slate-300">
                  Agenda Items
                </p>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-[#747474] dark:border dark:border-white/15 dark:bg-white/[0.18] dark:text-white">
                  {selectedDateAgenda.length} item{selectedDateAgenda.length === 1 ? "" : "s"}
                </span>
              </div>

              <ScrollArea className="mt-3 h-[200px] flex-1 pr-3 xl:h-auto xl:min-h-0 xl:flex-1">
                {selectedDateAgenda.length === 0 ? (
                  <div className="grid h-full min-h-[180px] place-items-center rounded-[14px] border border-dashed border-[#A1A3AB]/60 bg-white/70 px-4 text-center dark:border-white/15 dark:bg-slate-950/60">
                    <div>
                      <p className="text-sm font-semibold text-black dark:text-white">
                        No items on this date
                      </p>
                      <p className="mt-1 text-xs text-[#747474] dark:text-slate-300">
                        Add a task or announcement to populate this agenda.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedDateAgenda.map((item) => {
                      const cardClassName =
                        "w-full rounded-xl border border-[#A1A3AB]/35 bg-white p-3 text-left shadow-[0_10px_20px_-20px_rgba(0,0,0,0.45)] transition-colors dark:border-white/10 dark:bg-slate-950/70";

                      if (item.task) {
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`${cardClassName} hover:border-[#FF6767]/60`}
                            onClick={() => setExpandedTask(item.task!)}
                          >
                            <div className="flex items-start gap-2.5">
                              <span
                                className="mt-1 block h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: item.accent }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-black dark:text-white">
                                  {item.title}
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-[#747474] dark:text-slate-300">
                                  {truncateText(item.description, 72)}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                      item.badgeClassName,
                                    )}
                                  >
                                    {item.statusLabel}
                                  </span>
                                  <span className="text-[10px] text-[#A1A3AB] dark:text-slate-300">
                                    Task
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      }

                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`${cardClassName} w-full text-left cursor-pointer hover:border-[#FF6767]/60`}
                          onClick={() => item.announcement && setExpandedAnnouncement(item.announcement)}
                        >
                          <div className="flex items-start gap-2.5">
                            <span
                              className="mt-1 block h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: item.accent }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-black dark:text-white">
                                {item.title}
                              </p>
                              <p className="mt-1 text-xs leading-relaxed text-[#747474] dark:text-slate-300">
                                {truncateText(item.description, 72)}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                    item.badgeClassName,
                                  )}
                                >
                                  {item.statusLabel}
                                </span>
                                <span className="text-[10px] text-[#A1A3AB] dark:text-slate-300">
                                  Announcement
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </section>
      </div>

      {expandedTask && (
        <ExpandedTaskView
          task={expandedTask}
          onClose={() => setExpandedTask(null)}
          onEdit={(task) => {
            setExpandedTask(null);
            handleEdit(task);
          }}
          onToggleStatus={(task) => {
            void updateTaskStatus(task, task.status === "completed" ? "pending" : "completed");
          }}
          onDelete={(task) => setDeleteTarget(task)}
        />
      )}

      {expandedAnnouncement && (
        <ExpandedAnnouncementView
          announcement={expandedAnnouncement}
          onClose={() => setExpandedAnnouncement(null)}
          onEdit={
            isAdmin
              ? (a) => {
                  setEditingAnnouncement(a);
                  setAnnouncementDialogOpen(true);
                }
              : undefined
          }
          onDelete={isAdmin ? (a) => setDeleteAnnouncementTarget(a) : undefined}
        />
      )}

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingTask(null);
          }
        }}
        onSubmit={handleTaskSubmit}
        initialData={editingTask}
        defaultDate={todayKey}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete Task"
        description="Remove this task from the board."
        itemLabel={deleteTarget?.title}
        deleting={deleting}
        onConfirm={() => {
          void handleDeleteTask();
        }}
      />

      {isAdmin ? (
        <>
          <AnnouncementFormDialog
            open={announcementDialogOpen}
            onOpenChange={(open) => {
              setAnnouncementDialogOpen(open);
              if (!open) {
                setEditingAnnouncement(null);
              }
            }}
            onSubmit={handleAnnouncementSubmit}
            initialData={editingAnnouncement}
            defaultDate={todayKey}
          />

          <DeleteConfirmDialog
            open={Boolean(deleteAnnouncementTarget)}
            onOpenChange={(open) => {
              if (!open) {
                setDeleteAnnouncementTarget(null);
              }
            }}
            title="Delete Announcement"
            description="Remove this announcement from the board."
            itemLabel={deleteAnnouncementTarget?.title}
            deleting={deletingAnnouncement}
            onConfirm={() => {
              void handleDeleteAnnouncement();
            }}
          />
        </>
      ) : null}
    </>
  );
}
