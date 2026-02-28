import { MONTHS_TO_SHOW } from "@/lib/constants";
import type { FinanceTransaction, Student } from "@/lib/types";

export const ALL_MONTHS_VALUE = "all";
export const ALL_MONTHS_LABEL = "All Months (Consolidated)";

function formatMonthKey(dateInput: string | Date) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(date: Date) {
  return date.toLocaleString("en-US", { month: "short" });
}

function buildMonthKeys(count: number) {
  const keys: string[] = [];
  const now = new Date();

  for (let idx = count - 1; idx >= 0; idx -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - idx, 1);
    keys.push(formatMonthKey(date));
  }

  return keys;
}

export function getCurrentMonthKey() {
  return formatMonthKey(new Date());
}

export function calculateDashboardMetrics(
  finances: FinanceTransaction[],
  students: Student[],
  monthKey = getCurrentMonthKey(),
) {
  const monthlyTransactions = finances.filter(
    (item) => formatMonthKey(item.transactionDate) === monthKey,
  );

  const totalRevenue = monthlyTransactions
    .filter((item) => item.type === "income" && item.status === "paid")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalExpenses = monthlyTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  const activeStudents = students.filter((item) => item.status === "active").length;

  const feesPending = monthlyTransactions
    .filter((item) => item.category === "Student Fee" && item.status === "pending")
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    activeStudents,
    feesPending,
  };
}

export function getIncomeExpenseTrend(
  finances: FinanceTransaction[],
  monthKey: string = ALL_MONTHS_VALUE,
) {
  if (monthKey !== ALL_MONTHS_VALUE) {
    const [year, month] = monthKey.split("-").map(Number);
    const date = new Date(year, month - 1, 1);

    const monthTransactions = finances.filter(
      (item) => formatMonthKey(item.transactionDate) === monthKey,
    );

    const income = monthTransactions
      .filter((item) => item.type === "income" && item.status === "paid")
      .reduce((sum, item) => sum + item.amount, 0);

    const expense = monthTransactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);

    return [
      {
        month: formatMonthLabel(date),
        income,
        expense,
      },
    ];
  }

  const monthKeys = buildMonthKeys(MONTHS_TO_SHOW);

  return monthKeys.map((monthKey) => {
    const [year, month] = monthKey.split("-").map(Number);
    const date = new Date(year, month - 1, 1);

    const monthTransactions = finances.filter(
      (item) => formatMonthKey(item.transactionDate) === monthKey,
    );

    const income = monthTransactions
      .filter((item) => item.type === "income" && item.status === "paid")
      .reduce((sum, item) => sum + item.amount, 0);

    const expense = monthTransactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      month: formatMonthLabel(date),
      income,
      expense,
    };
  });
}

export function getExpenseBreakdown(finances: FinanceTransaction[], monthKey: string) {
  const groupedExpenses = new Map<string, number>();

  finances.forEach((item) => {
    if (item.type !== "expense") return;
    if (monthKey !== ALL_MONTHS_VALUE && formatMonthKey(item.transactionDate) !== monthKey) {
      return;
    }

    const currentValue = groupedExpenses.get(item.category) ?? 0;
    groupedExpenses.set(item.category, currentValue + item.amount);
  });

  return Array.from(groupedExpenses.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function getAvailableMonthOptions(finances: FinanceTransaction[]) {
  const keys = new Set(finances.map((item) => formatMonthKey(item.transactionDate)));
  keys.add(getCurrentMonthKey());

  const monthOptions = Array.from(keys)
    .sort()
    .reverse()
    .map((key) => {
      const [year, month] = key.split("-").map(Number);
      const date = new Date(year, month - 1, 1);
      return {
        value: key,
        label: `${date.toLocaleString("en-US", { month: "long" })} ${year}`,
      };
    });

  return [{ value: ALL_MONTHS_VALUE, label: ALL_MONTHS_LABEL }, ...monthOptions];
}

export function filterTransactionsByMonth(
  finances: FinanceTransaction[],
  monthKey: string,
) {
  if (monthKey === ALL_MONTHS_VALUE) {
    return finances;
  }
  return finances.filter((item) => formatMonthKey(item.transactionDate) === monthKey);
}
