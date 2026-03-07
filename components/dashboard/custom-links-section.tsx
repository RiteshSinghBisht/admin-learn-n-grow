"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Link as LinkIcon, Plus, Edit, Trash2, ExternalLink, CheckCircle, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CustomLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  display_order: number;
  created_at: string;
}

// Toast types
type ToastVariant = "success" | "error";

interface ToastState {
  message: string;
  variant: ToastVariant;
}

interface CustomLinksSectionProps {
  excludeTitles?: string[];
}

// Pre-defined icon options
const _ICON_OPTIONS = [
  { value: 'Link', label: 'Link', icon: LinkIcon },
  { value: 'ExternalLink', label: 'External', icon: ExternalLink },
];

// Gradient presets for cards (stored as full CSS values)
const GRADIENTS = [
  'linear-gradient(to bottom right, #7c3aed, #d946ef, #4338ca)',
  'linear-gradient(to bottom right, #2563eb, #6366f1, #8b5cf6)',
  'linear-gradient(to bottom right, #0f766e, #0ea5e9, #1d4ed8)',
  'linear-gradient(to bottom right, #b45309, #d97706, #be185d)',
  'linear-gradient(to bottom right, #dc2626, #f97316, #ea580c)',
  'linear-gradient(to bottom right, #059669, #10b981, #047857)',
  'linear-gradient(to bottom right, #7c2d12, #ea580c, #c2410c)',
  'linear-gradient(to bottom right, #4f46e5, #818cf8, #6366f1)',
];

function getGradient(index: number): string {
  return GRADIENTS[index % GRADIENTS.length];
}

export function CustomLinksSection({ excludeTitles = [] }: CustomLinksSectionProps) {
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<CustomLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    setToast({ message, variant });
  }, []);

  const handleDeleteClick = (id: string, title: string) => {
    setConfirmDelete({ id, title });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/custom-links?id=${confirmDelete.id}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (result.success) {
        showToast('Link deleted successfully!', 'success');
        fetchLinks();
      } else {
        showToast('Failed to delete: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to delete', 'error');
    }
    setConfirmDelete(null);
  };

  // Form state
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch links when dialog opens
  const fetchLinks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/custom-links');
      const result = await response.json();
      if (result.success) {
        setLinks(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching custom links:', error);
    }
    setLoading(false);
  };

  // Fetch links on initial load
  useEffect(() => {
    fetchLinks();
  }, []);

  useEffect(() => {
    if (open) {
      fetchLinks();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !url) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/custom-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          url,
          display_order: links.length
        })
      });

      const result = await response.json();

      if (result.success) {
        showToast('Link added successfully!', 'success');
        resetForm();
        fetchLinks();
      } else {
        showToast('Failed: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to add link', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !url || !editingId) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/custom-links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          title,
          url
        })
      });

      const result = await response.json();

      if (result.success) {
        showToast('Link updated successfully!', 'success');
        resetForm();
        fetchLinks();
      } else {
        showToast('Failed: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to update link', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (link: CustomLink) => {
    setTitle(link.title);
    setUrl(link.url);
    setEditingId(link.id);
  };

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setEditingId(null);
  };

  const excludedTitlesSet = useMemo(
    () =>
      new Set(
        excludeTitles.map((value) => value.trim().toLowerCase()).filter(Boolean),
      ),
    [excludeTitles],
  );

  const visibleLinks = useMemo(() => {
    if (!excludedTitlesSet.size) {
      return links;
    }

    return links.filter((link) => !excludedTitlesSet.has(link.title.trim().toLowerCase()));
  }, [links, excludedTitlesSet]);

  return (
    <section className="rounded-3xl border border-border/80 bg-white/50 p-5 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.03] md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Custom Links</h2>
          <p className="mt-1 text-sm text-muted-foreground">Add your own quick access links</p>
        </div>
        <span
          className="hidden cursor-pointer rounded-full border border-border/80 bg-white/65 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-slate-100 dark:border-white/15 dark:bg-white/[0.06] dark:hover:bg-white/10 md:inline-flex"
          onClick={() => setOpen(true)}
        >
          <Edit className="mr-1.5 h-3 w-3" />
          {visibleLinks.length} Links
        </span>
      </div>

      {/* Links Grid */}
      {visibleLinks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <LinkIcon className="h-10 w-10 text-slate-400" />
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">No custom links yet</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">Click the button below to add your first link</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleLinks.map((link, index) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block h-full"
            >
              <Card
                className={cn(
                  "relative h-full min-h-[176px] overflow-hidden border border-transparent transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg",
                  "text-white",
                )}
                style={{ background: getGradient(index) }}
              >
                <CardContent className="relative flex h-full flex-col justify-between gap-4 p-5 md:p-6">
                  <div className="flex items-start justify-between">
                    <div className="rounded-xl bg-white/20 p-2.5">
                      <LinkIcon className="h-4 w-4" />
                    </div>
                    <ExternalLink className="h-4 w-4 opacity-90 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">
                      Custom Link
                    </p>
                    <h3 className="mt-1 text-base font-semibold leading-tight md:text-[1.08rem]">{link.title}</h3>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}

      {/* Add Link Button */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="mt-4 w-full border-dashed border-slate-300 text-slate-600 hover:border-solid hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Custom Link
          </Button>
        </DialogTrigger>
        <DialogContent className="isolate max-h-[80vh] overflow-y-auto border border-slate-200 bg-white text-slate-900 shadow-xl sm:max-w-[500px] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Manage Custom Links</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Add, edit, or delete your custom quick access links.
            </DialogDescription>
          </DialogHeader>

          {/* Link List */}
          <div className="mt-4 max-h-[200px] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/50">
            <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">Your Links</h4>
            {loading ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">Loading...</p>
            ) : visibleLinks.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">No links added yet. Add one below!</p>
            ) : (
              visibleLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-start justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{link.title}</p>
                    <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{link.url}</p>
                  </div>
                  <div className="ml-2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                      onClick={() => handleEdit(link)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                      onClick={() => handleDeleteClick(link.id, link.title)}
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
              {editingId ? 'Edit Link' : 'Add New Link'}
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
                <Label htmlFor="link-title" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Title
                </Label>
                <Input
                  id="link-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter link title..."
                  className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="link-url" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  URL
                </Label>
                <Input
                  id="link-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com..."
                  className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
                  required
                />
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
                  ? (editingId ? 'Updating...' : 'Adding...')
                  : (editingId ? 'Update Link' : 'Add Link')
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
