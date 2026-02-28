"use client";

import * as React from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DangerZoneCardProps {
  onReset: () => Promise<void>;
}

export function DangerZoneCard({ onReset }: DangerZoneCardProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);

  async function handleReset() {
    setResetting(true);
    try {
      await onReset();
      setConfirmOpen(false);
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <Card className="border border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-950/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-600/90 dark:text-red-300/90">
            Reset all students, finances, attendance, and settings to default mock data.
          </p>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            Reset All Data
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Reset</DialogTitle>
            <DialogDescription>
              This action will restore the original mock data for all modules.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleReset} disabled={resetting}>
              {resetting ? "Resetting..." : "Yes, Reset Everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
