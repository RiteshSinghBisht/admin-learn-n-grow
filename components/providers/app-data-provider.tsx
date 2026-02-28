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
  const { isAuthEnabled, loading: authLoading, user } = useAuth();
  const [snapshot, setSnapshot] = React.useState<AppDataSnapshot>(defaultSnapshot);
  const [loading, setLoading] = React.useState(true);
  const [currentMonthKey, setCurrentMonthKey] = React.useState(() => formatMonthKey(new Date()));
  const isSeedingMonthlyDuesRef = React.useRef(false);

  React.useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      setLoading(true);
      try {
        const nextSnapshot = await dataService.getInitialSnapshot();
        if (isMounted) {
          setSnapshot(nextSnapshot);
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
  }, [authLoading, isAuthEnabled, user?.id]);

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
      ...prev,
      students: [student, ...prev.students],
    }));
  }, []);

  const updateStudent = React.useCallback(async (id: string, input: StudentFormInput) => {
    const updated = await dataService.updateStudent(id, input);
    setSnapshot((prev) => ({
      ...prev,
      students: prev.students.map((student) => (student.id === id ? updated : student)),
    }));
  }, []);

  const deleteStudent = React.useCallback(async (id: string) => {
    await dataService.deleteStudent(id);
    setSnapshot((prev) => ({
      ...prev,
      students: prev.students.filter((student) => student.id !== id),
      attendance: prev.attendance.filter((item) => item.studentId !== id),
      finances: prev.finances.map((item) =>
        item.studentId === id ? { ...item, studentId: null } : item,
      ),
    }));
  }, []);

  const addTransaction = React.useCallback(async (input: TransactionFormInput) => {
    const transaction = await dataService.addTransaction(input);
    setSnapshot((prev) => ({
      ...prev,
      finances: [transaction, ...prev.finances],
    }));
  }, []);

  const updateTransaction = React.useCallback(
    async (id: string, input: TransactionFormInput) => {
      const updated = await dataService.updateTransaction(id, input);
      setSnapshot((prev) => ({
        ...prev,
        finances: prev.finances.map((item) => (item.id === id ? updated : item)),
      }));
    },
    [],
  );

  const deleteTransaction = React.useCallback(async (id: string) => {
    await dataService.deleteTransaction(id);
    setSnapshot((prev) => ({
      ...prev,
      finances: prev.finances.filter((item) => item.id !== id),
    }));
  }, []);

  const toggleTransactionStatus = React.useCallback(async (id: string) => {
    const updated = await dataService.toggleTransactionStatus(id);
    setSnapshot((prev) => ({
      ...prev,
      finances: prev.finances.map((item) => (item.id === id ? updated : item)),
    }));
  }, []);

  const saveAttendance = React.useCallback(async (date: string, entries: AttendanceDraft[]) => {
    const saved = await dataService.saveAttendance(date, entries);
    setSnapshot((prev) => ({
      ...prev,
      attendance: [...prev.attendance.filter((item) => item.attendanceDate !== date), ...saved],
    }));
  }, []);

  const getAttendanceForDate = React.useCallback(
    (date: string) => snapshot.attendance.filter((item) => item.attendanceDate === date),
    [snapshot.attendance],
  );

  const updateProfile = React.useCallback(async (input: BusinessProfile) => {
    const updated = await dataService.updateProfile(input);
    setSnapshot((prev) => ({
      ...prev,
      profile: updated,
    }));
  }, []);

  const resetAllData = React.useCallback(async () => {
    const nextSnapshot = await dataService.resetAllData();
    setSnapshot(nextSnapshot);
  }, []);

  const ensureCurrentMonthStudentDues = React.useCallback(async () => {
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
        ...prev,
        finances: [...createdTransactions, ...prev.finances],
      }));
    } finally {
      isSeedingMonthlyDuesRef.current = false;
    }
  }, [loading, snapshot.students, snapshot.finances, currentMonthKey]);

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
