"use client";

import { CalendarCheck, Download, IndianRupee, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  attendanceToCsv,
  downloadCsv,
  financesToCsv,
  studentsToCsv,
} from "@/lib/csv";
import type { AttendanceRecord, FinanceTransaction, Student } from "@/lib/types";

interface DataCardProps {
  students: Student[];
  finances: FinanceTransaction[];
  attendance: AttendanceRecord[];
}

export function DataCard({ students, finances, attendance }: DataCardProps) {
  function handleStudentsExport() {
    downloadCsv("students.csv", studentsToCsv(students));
  }

  function handleFinancesExport() {
    downloadCsv("finances.csv", financesToCsv(finances));
  }

  function handleAttendanceExport() {
    downloadCsv("attendance.csv", attendanceToCsv(attendance));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Data</CardTitle>
        <p className="text-sm text-muted-foreground">
          Download each dataset separately in CSV format.
        </p>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 justify-between rounded-xl border-border/80 bg-white/65 px-4 dark:border-white/15 dark:bg-white/[0.06]"
          onClick={handleStudentsExport}
        >
          <span className="inline-flex items-center gap-2">
            <Users className="h-4 w-4" />
            Student CSV
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            {students.length}
            <Download className="h-3.5 w-3.5" />
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-12 justify-between rounded-xl border-border/80 bg-white/65 px-4 dark:border-white/15 dark:bg-white/[0.06]"
          onClick={handleFinancesExport}
        >
          <span className="inline-flex items-center gap-2">
            <IndianRupee className="h-4 w-4" />
            Finance CSV
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            {finances.length}
            <Download className="h-3.5 w-3.5" />
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-12 justify-between rounded-xl border-border/80 bg-white/65 px-4 dark:border-white/15 dark:bg-white/[0.06] sm:col-span-2 lg:col-span-1"
          onClick={handleAttendanceExport}
        >
          <span className="inline-flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            Attendance CSV
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            {attendance.length}
            <Download className="h-3.5 w-3.5" />
          </span>
        </Button>
      </CardContent>
    </Card>
  );
}
