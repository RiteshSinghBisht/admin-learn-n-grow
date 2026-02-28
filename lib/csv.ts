import type { AttendanceRecord, FinanceTransaction, Student } from "@/lib/types";

function escapeCsvValue(value: string | number) {
  const safeValue = String(value ?? "");
  if (safeValue.includes(",") || safeValue.includes("\"") || safeValue.includes("\n")) {
    return `"${safeValue.replaceAll("\"", "\"\"")}"`;
  }
  return safeValue;
}

function buildCsv(headers: string[], rows: (string | number)[][]) {
  const headerLine = headers.map(escapeCsvValue).join(",");
  const rowLines = rows.map((row) => row.map(escapeCsvValue).join(","));
  return [headerLine, ...rowLines].join("\n");
}

export function studentsToCsv(students: Student[]) {
  return buildCsv(
    ["ID", "Name", "Phone", "Batch", "Join Date", "Status", "Monthly Fee"],
    students.map((student) => [
      student.id,
      student.name,
      student.phone,
      student.batch,
      student.joinDate,
      student.status,
      student.monthlyFee,
    ]),
  );
}

export function financesToCsv(finances: FinanceTransaction[]) {
  return buildCsv(
    [
      "ID",
      "Date",
      "Category",
      "Type",
      "Amount",
      "Status",
      "Description",
      "Note",
      "Student ID",
    ],
    finances.map((item) => [
      item.id,
      item.transactionDate,
      item.category,
      item.type,
      item.amount,
      item.status,
      item.description,
      item.note ?? "",
      item.studentId ?? "",
    ]),
  );
}

export function attendanceToCsv(attendance: AttendanceRecord[]) {
  return buildCsv(
    ["ID", "Student ID", "Student Name", "Batch", "Date", "Status", "Note"],
    attendance.map((record) => [
      record.id,
      record.studentId,
      record.studentName,
      record.batch,
      record.attendanceDate,
      record.status,
      record.note ?? "",
    ]),
  );
}

export function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";
  document.body.append(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
