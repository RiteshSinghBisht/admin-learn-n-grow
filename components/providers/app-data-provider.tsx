"use client";

import * as React from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { dataService } from "@/lib/data-service";
import type {
  AppDataSnapshot,
  AttendanceDraft,
  AttendanceRecord,
  BusinessProfile,
  StudentFormInput,
  TransactionFormInput,
} from "@/lib/types";

interface AppDataContextValue extends AppDataSnapshot {
  loading: boolean;
  addStudent: (input: StudentFormInput) => Promise<void>;
  updateStudent: (id: string, input: StudentFormInput) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  addTransaction: (input: TransactionFormInput) => Promise<void>;
  updateTransaction: (id: string, input: TransactionFormInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  toggleTransactionStatus: (id: string) => Promise<void>;
  saveAttendance: (date: string, entries: AttendanceDraft[]) => Promise<void>;
  getAttendanceForDate: (date: string) => AttendanceRecord[];
  updateProfile: (input: BusinessProfile) => Promise<void>;
  resetAllData: () => Promise<void>;
}

const AppDataContext = React.createContext<AppDataContextValue | undefined>(undefined);

const defaultSnapshot: AppDataSnapshot = {
  students: [],
  finances: [],
  attendance: [],
  profile: {
    businessName: "",
    ownerName: "",
    phone: "",
    address: "",
  },
};

interface AppDataProviderProps {
  children: React.ReactNode;
}

function formatMonthKey(dateInput: string | Date) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return `${date.toLocaleString("en-US", { month: "long" })} ${year}`;
}

export function AppDataProvider({ children }: AppDataProviderProps) {
  const { isAuthEnabled, loading: authLoading, user, role, assignedTeachers } = useAuth();
  const [snapshot, setSnapshot] = React.useState<AppDataSnapshot>(defaultSnapshot);
  const [loading, setLoading] = React.useState(true);
  const [currentMonthKey, setCurrentMonthKey] = React.useState(() => formatMonthKey(new Date()));
  const isSeedingMonthlyDuesRef = React.useRef(false);

  const applyRoleScope = React.useCallback(
    (nextSnapshot: AppDataSnapshot): AppDataSnapshot => {
      if (!isAuthEnabled || role !== "students_only") {
        return nextSnapshot;
      }

      const allowedTeachers = new Set(
        assignedTeachers
          .map((item) => item.trim().toLowerCase())
          .filter((item) => item.length > 0),
      );

      if (!allowedTeachers.size) {
        return {
          ...nextSnapshot,
          students: [],
          attendance: [],
          finances: [],
        };
      }

      const students = nextSnapshot.students.filter((student) => {
        const teacher = student.teacher?.trim().toLowerCase();
        return Boolean(teacher && allowedTeachers.has(teacher));
      });

      const allowedStudentIds = new Set(students.map((student) => student.id));

      const attendance = nextSnapshot.attendance.filter((item) => {
        if (allowedStudentIds.has(item.studentId)) {
          return true;
        }

        const teacher = item.teacher?.trim().toLowerCase();
        return Boolean(teacher && allowedTeachers.has(teacher));
      });

      const finances = nextSnapshot.finances.filter((item) =>
        item.studentId ? allowedStudentIds.has(item.studentId) : false,
      );

      return {
        ...nextSnapshot,
        students,
        attendance,
        finances,
      };
    },
    [assignedTeachers, isAuthEnabled, role],
  );

  React.useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      setLoading(true);
      try {
        const nextSnapshot = await dataService.getInitialSnapshot();
        if (isMounted) {
          setSnapshot(applyRoleScope(nextSnapshot));
        }
      } catch (error) {
        if (isMounted) {
          setSnapshot(defaultSnapshot);
        }
        const message =
          error instanceof Error ? error.message : "Failed to load app data from configured source.";
        console.error(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (isAuthEnabled) {
      if (authLoading) {
        return () => {
          isMounted = false;
        };
      }

      if (!user) {
        setSnapshot(defaultSnapshot);
        setLoading(false);
        return () => {
          isMounted = false;
        };
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [applyRoleScope, authLoading, isAuthEnabled, user?.id]);

  React.useEffect(() => {
    setSnapshot((prev) => applyRoleScope(prev));
  }, [applyRoleScope]);

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      const nextKey = formatMonthKey(new Date());
      setCurrentMonthKey((prevKey) => (prevKey === nextKey ? prevKey : nextKey));
    }, 60 * 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const addStudent = React.useCallback(async (input: StudentFormInput) => {
    const student = await dataService.addStudent(input);
    setSnapshot((prev) => ({
      ...applyRoleScope({
        ...prev,
        students: [student, ...prev.students],
      }),
    }));
  }, [applyRoleScope]);

  const updateStudent = React.useCallback(async (id: string, input: StudentFormInput) => {
    const updated = await dataService.updateStudent(id, input);
    setSnapshot((prev) => ({
      ...applyRoleScope({
        ...prev,
        students: prev.students.map((student) => (student.id === id ? updated : student)),
      }),
    }));
  }, [applyRoleScope]);

  const deleteStudent = React.useCallback(async (id: string) => {
    await dataService.deleteStudent(id);
    setSnapshot((prev) => ({
      ...applyRoleScope({
        ...prev,
        students: prev.students.filter((student) => student.id !== id),
        attendance: prev.attendance.filter((item) => item.studentId !== id),
        finances: prev.finances.map((item) =>
          item.studentId === id ? { ...item, studentId: null } : item,
        ),
      }),
    }));
  }, [applyRoleScope]);

  const addTransaction = React.useCallback(async (input: TransactionFormInput) => {
    const transaction = await dataService.addTransaction(input);
    setSnapshot((prev) => ({
      ...applyRoleScope({
        ...prev,
        finances: [transaction, ...prev.finances],
      }),
    }));
  }, [applyRoleScope]);

  const updateTransaction = React.useCallback(
    async (id: string, input: TransactionFormInput) => {
      const updated = await dataService.updateTransaction(id, input);
      setSnapshot((prev) => ({
        ...applyRoleScope({
          ...prev,
          finances: prev.finances.map((item) => (item.id === id ? updated : item)),
        }),
      }));
    },
    [applyRoleScope],
  );

  const deleteTransaction = React.useCallback(async (id: string) => {
    await dataService.deleteTransaction(id);
    setSnapshot((prev) => ({
      ...applyRoleScope({
        ...prev,
        finances: prev.finances.filter((item) => item.id !== id),
      }),
    }));
  }, [applyRoleScope]);

  const toggleTransactionStatus = React.useCallback(async (id: string) => {
    const updated = await dataService.toggleTransactionStatus(id);
    setSnapshot((prev) => ({
      ...applyRoleScope({
        ...prev,
        finances: prev.finances.map((item) => (item.id === id ? updated : item)),
      }),
    }));
  }, [applyRoleScope]);

  const saveAttendance = React.useCallback(async (date: string, entries: AttendanceDraft[]) => {
    const saved = await dataService.saveAttendance(date, entries);
    setSnapshot((prev) => ({
      ...applyRoleScope({
        ...prev,
        attendance: [...prev.attendance.filter((item) => item.attendanceDate !== date), ...saved],
      }),
    }));
  }, [applyRoleScope]);

  const getAttendanceForDate = React.useCallback(
    (date: string) => {
      const byStudent = new Map<string, AttendanceRecord>();
      snapshot.attendance.forEach((item) => {
        if (item.attendanceDate !== date) {
          return;
        }

        // Keep first record encountered for a student/date (latest in current ordering).
        if (!byStudent.has(item.studentId)) {
          byStudent.set(item.studentId, item);
        }
      });
      return Array.from(byStudent.values());
    },
    [snapshot.attendance],
  );

  const updateProfile = React.useCallback(async (input: BusinessProfile) => {
    const updated = await dataService.updateProfile(input);
    setSnapshot((prev) => ({
      ...applyRoleScope({
        ...prev,
        profile: updated,
      }),
    }));
  }, [applyRoleScope]);

  const resetAllData = React.useCallback(async () => {
    const nextSnapshot = await dataService.resetAllData();
    setSnapshot(applyRoleScope(nextSnapshot));
  }, [applyRoleScope]);

  const ensureCurrentMonthStudentDues = React.useCallback(async () => {
    if (isAuthEnabled && role !== "admin") {
      return;
    }

    if (loading || isSeedingMonthlyDuesRef.current) {
      return;
    }

    const activeStudents = snapshot.students.filter((student) => student.status === "active");
    if (!activeStudents.length) {
      return;
    }

    const studentsMissingDue = activeStudents.filter(
      (student) =>
        !snapshot.finances.some(
          (item) =>
            item.category === "Student Fee" &&
            item.studentId === student.id &&
            formatMonthKey(item.transactionDate) === currentMonthKey,
        ),
    );

    if (!studentsMissingDue.length) {
      return;
    }

    isSeedingMonthlyDuesRef.current = true;
    try {
      const createdTransactions = await Promise.all(
        studentsMissingDue.map((student) =>
          dataService.addTransaction({
            transactionDate: getTodayDateKey(),
            category: "Student Fee",
            type: "income",
            amount: student.monthlyFee,
            status: "pending",
            description: `${formatMonthLabel(currentMonthKey)} fee due`,
            note: "Auto-generated monthly due",
            studentId: student.id,
          }),
        ),
      );

      setSnapshot((prev) => ({
        ...applyRoleScope({
          ...prev,
          finances: [...createdTransactions, ...prev.finances],
        }),
      }));
    } finally {
      isSeedingMonthlyDuesRef.current = false;
    }
  }, [applyRoleScope, currentMonthKey, isAuthEnabled, loading, role, snapshot.finances, snapshot.students]);

  React.useEffect(() => {
    void ensureCurrentMonthStudentDues();
  }, [ensureCurrentMonthStudentDues]);

  const value = React.useMemo<AppDataContextValue>(
    () => ({
      ...snapshot,
      loading,
      addStudent,
      updateStudent,
      deleteStudent,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      toggleTransactionStatus,
      saveAttendance,
      getAttendanceForDate,
      updateProfile,
      resetAllData,
    }),
    [
      snapshot,
      loading,
      addStudent,
      updateStudent,
      deleteStudent,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      toggleTransactionStatus,
      saveAttendance,
      getAttendanceForDate,
      updateProfile,
      resetAllData,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = React.useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
}
