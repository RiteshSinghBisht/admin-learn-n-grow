export type StudentStatus = "active" | "inactive";
export type StudentBatch = "morning" | "evening";
export type TransactionType = "income" | "expense";
export type PaymentStatus = "paid" | "pending";
export type AttendanceStatus = "present" | "absent";
export type UserAccessRole = "admin" | "member";
export type AppAccessScope = "students" | "tasks";
export type UserDeleteMode = "access" | "user";
export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Student {
  id: string;
  name: string;
  phone: string;
  batch: StudentBatch;
  joinDate: string;
  status: StudentStatus;
  monthlyFee: number;
  teacher?: string;
}

export interface FinanceTransaction {
  id: string;
  transactionDate: string;
  category: string;
  type: TransactionType;
  amount: number;
  status: PaymentStatus;
  description: string;
  note?: string;
  studentId?: string | null;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  batch: StudentBatch;
  teacher?: string;
  attendanceDate: string;
  status: AttendanceStatus;
  note?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  eventDate: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  ownerUserId?: string;
}

export interface TaskFormInput {
  title: string;
  description?: string;
  eventDate: string;
  status?: TaskStatus;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  date: string;
  createdAt: string;
}

export interface BusinessProfile {
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
}

export interface UserAccess {
  userId: string;
  email: string;
  role: UserAccessRole | null;
  accessScopes: AppAccessScope[];
  assignedTeachers?: string[];
  createdAt: string;
}

export interface CreateUserAccessInput {
  email: string;
  password: string;
  role: UserAccessRole;
  accessScopes?: AppAccessScope[];
  assignedTeachers?: string[];
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  specialty: string;
  hubVisible: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AppDataSnapshot {
  students: Student[];
  finances: FinanceTransaction[];
  attendance: AttendanceRecord[];
  profile: BusinessProfile;
}

export interface AttendanceDraft {
  studentId: string;
  studentName: string;
  batch: StudentBatch;
  teacher?: string;
  status: AttendanceStatus;
  note?: string;
}

export interface StudentFormInput {
  name: string;
  phone: string;
  batch?: StudentBatch;
  joinDate: string;
  monthlyFee?: number;
  status?: StudentStatus;
  teacher?: string;
}

export interface TransactionFormInput {
  transactionDate: string;
  category: string;
  type: TransactionType;
  amount: number;
  status: PaymentStatus;
  description: string;
  note?: string;
  studentId?: string | null;
}
