"use client";

import { CalendarCheck, Download, IndianRupee, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    <Card className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <CardHeader className="border-b border-slate-200 bg-slate-50 pb-4 dark:border-slate-700 dark:bg-slate-800/50">
        <CardTitle className="text-lg text-slate-900 dark:text-white">Export Data</CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          Download each dataset separately in CSV format.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 pb-6 md:pt-7 md:pb-7">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Button
            type="button"
            variant="outline"
            className="h-14 justify-between rounded-lg border-slate-300 px-4 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
            onClick={handleStudentsExport}
          >
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-slate-900 dark:text-white">Student CSV</span>
            </span>
            <span className="inline-flex items-center text-slate-500">
              <Download className="h-3.5 w-3.5" />
            </span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-14 justify-between rounded-lg border-slate-300 px-4 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
            onClick={handleFinancesExport}
          >
            <span className="inline-flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              <span className="text-slate-900 dark:text-white">Finance CSV</span>
            </span>
            <span className="inline-flex items-center text-slate-500">
              <Download className="h-3.5 w-3.5" />
            </span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-14 justify-between rounded-lg border-slate-300 px-4 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800 sm:col-span-2 lg:col-span-1"
            onClick={handleAttendanceExport}
          >
            <span className="inline-flex items-center gap-2">
              <CalendarCheck className="h-4 w-4" />
              <span className="text-slate-900 dark:text-white">Attendance CSV</span>
            </span>
            <span className="inline-flex items-center text-slate-500">
              <Download className="h-3.5 w-3.5" />
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
