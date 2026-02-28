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
      <Card className="border-red-300/65 bg-red-100/35 dark:border-red-400/35 dark:bg-red-950/22">
        <CardHeader>
          <CardTitle className="text-base text-red-700 dark:text-red-300">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-700/90 dark:text-red-200/90">
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
