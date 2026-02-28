import type {
  AttendanceRecord,
  BusinessProfile,
  FinanceTransaction,
  Student,
} from "@/lib/types";

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromOffset(monthOffset: number, day: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + monthOffset, day);
  return formatDate(date);
}

const today = formatDate(new Date());

export const mockStudents: Student[] = [
  {
    id: "stu-001",
    name: "Aarav Sharma",
    phone: "+91-9876543210",
    batch: "morning",
    joinDate: dateFromOffset(-5, 8),
    status: "active",
    monthlyFee: 3000,
  },
  {
    id: "stu-002",
    name: "Meera Joshi",
    phone: "+91-9876543211",
    batch: "evening",
    joinDate: dateFromOffset(-4, 14),
    status: "active",
    monthlyFee: 3000,
  },
  {
    id: "stu-003",
    name: "Rohan Verma",
    phone: "+91-9876543212",
    batch: "morning",
    joinDate: dateFromOffset(-3, 5),
    status: "active",
    monthlyFee: 3000,
  },
  {
    id: "stu-004",
    name: "Isha Kapoor",
    phone: "+91-9876543213",
    batch: "evening",
    joinDate: dateFromOffset(-2, 20),
    status: "active",
    monthlyFee: 3000,
  },
  {
    id: "stu-005",
    name: "Kabir Singh",
    phone: "+91-9876543214",
    batch: "morning",
    joinDate: dateFromOffset(-1, 7),
    status: "inactive",
    monthlyFee: 3000,
  },
  {
    id: "stu-006",
    name: "Anaya Mishra",
    phone: "+91-9876543215",
    batch: "evening",
    joinDate: dateFromOffset(-1, 17),
    status: "active",
    monthlyFee: 3000,
  },
];

export const mockFinances: FinanceTransaction[] = [
  {
    id: "fin-001",
    transactionDate: dateFromOffset(-5, 3),
    category: "Student Fee",
    type: "income",
    amount: 8800,
    status: "paid",
    description: "Batch A fee collection",
    studentId: null,
  },
  {
    id: "fin-002",
    transactionDate: dateFromOffset(-5, 4),
    category: "Rent",
    type: "expense",
    amount: 12000,
    status: "paid",
    description: "Center rent",
  },
  {
    id: "fin-003",
    transactionDate: dateFromOffset(-5, 9),
    category: "Salary",
    type: "expense",
    amount: 18000,
    status: "paid",
    description: "Tutor payroll",
  },
  {
    id: "fin-004",
    transactionDate: dateFromOffset(-4, 3),
    category: "Student Fee",
    type: "income",
    amount: 12000,
    status: "paid",
    description: "Monthly fee collection",
    studentId: null,
  },
  {
    id: "fin-005",
    transactionDate: dateFromOffset(-4, 5),
    category: "Utilities",
    type: "expense",
    amount: 3500,
    status: "paid",
    description: "Electricity and internet",
  },
  {
    id: "fin-006",
    transactionDate: dateFromOffset(-4, 9),
    category: "Rent",
    type: "expense",
    amount: 12000,
    status: "paid",
    description: "Center rent",
  },
  {
    id: "fin-007",
    transactionDate: dateFromOffset(-3, 2),
    category: "Student Fee",
    type: "income",
    amount: 13800,
    status: "paid",
    description: "Monthly fee collection",
  },
  {
    id: "fin-008",
    transactionDate: dateFromOffset(-3, 11),
    category: "Salary",
    type: "expense",
    amount: 19000,
    status: "paid",
    description: "Tutor payroll",
  },
  {
    id: "fin-009",
    transactionDate: dateFromOffset(-2, 2),
    category: "Student Fee",
    type: "income",
    amount: 15200,
    status: "paid",
    description: "Monthly fee collection",
  },
  {
    id: "fin-010",
    transactionDate: dateFromOffset(-2, 7),
    category: "Rent",
    type: "expense",
    amount: 12000,
    status: "paid",
    description: "Center rent",
  },
  {
    id: "fin-011",
    transactionDate: dateFromOffset(-1, 4),
    category: "Student Fee",
    type: "income",
    amount: 16600,
    status: "paid",
    description: "Monthly fee collection",
  },
  {
    id: "fin-012",
    transactionDate: dateFromOffset(-1, 10),
    category: "Salary",
    type: "expense",
    amount: 20000,
    status: "paid",
    description: "Tutor payroll",
  },
  {
    id: "fin-013",
    transactionDate: dateFromOffset(0, 2),
    category: "Student Fee",
    type: "income",
    amount: 13400,
    status: "paid",
    description: "February collection",
  },
  {
    id: "fin-014",
    transactionDate: dateFromOffset(0, 5),
    category: "Student Fee",
    type: "income",
    amount: 2500,
    status: "pending",
    description: "Rohan fee pending",
    studentId: "stu-003",
  },
  {
    id: "fin-015",
    transactionDate: dateFromOffset(0, 8),
    category: "Rent",
    type: "expense",
    amount: 12000,
    status: "paid",
    description: "Center rent",
  },
  {
    id: "fin-016",
    transactionDate: dateFromOffset(0, 12),
    category: "Utilities",
    type: "expense",
    amount: 3800,
    status: "paid",
    description: "Electricity and internet",
  },
  {
    id: "fin-017",
    transactionDate: dateFromOffset(0, 14),
    category: "Salary",
    type: "expense",
    amount: 20000,
    status: "paid",
    description: "Tutor payroll",
  },
];

export const mockAttendance: AttendanceRecord[] = [
  {
    id: "att-001",
    studentId: "stu-001",
    studentName: "Aarav Sharma",
    batch: "morning",
    attendanceDate: today,
    status: "present",
  },
  {
    id: "att-002",
    studentId: "stu-002",
    studentName: "Meera Joshi",
    batch: "evening",
    attendanceDate: today,
    status: "present",
  },
  {
    id: "att-003",
    studentId: "stu-003",
    studentName: "Rohan Verma",
    batch: "morning",
    attendanceDate: today,
    status: "absent",
    note: "Sick leave",
  },
  {
    id: "att-004",
    studentId: "stu-004",
    studentName: "Isha Kapoor",
    batch: "evening",
    attendanceDate: today,
    status: "present",
  },
  {
    id: "att-005",
    studentId: "stu-006",
    studentName: "Anaya Mishra",
    batch: "evening",
    attendanceDate: today,
    status: "present",
  },
];

export const initialBusinessProfile: BusinessProfile = {
  businessName: "Learn N Grow English Coaching",
  ownerName: "Ritesh Bisht",
  phone: "+91-9876500000",
  address: "Main Market Road, Haldwani, Uttarakhand",
};
