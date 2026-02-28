"use client";

import { AttendanceTab } from "@/components/students/attendance-tab";
import { StudentFinanceTab } from "@/components/students/student-finance-tab";
import { StudentDirectoryTab } from "@/components/students/student-directory-tab";
import { useAppData } from "@/components/providers/app-data-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudentsPage() {
  const {
    students,
    loading,
    addStudent,
    updateStudent,
    deleteStudent,
    finances,
    addTransaction,
    updateTransaction,
    getAttendanceForDate,
    saveAttendance,
  } = useAppData();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Loading students...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="page-title">Students</h1>
        <p className="page-subtitle">Manage student data and attendance.</p>
      </div>

      <Tabs defaultValue="directory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="directory">Student Directory</TabsTrigger>
          <TabsTrigger value="student-finance">Student Finance</TabsTrigger>
          <TabsTrigger value="attendance">Mark Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="directory">
          <StudentDirectoryTab
            students={students}
            onAdd={addStudent}
            onUpdate={updateStudent}
            onDelete={deleteStudent}
          />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceTab
            students={students}
            getAttendanceForDate={getAttendanceForDate}
            onSaveAttendance={saveAttendance}
          />
        </TabsContent>

        <TabsContent value="student-finance">
          <StudentFinanceTab
            students={students}
            finances={finances}
            onAddTransaction={addTransaction}
            onUpdateTransaction={updateTransaction}
            onUpdateStudent={updateStudent}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
