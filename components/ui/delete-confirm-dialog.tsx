"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  deleting?: boolean;
  onConfirm: () => void;
  itemLabel?: string;
  confirmText?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  deleting = false,
  onConfirm,
  itemLabel,
  confirmText = "Delete",
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border/80 bg-white/45 p-4 text-sm text-muted-foreground dark:border-white/15 dark:bg-white/[0.03]">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
            <div>
              {itemLabel ? (
                <p>
                  You are deleting <span className="font-medium text-foreground">{itemLabel}</span>.
                </p>
              ) : null}
              <p className={itemLabel ? "mt-1.5" : ""}>This action cannot be undone.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? "Deleting..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
