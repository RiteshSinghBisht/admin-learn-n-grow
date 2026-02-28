import {
  initialBusinessProfile,
  mockAttendance,
  mockFinances,
  mockStudents,
} from "@/lib/data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  AppDataSnapshot,
  AttendanceDraft,
  AttendanceRecord,
  BusinessProfile,
  CreateUserAccessInput,
  FinanceTransaction,
  Student,
  StudentFormInput,
  TransactionFormInput,
  UserAccess,
  UserDeleteMode,
  UserAccessRole,
} from "@/lib/types";

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createId(prefix: string) {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return `${prefix}-${randomPart}`;
}

const initialSnapshot: AppDataSnapshot = {
  students: mockStudents,
  finances: mockFinances,
  attendance: mockAttendance,
  profile: initialBusinessProfile,
};

interface StudentRow {
  id: string | number;
  name: string;
  phone: string;
  batch: Student["batch"] | null;
  join_date: string;
  status: Student["status"];
  monthly_fee: number | string | null;
}

interface FinanceRow {
  id: string | number;
  transaction_date: string;
  category: string;
  type: FinanceTransaction["type"];
  amount: number | string | null;
  status: FinanceTransaction["status"];
  description: string | null;
  note: string | null;
  student_id: string | number | null;
}

interface AttendanceRow {
  id: string | number;
  student_id: string | number;
  student_name?: string | null;
  batch?: Student["batch"] | null;
  attendance_date: string;
  status: AttendanceRecord["status"];
  note?: string | null;
}

interface StudentMetaRow {
  id: string | number;
  name: string;
  batch: Student["batch"] | null;
}

interface UserAccessRow {
  user_id: string;
  email: string | null;
  role: UserAccessRole | null;
  created_at: string | null;
}

interface CreateUserApiPayload {
  message?: string;
  userId?: string;
  email?: string;
  role?: UserAccessRole;
  createdAt?: string;
}

function toNumber(value: number | string | null | undefined, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function mapStudentRow(row: StudentRow): Student {
  return {
    id: String(row.id),
    name: row.name,
    phone: row.phone,
    batch: row.batch ?? "morning",
    joinDate: row.join_date,
    status: row.status,
    monthlyFee: toNumber(row.monthly_fee, 3000),
  };
}

function mapFinanceRow(row: FinanceRow): FinanceTransaction {
  const description = (row.description ?? row.note ?? "").trim();

  return {
    id: String(row.id),
    transactionDate: row.transaction_date,
    category: row.category,
    type: row.type,
    amount: toNumber(row.amount),
    status: row.status,
    description,
    note: row.note ?? undefined,
    studentId: row.student_id == null ? null : String(row.student_id),
  };
}

function mapAttendanceRow(row: AttendanceRow): AttendanceRecord {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    studentName: row.student_name?.trim() || "Unknown Student",
    batch: row.batch ?? "morning",
    attendanceDate: row.attendance_date,
    status: row.status,
    note: row.note ?? undefined,
  };
}

function buildStudentLookupKey(name: string, phone: string) {
  return `${name.trim().toLowerCase()}::${phone.trim().toLowerCase()}`;
}

function isMissingAttendanceSchemaError(message: string) {
  return (
    isMissingAttendanceTableError(message) ||
    isMissingAttendanceColumnError(message, "note") ||
    isMissingAttendanceColumnError(message, "student_name") ||
    isMissingAttendanceColumnError(message, "batch")
  );
}

function isMissingAttendanceTableError(message: string) {
  return (
    message.includes("Could not find the table 'public.attendance'") ||
    message.includes("relation \"public.attendance\" does not exist")
  );
}

function isMissingAttendanceColumnError(
  message: string,
  column: "note" | "student_name" | "batch",
) {
  return (
    message.includes(`Could not find the '${column}' column of 'attendance'`) ||
    message.includes(`column attendance.${column} does not exist`)
  );
}

function hydrateAttendanceRows(
  rows: AttendanceRow[],
  studentMetaMap: Map<string, { name: string; batch: Student["batch"] }>,
) {
  return rows.map((row) => {
    const fallback = studentMetaMap.get(String(row.student_id));
    return {
      ...row,
      student_name: row.student_name ?? fallback?.name ?? "Unknown Student",
      batch: row.batch ?? fallback?.batch ?? "morning",
    };
  });
}

function formatTransportFailure(action: string, error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown network error";

  const isNetworkFailure =
    message.toLowerCase().includes("fetch failed") ||
    message.toLowerCase().includes("load failed") ||
    message.toLowerCase().includes("failed to fetch") ||
    message.toLowerCase().includes("networkerror");

  if (isNetworkFailure) {
    return `Failed to ${action}: Unable to reach Supabase API. Verify project URL/key and allow network requests from localhost.`;
  }

  return `Failed to ${action}: ${message}`;
}

export interface AppDataService {
  getInitialSnapshot(): Promise<AppDataSnapshot>;
  addStudent(input: StudentFormInput): Promise<Student>;
  updateStudent(id: string, input: StudentFormInput): Promise<Student>;
  deleteStudent(id: string): Promise<void>;
  addTransaction(input: TransactionFormInput): Promise<FinanceTransaction>;
  updateTransaction(id: string, input: TransactionFormInput): Promise<FinanceTransaction>;
  deleteTransaction(id: string): Promise<void>;
  toggleTransactionStatus(id: string): Promise<FinanceTransaction>;
  saveAttendance(date: string, entries: AttendanceDraft[]): Promise<AttendanceRecord[]>;
  updateProfile(input: BusinessProfile): Promise<BusinessProfile>;
  resetAllData(): Promise<AppDataSnapshot>;
  listUserAccess(): Promise<UserAccess[]>;
  updateUserAccessRole(userId: string, role: UserAccessRole): Promise<void>;
  createUserAccess(input: CreateUserAccessInput): Promise<UserAccess>;
  deleteUserAccess(userId: string, mode: UserDeleteMode): Promise<void>;
}

class MockAppDataService implements AppDataService {
  private snapshot: AppDataSnapshot = deepClone(initialSnapshot);
  private mockUserAccess: UserAccess[] = [
    {
      userId: "mock-owner",
      email: "owner@learnngrow.app",
      role: "admin",
      createdAt: new Date().toISOString(),
    },
  ];

  async getInitialSnapshot() {
    return deepClone(this.snapshot);
  }

  async addStudent(input: StudentFormInput) {
    const student: Student = {
      id: createId("stu"),
      name: input.name,
      phone: input.phone,
      batch: input.batch ?? "morning",
      joinDate: input.joinDate,
      status: input.status ?? "active",
      monthlyFee: input.monthlyFee ?? 3000,
    };

    this.snapshot.students = [student, ...this.snapshot.students];
    return deepClone(student);
  }

  async updateStudent(id: string, input: StudentFormInput) {
    const current = this.snapshot.students.find((student) => student.id === id);
    if (!current) {
      throw new Error("Student not found.");
    }

    const updated: Student = {
      ...current,
      name: input.name,
      phone: input.phone,
      batch: input.batch ?? current.batch,
      joinDate: input.joinDate,
      status: input.status ?? current.status,
      monthlyFee: input.monthlyFee ?? current.monthlyFee,
    };

    this.snapshot.students = this.snapshot.students.map((student) =>
      student.id === id ? updated : student,
    );

    return deepClone(updated);
  }

  async deleteStudent(id: string) {
    this.snapshot.students = this.snapshot.students.filter((student) => student.id !== id);
    this.snapshot.attendance = this.snapshot.attendance.filter((item) => item.studentId !== id);

    this.snapshot.finances = this.snapshot.finances.map((item) => {
      if (item.studentId === id) {
        return { ...item, studentId: null };
      }
      return item;
    });
  }

  async addTransaction(input: TransactionFormInput) {
    const transaction: FinanceTransaction = {
      id: createId("fin"),
      transactionDate: input.transactionDate,
      category: input.category,
      type: input.type,
      amount: input.amount,
      status: input.status,
      description: input.description,
      note: input.note,
      studentId: input.studentId ?? null,
    };

    this.snapshot.finances = [transaction, ...this.snapshot.finances];
    return deepClone(transaction);
  }

  async updateTransaction(id: string, input: TransactionFormInput) {
    const current = this.snapshot.finances.find((item) => item.id === id);
    if (!current) {
      throw new Error("Transaction not found.");
    }

    const updated: FinanceTransaction = {
      ...current,
      transactionDate: input.transactionDate,
      category: input.category,
      type: input.type,
      amount: input.amount,
      status: input.status,
      description: input.description,
      note: input.note,
      studentId: input.studentId ?? null,
    };

    this.snapshot.finances = this.snapshot.finances.map((item) =>
      item.id === id ? updated : item,
    );

    return deepClone(updated);
  }

  async deleteTransaction(id: string) {
    this.snapshot.finances = this.snapshot.finances.filter((item) => item.id !== id);
  }

  async toggleTransactionStatus(id: string) {
    const current = this.snapshot.finances.find((item) => item.id === id);
    if (!current) {
      throw new Error("Transaction not found.");
    }

    const updated: FinanceTransaction = {
      ...current,
      status: current.status === "paid" ? "pending" : "paid",
    };

    this.snapshot.finances = this.snapshot.finances.map((item) =>
      item.id === id ? updated : item,
    );

    return deepClone(updated);
  }

  async saveAttendance(date: string, entries: AttendanceDraft[]) {
    const preserved = this.snapshot.attendance.filter((item) => item.attendanceDate !== date);
    const existingForDate = this.snapshot.attendance.filter((item) => item.attendanceDate === date);
    const byStudent = new Map(existingForDate.map((item) => [item.studentId, item]));

    entries.forEach((entry) => {
      const current = byStudent.get(entry.studentId);
      byStudent.set(entry.studentId, {
        id: current?.id ?? createId("att"),
        studentId: entry.studentId,
        studentName: entry.studentName,
        batch: entry.batch,
        attendanceDate: date,
        status: entry.status,
        note: entry.note?.trim() || undefined,
      });
    });

    const mergedForDate = Array.from(byStudent.values());

    this.snapshot.attendance = [...preserved, ...mergedForDate];
    return deepClone(mergedForDate);
  }

  async updateProfile(input: BusinessProfile) {
    this.snapshot.profile = deepClone(input);
    return deepClone(this.snapshot.profile);
  }

  async resetAllData() {
    this.snapshot = deepClone(initialSnapshot);
    return deepClone(this.snapshot);
  }

  async listUserAccess() {
    return deepClone(this.mockUserAccess);
  }

  async updateUserAccessRole(userId: string, role: UserAccessRole) {
    const index = this.mockUserAccess.findIndex((item) => item.userId === userId);
    if (index === -1) {
      this.mockUserAccess.push({
        userId,
        email: "new.user@example.com",
        role,
        createdAt: new Date().toISOString(),
      });
      return;
    }

    this.mockUserAccess[index] = {
      ...this.mockUserAccess[index],
      role,
    };
  }

  async createUserAccess(input: CreateUserAccessInput) {
    const email = input.email.trim().toLowerCase();
    if (!email) {
      throw new Error("Email is required.");
    }

    if (input.password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    const existing = this.mockUserAccess.find((item) => item.email.toLowerCase() === email);
    if (existing) {
      throw new Error("User with this email already exists.");
    }

    const created: UserAccess = {
      userId: createId("usr"),
      email,
      role: input.role,
      createdAt: new Date().toISOString(),
    };

    this.mockUserAccess.unshift(created);
    return deepClone(created);
  }

  async deleteUserAccess(userId: string, mode: UserDeleteMode) {
    if (mode === "user") {
      this.mockUserAccess = this.mockUserAccess.filter((item) => item.userId !== userId);
      return;
    }

    this.mockUserAccess = this.mockUserAccess.map((item) =>
      item.userId === userId ? { ...item, role: null } : item,
    );
  }
}

class SupabaseAppDataService implements AppDataService {
  private profile: BusinessProfile = deepClone(initialBusinessProfile);

  private getClient() {
    if (!supabase) {
      throw new Error(
        "Supabase client is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
    }

    return supabase;
  }

  private async getCurrentAccessToken() {
    const client = this.getClient();
    let sessionData: { session: { access_token: string } | null } | null = null;
    let sessionError: { message: string } | null = null;
    try {
      const response = await client.auth.getSession();
      sessionData = response.data as { session: { access_token: string } | null } | null;
      sessionError = response.error as { message: string } | null;
    } catch (transportError) {
      throw new Error(formatTransportFailure("read current session", transportError));
    }

    if (sessionError) {
      throw new Error(`Failed to authenticate admin action: ${sessionError.message}`);
    }

    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      throw new Error("Session expired. Please sign in again.");
    }

    return accessToken;
  }

  private async fetchStudentMetaMap() {
    const client = this.getClient();
    let data: StudentMetaRow[] | null = null;
    let error: { message: string } | null = null;
    try {
      const response = await client.from("students").select("id, name, batch");
      data = response.data as StudentMetaRow[] | null;
      error = response.error as { message: string } | null;
    } catch (transportError) {
      throw new Error(formatTransportFailure("load students for attendance", transportError));
    }

    if (error) {
      throw new Error(`Failed to load students for attendance: ${error.message}`);
    }

    const map = new Map<string, { name: string; batch: Student["batch"] }>();
    ((data ?? []) as StudentMetaRow[]).forEach((row) => {
      map.set(String(row.id), {
        name: row.name,
        batch: row.batch ?? "morning",
      });
    });

    return map;
  }

  private async fetchStudents() {
    const client = this.getClient();
    let data: StudentRow[] | null = null;
    let error: { message: string } | null = null;
    try {
      const response = await client
        .from("students")
        .select("id, name, phone, batch, join_date, status, monthly_fee")
        .order("join_date", { ascending: false })
        .order("created_at", { ascending: false });
      data = response.data as StudentRow[] | null;
      error = response.error as { message: string } | null;
    } catch (transportError) {
      throw new Error(formatTransportFailure("load students", transportError));
    }

    if (error) {
      throw new Error(`Failed to load students: ${error.message}`);
    }

    return ((data ?? []) as StudentRow[]).map(mapStudentRow);
  }

  private async fetchFinances() {
    const client = this.getClient();
    let data: FinanceRow[] | null = null;
    let error: { message: string } | null = null;
    try {
      const response = await client
        .from("finances")
        .select("id, transaction_date, category, type, amount, status, description, note, student_id")
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });
      data = response.data as FinanceRow[] | null;
      error = response.error as { message: string } | null;
    } catch (transportError) {
      throw new Error(formatTransportFailure("load finances", transportError));
    }

    if (error) {
      throw new Error(`Failed to load finances: ${error.message}`);
    }

    return ((data ?? []) as FinanceRow[]).map(mapFinanceRow);
  }

  private async fetchAttendance() {
    const client = this.getClient();
    let data: AttendanceRow[] | null = null;
    let error: { message: string } | null = null;
    try {
      const response = await client
        .from("attendance")
        .select("id, student_id, student_name, batch, attendance_date, status, note")
        .order("attendance_date", { ascending: false })
        .order("created_at", { ascending: false });
      data = response.data as AttendanceRow[] | null;
      error = response.error as { message: string } | null;
    } catch (transportError) {
      throw new Error(formatTransportFailure("load attendance", transportError));
    }

    if (error) {
      if (isMissingAttendanceSchemaError(error.message)) {
        if (isMissingAttendanceTableError(error.message)) {
          console.warn(
            "Supabase attendance schema is missing in the configured project. Run supabase/schema.sql and supabase/seed.sql.",
          );
          return [];
        }

        const fallbackWithNote = await client
          .from("attendance")
          .select("id, student_id, attendance_date, status, note")
          .order("attendance_date", { ascending: false })
          .order("created_at", { ascending: false });

        let fallbackRows: AttendanceRow[] = [];

        if (fallbackWithNote.error && isMissingAttendanceColumnError(fallbackWithNote.error.message, "note")) {
          const fallbackWithoutNote = await client
            .from("attendance")
            .select("id, student_id, attendance_date, status")
            .order("attendance_date", { ascending: false })
            .order("created_at", { ascending: false });

          if (fallbackWithoutNote.error) {
            throw new Error(`Failed to load attendance: ${fallbackWithoutNote.error.message}`);
          }

          fallbackRows = (fallbackWithoutNote.data ?? []) as AttendanceRow[];
        } else if (fallbackWithNote.error) {
          throw new Error(`Failed to load attendance: ${fallbackWithNote.error.message}`);
        } else {
          fallbackRows = (fallbackWithNote.data ?? []) as AttendanceRow[];
        }

        const studentMetaMap = await this.fetchStudentMetaMap();
        return hydrateAttendanceRows(fallbackRows, studentMetaMap).map(mapAttendanceRow);
      }
      throw new Error(`Failed to load attendance: ${error.message}`);
    }

    return ((data ?? []) as AttendanceRow[]).map(mapAttendanceRow);
  }

  async getInitialSnapshot() {
    const [students, finances, attendance] = await Promise.all([
      this.fetchStudents(),
      this.fetchFinances(),
      this.fetchAttendance(),
    ]);

    return {
      students,
      finances,
      attendance,
      profile: deepClone(this.profile),
    };
  }

  async addStudent(input: StudentFormInput) {
    const client = this.getClient();
    const payload = {
      name: input.name.trim(),
      phone: input.phone.trim(),
      batch: input.batch ?? "morning",
      join_date: input.joinDate,
      status: input.status ?? "active",
      monthly_fee: input.monthlyFee ?? 3000,
    };

    const { data, error } = await client
      .from("students")
      .insert(payload)
      .select("id, name, phone, batch, join_date, status, monthly_fee")
      .single();

    if (error) {
      throw new Error(`Failed to add student: ${error.message}`);
    }

    return mapStudentRow(data as StudentRow);
  }

  async updateStudent(id: string, input: StudentFormInput) {
    const client = this.getClient();
    const payload: {
      name: string;
      phone: string;
      join_date: string;
      batch?: Student["batch"];
      status?: Student["status"];
      monthly_fee?: number;
    } = {
      name: input.name.trim(),
      phone: input.phone.trim(),
      join_date: input.joinDate,
    };

    if (input.batch) {
      payload.batch = input.batch;
    }
    if (input.status) {
      payload.status = input.status;
    }
    if (typeof input.monthlyFee === "number") {
      payload.monthly_fee = input.monthlyFee;
    }

    const { data, error } = await client
      .from("students")
      .update(payload)
      .eq("id", id)
      .select("id, name, phone, batch, join_date, status, monthly_fee")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update student: ${error.message}`);
    }

    if (!data) {
      throw new Error("Student not found.");
    }

    return mapStudentRow(data as StudentRow);
  }

  async deleteStudent(id: string) {
    const client = this.getClient();
    const { error } = await client.from("students").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete student: ${error.message}`);
    }
  }

  async addTransaction(input: TransactionFormInput) {
    const client = this.getClient();
    const note = input.note?.trim();
    const description = input.description.trim() || `${input.category} transaction`;
    const payload = {
      transaction_date: input.transactionDate,
      category: input.category,
      type: input.type,
      amount: input.amount,
      status: input.status,
      description,
      note: note || null,
      student_id: input.studentId ?? null,
    };

    let data: FinanceRow | null = null;
    let error: { message: string } | null = null;
    try {
      const response = await client
        .from("finances")
        .insert(payload)
        .select(
          "id, transaction_date, category, type, amount, status, description, note, student_id",
        )
        .single();
      data = response.data as FinanceRow | null;
      error = response.error as { message: string } | null;
    } catch (transportError) {
      throw new Error(formatTransportFailure("add transaction", transportError));
    }

    if (error) {
      throw new Error(`Failed to add transaction: ${error.message}`);
    }

    return mapFinanceRow(data as FinanceRow);
  }

  async updateTransaction(id: string, input: TransactionFormInput) {
    const client = this.getClient();
    const note = input.note?.trim();
    const description = input.description.trim() || `${input.category} transaction`;
    const payload = {
      transaction_date: input.transactionDate,
      category: input.category,
      type: input.type,
      amount: input.amount,
      status: input.status,
      description,
      note: note || null,
      student_id: input.studentId ?? null,
    };

    let data: FinanceRow | null = null;
    let error: { message: string } | null = null;
    try {
      const response = await client
        .from("finances")
        .update(payload)
        .eq("id", id)
        .select(
          "id, transaction_date, category, type, amount, status, description, note, student_id",
        )
        .maybeSingle();
      data = response.data as FinanceRow | null;
      error = response.error as { message: string } | null;
    } catch (transportError) {
      throw new Error(formatTransportFailure("update transaction", transportError));
    }

    if (error) {
      throw new Error(`Failed to update transaction: ${error.message}`);
    }

    if (!data) {
      throw new Error("Transaction not found.");
    }

    return mapFinanceRow(data as FinanceRow);
  }

  async deleteTransaction(id: string) {
    const client = this.getClient();
    const { error } = await client.from("finances").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete transaction: ${error.message}`);
    }
  }

  async toggleTransactionStatus(id: string) {
    const client = this.getClient();
    let current: { id: string; status: FinanceTransaction["status"] } | null = null;
    let fetchError: { message: string } | null = null;
    try {
      const response = await client
        .from("finances")
        .select("id, status")
        .eq("id", id)
        .maybeSingle();
      current = response.data as { id: string; status: FinanceTransaction["status"] } | null;
      fetchError = response.error as { message: string } | null;
    } catch (transportError) {
      throw new Error(formatTransportFailure("toggle transaction status", transportError));
    }

    if (fetchError) {
      throw new Error(`Failed to toggle transaction status: ${fetchError.message}`);
    }

    if (!current) {
      throw new Error("Transaction not found.");
    }

    const nextStatus: FinanceTransaction["status"] =
      current.status === "paid" ? "pending" : "paid";

    let data: FinanceRow | null = null;
    let error: { message: string } | null = null;
    try {
      const response = await client
        .from("finances")
        .update({ status: nextStatus })
        .eq("id", id)
        .select(
          "id, transaction_date, category, type, amount, status, description, note, student_id",
        )
        .single();
      data = response.data as FinanceRow | null;
      error = response.error as { message: string } | null;
    } catch (transportError) {
      throw new Error(formatTransportFailure("toggle transaction status", transportError));
    }

    if (error) {
      throw new Error(`Failed to toggle transaction status: ${error.message}`);
    }

    return mapFinanceRow(data as FinanceRow);
  }

  async saveAttendance(date: string, entries: AttendanceDraft[]) {
    const client = this.getClient();

    if (!entries.length) {
      return [];
    }

    const payload = entries.map((entry) => ({
      student_id: entry.studentId,
      student_name: entry.studentName.trim(),
      batch: entry.batch,
      attendance_date: date,
      status: entry.status,
      note: entry.note?.trim() || null,
    }));

    let payloadForUpsert: Array<Record<string, string | null>> = payload;
    let upsertError: { message: string } | null = null;

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await client.from("attendance").upsert(payloadForUpsert, {
        onConflict: "student_id,attendance_date",
      });
      upsertError = response.error as { message: string } | null;

      if (!upsertError) {
        break;
      }

      if (isMissingAttendanceColumnError(upsertError.message, "student_name")) {
        payloadForUpsert = payloadForUpsert.map(({ student_name: _studentName, ...rest }) => rest);
        continue;
      }

      if (isMissingAttendanceColumnError(upsertError.message, "batch")) {
        payloadForUpsert = payloadForUpsert.map(({ batch: _batch, ...rest }) => rest);
        continue;
      }

      if (isMissingAttendanceColumnError(upsertError.message, "note")) {
        payloadForUpsert = payloadForUpsert.map(({ note: _note, ...rest }) => rest);
        continue;
      }

      break;
    }

    if (upsertError) {
      throw new Error(`Failed to save attendance: ${upsertError.message}`);
    }

    const { data, error } = await client
      .from("attendance")
      .select("id, student_id, student_name, batch, attendance_date, status, note")
      .eq("attendance_date", date)
      .order("created_at", { ascending: false });

    if (error && isMissingAttendanceSchemaError(error.message)) {
      const fallbackWithNote = await client
        .from("attendance")
        .select("id, student_id, attendance_date, status, note")
        .eq("attendance_date", date)
        .order("created_at", { ascending: false });

      let fallbackRows: AttendanceRow[] = [];

      if (fallbackWithNote.error && isMissingAttendanceColumnError(fallbackWithNote.error.message, "note")) {
        const fallbackWithoutNote = await client
          .from("attendance")
          .select("id, student_id, attendance_date, status")
          .eq("attendance_date", date)
          .order("created_at", { ascending: false });

        if (fallbackWithoutNote.error) {
          throw new Error(`Failed to load saved attendance: ${fallbackWithoutNote.error.message}`);
        }

        fallbackRows = (fallbackWithoutNote.data ?? []) as AttendanceRow[];
      } else if (fallbackWithNote.error) {
        throw new Error(`Failed to load saved attendance: ${fallbackWithNote.error.message}`);
      } else {
        fallbackRows = (fallbackWithNote.data ?? []) as AttendanceRow[];
      }

      const studentMetaMap = await this.fetchStudentMetaMap();
      return hydrateAttendanceRows(fallbackRows, studentMetaMap).map(mapAttendanceRow);
    }

    if (error) {
      throw new Error(`Failed to load saved attendance: ${error.message}`);
    }

    return ((data ?? []) as AttendanceRow[]).map(mapAttendanceRow);
  }

  async updateProfile(input: BusinessProfile) {
    this.profile = deepClone(input);
    return deepClone(this.profile);
  }

  async resetAllData() {
    const client = this.getClient();

    const { error: clearAttendanceError } = await client
      .from("attendance")
      .delete()
      .not("id", "is", null);

    if (clearAttendanceError) {
      throw new Error(`Failed to reset attendance: ${clearAttendanceError.message}`);
    }

    const { error: clearFinancesError } = await client
      .from("finances")
      .delete()
      .not("id", "is", null);

    if (clearFinancesError) {
      throw new Error(`Failed to reset finances: ${clearFinancesError.message}`);
    }

    const { error: clearStudentsError } = await client
      .from("students")
      .delete()
      .not("id", "is", null);

    if (clearStudentsError) {
      throw new Error(`Failed to reset students: ${clearStudentsError.message}`);
    }

    const studentPayload = mockStudents.map((student) => ({
      name: student.name,
      phone: student.phone,
      batch: student.batch,
      join_date: student.joinDate,
      status: student.status,
      monthly_fee: student.monthlyFee,
    }));

    const { data: insertedStudents, error: insertStudentsError } = await client
      .from("students")
      .insert(studentPayload)
      .select("id, name, phone, batch, join_date, status, monthly_fee");

    if (insertStudentsError) {
      throw new Error(`Failed to reset students: ${insertStudentsError.message}`);
    }

    const idByLookupKey = new Map<string, string>();
    ((insertedStudents ?? []) as StudentRow[]).forEach((row) => {
      idByLookupKey.set(buildStudentLookupKey(row.name, row.phone), String(row.id));
    });

    const studentIdMap = new Map<string, string>();
    mockStudents.forEach((student) => {
      const mappedId = idByLookupKey.get(buildStudentLookupKey(student.name, student.phone));
      if (mappedId) {
        studentIdMap.set(student.id, mappedId);
      }
    });

    const financePayload = mockFinances.map((transaction) => ({
      transaction_date: transaction.transactionDate,
      category: transaction.category,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      description: transaction.description,
      note: transaction.note ?? null,
      student_id: transaction.studentId ? studentIdMap.get(transaction.studentId) ?? null : null,
    }));

    if (financePayload.length) {
      const { error: insertFinancesError } = await client.from("finances").insert(financePayload);

      if (insertFinancesError) {
        throw new Error(`Failed to reset finances: ${insertFinancesError.message}`);
      }
    }

    const attendancePayload = mockAttendance
      .map((record) => {
        const mappedStudentId = studentIdMap.get(record.studentId);
        if (!mappedStudentId) {
          return null;
        }

        return {
          student_id: mappedStudentId,
          student_name: record.studentName,
          batch: record.batch,
          attendance_date: record.attendanceDate,
          status: record.status,
          note: record.note ?? null,
        };
      })
      .filter((record): record is NonNullable<typeof record> => Boolean(record));

    if (attendancePayload.length) {
      const { error: insertAttendanceError } = await client
        .from("attendance")
        .insert(attendancePayload);

      if (insertAttendanceError && isMissingAttendanceSchemaError(insertAttendanceError.message)) {
        let fallbackPayload: Array<Record<string, string | null>> = attendancePayload;

        if (isMissingAttendanceColumnError(insertAttendanceError.message, "student_name")) {
          fallbackPayload = fallbackPayload.map(({ student_name: _studentName, ...rest }) => rest);
        }
        if (isMissingAttendanceColumnError(insertAttendanceError.message, "batch")) {
          fallbackPayload = fallbackPayload.map(({ batch: _batch, ...rest }) => rest);
        }
        if (isMissingAttendanceColumnError(insertAttendanceError.message, "note")) {
          fallbackPayload = fallbackPayload.map(({ note: _note, ...rest }) => rest);
        }

        const fallbackInsert = await client.from("attendance").insert(fallbackPayload);
        if (fallbackInsert.error) {
          throw new Error(`Failed to reset attendance: ${fallbackInsert.error.message}`);
        }
      } else if (insertAttendanceError) {
        throw new Error(`Failed to reset attendance: ${insertAttendanceError.message}`);
      }
    }

    this.profile = deepClone(initialBusinessProfile);

    return this.getInitialSnapshot();
  }

  async listUserAccess() {
    const client = this.getClient();
    let data: UserAccessRow[] | null = null;
    let error: { message: string } | null = null;

    try {
      const response = await client.rpc("list_manageable_users");
      data = response.data as UserAccessRow[] | null;
      error = response.error as { message: string } | null;
    } catch (transportError) {
      throw new Error(formatTransportFailure("load users and access roles", transportError));
    }

    if (error) {
      throw new Error(`Failed to load users and access roles: ${error.message}`);
    }

    return ((data ?? []) as UserAccessRow[]).map((row) => ({
      userId: row.user_id,
      email: row.email?.trim() || "No email",
      role: row.role,
      createdAt: row.created_at ?? new Date().toISOString(),
    }));
  }

  async updateUserAccessRole(userId: string, role: UserAccessRole) {
    const client = this.getClient();
    let error: { message: string } | null = null;

    try {
      const response = await client.rpc("upsert_user_role", {
        p_user_id: userId,
        p_role: role,
      });
      error = response.error as { message: string } | null;
    } catch (transportError) {
      throw new Error(formatTransportFailure("update user access role", transportError));
    }

    if (error) {
      throw new Error(`Failed to update user access role: ${error.message}`);
    }
  }

  async createUserAccess(input: CreateUserAccessInput) {
    const email = input.email.trim().toLowerCase();
    const password = input.password;

    if (!email) {
      throw new Error("Email is required.");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    const accessToken = await this.getCurrentAccessToken();

    let response: Response;
    try {
      response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          email,
          password,
          role: input.role,
        }),
      });
    } catch (transportError) {
      throw new Error(formatTransportFailure("create user", transportError));
    }

    let payload: CreateUserApiPayload = {};

    try {
      const parsed = (await response.json()) as unknown;
      if (parsed && typeof parsed === "object") {
        payload = parsed as CreateUserApiPayload;
      }
    } catch {
      payload = {};
    }

    if (!response.ok) {
      const message = payload?.message ?? `Request failed with status ${response.status}.`;
      throw new Error(`Failed to create user: ${message}`);
    }

    if (!payload?.userId || !payload.email || !payload.role || !payload.createdAt) {
      throw new Error("Failed to create user: Unexpected server response.");
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      createdAt: payload.createdAt,
    };
  }

  async deleteUserAccess(userId: string, mode: UserDeleteMode) {
    const accessToken = await this.getCurrentAccessToken();

    let response: Response;
    try {
      response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}?mode=${mode}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (transportError) {
      throw new Error(formatTransportFailure("delete user/access", transportError));
    }

    let payload: CreateUserApiPayload = {};
    try {
      const parsed = (await response.json()) as unknown;
      if (parsed && typeof parsed === "object") {
        payload = parsed as CreateUserApiPayload;
      }
    } catch {
      payload = {};
    }

    if (!response.ok) {
      const message = payload?.message ?? `Request failed with status ${response.status}.`;
      throw new Error(`Failed to delete user/access: ${message}`);
    }
  }
}

const useSupabaseDataService =
  process.env.NEXT_PUBLIC_USE_SUPABASE === "true" && isSupabaseConfigured;

export const dataService: AppDataService = useSupabaseDataService
  ? new SupabaseAppDataService()
  : new MockAppDataService();
